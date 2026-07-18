// =============================================
// engine.js —— 共享引擎层（与具体单一源无关）
// 提供：调试日志、请求构造、视频解析/播放/预缓存框架、通用 Feed 兜底解析器
// 依赖：sv_multi.js / app.js 提供的运行时全局（player、players、handleFeedSource 等）
// 本文件不耦合任何单一源；删除 sources.js 后，市场源仍可正常拉取与播放
// =============================================

// 统一调试日志：Hiker 环境走 fy_bridge_app.log，浏览器预览回退 console.log
function hikerLog(msg) {
  try { if (window.fy_bridge_app && typeof window.fy_bridge_app.log === 'function') { window.fy_bridge_app.log(String(msg)); } } catch (e) {}
  try { console.log(msg); } catch (e) {}
}

// 全局容器预初始化（sourceMarket.js 注入的市场源会往这里注册；sources.js 的内置源也写入）
if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
if (!window.FeedParsers) window.FeedParsers = {};

// 防重放头部生成（tuwei.space 的 /api/girl 和 /api/developer/random-video 共用）
// 由 buildSourceRequest / prefetch 中的 dynamicHeaders: true 触发注入
window.getReplayGuardHeaders = function getReplayGuardHeaders() {
    return {
        'X-Request-Time': String(Date.now()),
        'X-Request-Nonce': crypto.randomUUID()
    };
};

/* =============================================
 * Feed 数据解析器注册表（由 handleFeedSource() 根据 source.parser 字段调用）
 * 每个源配置里的 parser 字段对应这里的一个函数名
 * 通用兜底解析器 generic 放此处；各源专属解析器在 sources.js 注册
 * ============================================= */
window.FeedParsers.generic = function(data) {
    var list = [];
    if (data.list && Array.isArray(data.list)) {
        list = data.list;
    } else if (data.data && Array.isArray(data.data)) {
        list = data.data;
    } else if (Array.isArray(data)) {
        list = data;
    }
    var result = [];
    list.forEach(function(item) {
        var post = item.post || item;
        var media = post.media || post.video || null;
        if (!media) return;
        var vurl = '';
        if (typeof media === 'string') vurl = media;
        else if (media.url) vurl = media.url;
        else if (media.src) vurl = media.src;
        else if (media.video_url) vurl = media.video_url;
        if (!vurl) return;
        result.push({
            url: vurl,
            sd_url: media.sd_url || '',
            fhd_url: media.fhd_url || '',
            user: post.user || post.author || '',
            text: post.title || post.desc || item.title || '',
            likes: post.like_count || post.likes || 0,
            comments: post.comment_count || 0,
            favorites: post.favorite_count || 0,
            tags: post.tags || item.tags || []
        });
    });
    return result;
};

/* =============================================
 * resolveVideoUrl：将网页型视频链接转为可直接播放的视频地址
 * ============================================= */
window.resolveVideoUrl = async function(videoUrl) {
    if (!videoUrl || typeof videoUrl !== 'string') return videoUrl;

    // redgifs: 构造 MP4 直链（首字母大写）
    var m = videoUrl.match(/redgifs\.com\/watch\/([\w-]+)/i);
    if (m) {
        var id = m[1];
        var mp4 = 'https://media.redgifs.com/' + id.charAt(0).toUpperCase() + id.slice(1) + '-silent.mp4';
        hikerLog('[resolveVideoUrl] redgifs MP4:', mp4);
        return mp4;
    }

    return videoUrl;
};

/* =============================================
 * fetchWithProxyFallback：带 CORS 代理重试 + localStorage 缓存的 fetch
 * ============================================= */
var _PROXY_LIST = [
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://api.allorigins.win/raw?url='
];
var _CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

window.fetchWithProxyFallback = async function fetchWithProxyFallback(url, options) {
    options = options || {};
    // 缓存 key
    var cacheKey = 'proxy_' + btoa(unescape(encodeURIComponent(url)));
    try {
        var cached = localStorage.getItem(cacheKey);
        if (cached) {
            var c = JSON.parse(cached);
            if (c && c.expires > Date.now()) return c.data;
        }
    } catch(e) {}

    var errors = [];
    // 尝试直接请求
    try {
        var r = await fetch(url, options);
        if (r.ok) {
            var ct = (r.headers.get('content-type') || '').toLowerCase();
            var data;
            if (ct.indexOf('json') >= 0) {
                data = await r.json();
            } else {
                var t = await r.text();
                try { data = JSON.parse(t); } catch(e) { data = t; }
            }
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: data,
                    expires: Date.now() + _CACHE_TTL
                }));
            } catch(e) {}
            return data;
        }
    } catch(e) { errors.push('direct: ' + (e.message || String(e))); }

    // 代理重试
    for (var pi = 0; pi < _PROXY_LIST.length; pi++) {
        var proxy = _PROXY_LIST[pi];
        try {
            var prUrl = proxy + encodeURIComponent(url);
            var pr = await fetch(prUrl, { method: 'GET', redirect: 'follow' });
            var pct = (pr.headers.get('content-type') || '').toLowerCase();
            var pdata;
            if (pct.indexOf('json') >= 0) {
                pdata = await pr.json();
            } else {
                var pt = await pr.text();
                try { pdata = JSON.parse(pt); } catch(e) { pdata = pt; }
            }
            return pdata;
        } catch(e) { errors.push('proxy' + pi + ': ' + (e.message || String(e))); }
    }
    throw new Error('[fetchWithProxyFallback] All failed: ' + errors.join(' | '));
};

/* =============================================
 * 源处理器注册表（由 players() 根据 type 字段调用）
 * 每个源 type 对应一个处理函数
 * ============================================= */
window.SourceHandlers = {
    // TXT 文件类型
    txt: function(url, done) {
        hikerLog('[源处理器] txt 类型:', url);
        var _lists = window.txtSourceVideoLists || {};

        if (_lists[url] && _lists[url].length > 0) {
            // 已有缓存，用公共函数获取下一个索引（支持随机/顺序模式）
            var list = _lists[url];
            var idx = (typeof getNextTxtIndex === 'function') ? getNextTxtIndex(url) : 0;
            if (idx >= list.length) idx = 0;
            var videoUrl = list[idx];
            hikerLog('[TXT源] 播放视频', idx + 1, '/', list.length, ':', videoUrl.substring(0, 80));
            window.SourceHandlers._setVideoSrc(videoUrl);
        } else {
            // 首次加载，fetch TXT 文件
            hikerLog('[TXT源] 首次加载:', url);
            fetch(url).then(function(r) { return r.text(); })
            .then(function(text) {
                var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l && l.startsWith('http'); });
                window.txtSourceVideoLists[url] = lines;
                window.txtSourceCurrentIndex[url] = 1;
                if (lines.length > 0) {
                    hikerLog('[TXT源] 获取到 ' + lines.length + ' 个视频');
                    window.SourceHandlers._setVideoSrc(lines[0]);
                } else {
                    console.error('[TXT源] 列表为空');
                    if (typeof done === 'function') done(); else players();
                }
            })
            .catch(function(err) {
                console.error('[TXT源] 加载失败:', err);
                if (typeof done === 'function') done(); else players();
            });
        }
    },

    // 通用视频加载函数（SourceHandlers 共用）
    // 正确处理：HLS 销毁 → 设置 src → load → 等待 canplay 后 play
    _setVideoSrc: function(url) {
        if (!url) return;
        // 防止重复注册 canplay 监听器
        if (window._sourceHandlersCanPlayHandler) {
            player.removeEventListener('canplay', window._sourceHandlersCanPlayHandler);
            window._sourceHandlersCanPlayHandler = null;
        }
        window._sourceHandlersCanPlayHandler = function() {
            player.removeEventListener('canplay', window._sourceHandlersCanPlayHandler);
            window._sourceHandlersCanPlayHandler = null;
            player.play().catch(function(e) {
                if (e && e.name !== 'AbortError') {
                    console.warn('[播放] play() 失败:', e.message || e);
                }
            });
        };
        player.addEventListener('canplay', window._sourceHandlersCanPlayHandler);
        // HLS 流
        if (url.indexOf('.m3u8') > -1) {
            if (typeof hlsInstance !== 'undefined' && hlsInstance) {
                try { hlsInstance.destroy(); } catch(e) {}
                hlsInstance = null;
            }
            if (player.canPlayType && player.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari 原生支持
                player.src = url;
                player.load();
            } else if (typeof Hls !== 'undefined') {
                hlsInstance = new Hls({
                    xhrSetup: (typeof createHlsXhrSetup === 'function') ? createHlsXhrSetup() : undefined
                });
                hlsInstance.loadSource(url);
                hlsInstance.attachMedia(player);
                hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
                    player.removeEventListener('canplay', window._sourceHandlersCanPlayHandler);
                    window._sourceHandlersCanPlayHandler = null;
                    player.play().catch(function(e) {
                        if (e && e.name !== 'AbortError') {
                            console.warn('[播放-HLS] play() 失败:', e.message || e);
                        }
                    });
                });
            } else {
                player.src = url;
                player.load();
            }
            return;
        }
        // 普通视频（MP4 等）
        if (typeof hlsInstance !== 'undefined' && hlsInstance) {
            try { hlsInstance.destroy(); } catch(e) {}
            hlsInstance = null;
        }
        player.src = url;
        player.load();
    },

    // 直接 URL 类型（API 返回视频地址，或 301 跳转到视频）
    direct: function(url, done) {
        hikerLog('[源处理器] direct 类型:', url);
        if (!url) { console.error('[源处理器] direct: URL 为空'); if (typeof done === 'function') done(); else if (typeof players === 'function') players(); return; }
        var fetchUrl = url.replace('ssss', Math.floor(Math.random() * 678 + 1));
        fetch(fetchUrl, { method: 'GET', redirect: 'follow' })
        .then(function(r) {
            var finalUrl = r.url;
            if (finalUrl && /\.mp4|\.m3u8|\.webm|\.flv/.test(finalUrl)) {
                window.SourceHandlers._setVideoSrc(finalUrl);
            } else {
                return r.text().then(function(text) {
                    var videoUrl = text.trim();
                    if (videoUrl && videoUrl.startsWith('http')) {
                        window.SourceHandlers._setVideoSrc(videoUrl);
                    } else {
                        if (typeof done === 'function') done(); else players();
                    }
                });
            }
        })
        .catch(function() { if (typeof done === 'function') done(); else players(); });
    },

    // Feed 流类型
    feed: function(url, sourceName) {
        hikerLog('[源处理器] feed 类型:', url);
        handleFeedSource(url);
    },

    // 抖一抖类型
    // API 返回纯文本 MP4 URL（如 https://tx.cdn.kwai.net/...mp4）
    douyidou: function(url, done) {
        hikerLog('[源处理器] douyidou 类型:', url);
        fetch(url, { method: 'GET', redirect: 'follow' })
        .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
        })
        .then(function(text) {
            var videoUrl = text.trim();
            // 尝试解析 JSON（以防 API 改格式）
            if (videoUrl.startsWith('{') || videoUrl.startsWith('[')) {
                try {
                    var data = JSON.parse(videoUrl);
                    if (typeof data === 'object' && data !== null) {
                        videoUrl = data.url || data.video || data.src || data.link || data.play_url || '';
                    }
                } catch(e) {}
            }
            // 处理相对协议 URL
            if (typeof videoUrl === 'string' && videoUrl) {
                if (videoUrl.startsWith('//')) {
                    videoUrl = 'https:' + videoUrl;
                } else if (videoUrl.startsWith('/')) {
                    try {
                        var u = new URL(url);
                        videoUrl = u.origin + videoUrl;
                    } catch(e) { /* ignore */ }
                } else if (!videoUrl.startsWith('http')) {
                    videoUrl = 'https:' + videoUrl;
                }
            }
            if (videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('http')) {
                hikerLog('[douyidou] 获取到视频:', videoUrl.substring(0, 80));
                window.SourceHandlers._setVideoSrc(videoUrl);
            } else {
                console.warn('[douyidou] 响应无效:', text.substring(0, 200));
                if (typeof done === 'function') done(); else players();
            }
        })
        .catch(function(err) {
            console.error('[douyidou] 请求失败:', err.message || err);
            if (typeof done === 'function') done(); else players();
        });
    },

    // yujn 类型（API 直接返回视频流，301 跳转）
    yujn: function(url, done) {
        hikerLog('[源处理器] yujn 类型:', url);
        fetch(url, { method: 'GET', redirect: 'follow' })
        .then(function(r) {
            var finalUrl = r.url;
            if (finalUrl && /\.(mp4|m3u8)(\?|$)/.test(finalUrl)) {
                window.SourceHandlers._setVideoSrc(finalUrl);
                return;
            }
            // 响应不是视频 URL，解析响应体
            return r.text().then(function(text) {
                var videoUrl = text.trim();
                // 尝试解析 JSON
                if (videoUrl.startsWith('{') || videoUrl.startsWith('[')) {
                    try {
                        var data = JSON.parse(videoUrl);
                        if (typeof data === 'object' && data !== null) {
                            // linhun 接口：{video: "..."}；其他接口：{url: "..."}
                            videoUrl = data.video || data.url || data.data || data.src || data.link || data.play_url || '';
                        }
                    } catch(e) { /* ignore */ }
                }
                // 处理相对协议 URL
                if (typeof videoUrl === 'string' && videoUrl && !videoUrl.startsWith('http')) {
                    if (videoUrl.startsWith('//')) {
                        videoUrl = 'https:' + videoUrl;
                    } else if (videoUrl.startsWith('/')) {
                        try {
                            var u = new URL(url);
                            videoUrl = u.origin + videoUrl;
                        } catch(e) { /* ignore */ }
                    }
                }
                if (videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('http')) {
                    window.SourceHandlers._setVideoSrc(videoUrl);
                } else {
                    if (typeof done === 'function') done(); else players();
                }
            });
        })
        .catch(function() { if (typeof done === 'function') done(); else players(); });
    },

    // wudada 类型（JSON 响应，data.data 字段是直接视频 URL）
    wudada: function(url, done) {
        hikerLog('[源处理器] wudada 类型:', url);
        $.get(url, function(data) {
            var videoUrl = '';
            if (typeof data === 'object' && data !== null) {
                videoUrl = data.data || data.url || data.video || '';
            } else if (typeof data === 'string') {
                try { var j = JSON.parse(data); videoUrl = j.data || j.url || ''; } catch(e) { videoUrl = data; }
            }
            if (videoUrl && typeof videoUrl === 'string' && !videoUrl.startsWith('http')) {
                videoUrl = 'https:' + videoUrl;
            }
            if (videoUrl) {
                window.SourceHandlers._setVideoSrc(videoUrl);
            } else {
                if (typeof done === 'function') done(); else players();
            }
        }).fail(function() { if (typeof done === 'function') done(); else players(); });
    }
};

/* =============================================
 * 构建源的 fetch 请求参数（所有源相关逻辑集中于此）
 * 返回 { fetchUrl, fetchOptions, useProxy }
 * ============================================= */
window.buildSourceRequest = function(_curl, _curSrc, _feedInfo) {
    // _feedInfo: { feedVideoList, currentFeedIndex, randomPlay }
    // 兜底：curl 为 undefined 时回退到源的 url，再兜底为空串（绝不返回 undefined）
    var fetchUrl = _curl || (_curSrc && _curSrc.url) || '';
    var fetchOptions = {};
    var useProxy = false;

    if (_curSrc && _curSrc.fetch) {
        var cfg = _curSrc.fetch;
        fetchOptions.method = cfg.method || 'GET';
        if (cfg.headers) fetchOptions.headers = Object.assign({}, cfg.headers);
        // 透传 credentials（如 cross-origin 带会话 cookie 的源：xfree 翻页 next 接口需 credentials:include）
        if (cfg.credentials) fetchOptions.credentials = cfg.credentials;

        // 动态 headers 生成（如需要 X-Request-Time / X-Request-Nonce 的源）
        if (cfg.dynamicHeaders) {
            if (!fetchOptions.headers) fetchOptions.headers = {};
            var _rh = getReplayGuardHeaders();
            for (var _rk in _rh) { fetchOptions.headers[_rk] = _rh[_rk]; }
        }

        // tuwei.space：X-Request-Time / X-Request-Nonce 由 dynamicHeaders: true 处理
        // X-Client-Device / X-Client-Token 已在改为 developer API 后移除

        // ---- {page} 分页占位符（支持 URL 和 body）----
        var needsPage = (fetchUrl.indexOf('{page}') !== -1) || (cfg.body && cfg.body.indexOf('{page}') !== -1);
        if (needsPage) {
            if (!window._srcPage) window._srcPage = {};
            var pk = cfg.pageKey || _curSrc.name;
            var lk = '_lu_' + pk;
            var cp = window._srcPage[pk] || 1;

            if (cfg.randomPage) {
                // 随机页码：每次都随机
                var maxPg = cfg.maxPage || 50;
                cp = Math.floor(Math.random() * maxPg) + 1;
                window._srcPage[pk] = cp;
                window._srcPage[lk] = _curl;
            } else {
                // 顺序翻页（仅顺序模式需要翻页，随机模式不翻页）
                // 顺序翻页（仅 591 源尊重随机设置，其他源强制顺序）
                var _isSeq = true;
                if (_curSrc && _curSrc.name && _curSrc.name.indexOf('591') === 0) {
                    _isSeq = !(_feedInfo && _feedInfo.randomPlay);
                }
                if (window._srcPage[lk] !== _curl) {
                    // URL 变了（换了分类），页码重置为 1
                    cp = 1; window._srcPage[lk] = _curl;
                }
                // 注意：页码递增由调用方（players()）负责，这里只读取不递增
                window._srcPage[pk] = cp;
            }

            // 替换 URL 和 body 中的 {page}
            if (fetchUrl.indexOf('{page}') !== -1) {
                fetchUrl = fetchUrl.replace(/\{page\}/g, cp);
            }
            if (cfg.body && cfg.body.indexOf('{page}') !== -1) {
                cfg = Object.assign({}, cfg, { body: cfg.body.replace(/\{page\}/g, cp) });
            }

            // 替换 {startTime} 为当前时间戳（秒），用于需要时间戳的 API（如 xxxfollow）
            if (fetchUrl.indexOf('{startTime}') !== -1) {
                fetchUrl = fetchUrl.replace(/\{startTime\}/g, Math.floor(Date.now() / 1000));
            }
        }

        // ---- {cursor} 游标分页（独立于 {page}，xxxtik 等源使用）----
        if (fetchUrl.indexOf('{cursor}') !== -1) {
            if (!window._srcCursor) window._srcCursor = {};
            var ck = 'cursor_' + (_curSrc ? _curSrc.name : '') + '_' + (_feedInfo && _feedInfo.cat || '');
            var cursor = window._srcCursor[ck] || '';
            // cursor 为空时移除整个 &cursor= 参数（首次请求不携带）
            if (!cursor) {
                fetchUrl = fetchUrl.replace(/[?&]cursor=\{cursor\}/g, '');
            } else {
                fetchUrl = fetchUrl.replace(/\{cursor\}/g, cursor);
            }
        }

        if (cfg.body) {
            var body = cfg.body;
            // {catType} / {catOrderBy} 分类占位符（屋里社）
            if (body.indexOf('{catType}') !== -1 || body.indexOf('{catOrderBy}') !== -1) {
                var cm = _curl.match(/[?&]cat=([^&]+)/);
                var cat = cm ? decodeURIComponent(cm[1]) : 'all-date';
                var pp = cat.split('-');
                body = body.replace('{catType}', pp[0] || 'all');
                body = body.replace('{catOrderBy}', pp[1] || 'date');
            }
            fetchOptions.body = body;
        }

        useProxy = !!cfg.useProxy;
    }
    // 没有 fetch 配置的源：返回默认空对象
    return { fetchUrl: fetchUrl, fetchOptions: fetchOptions, useProxy: useProxy };
};

/* =============================================
 * 预缓存策略注册表（由 prefetchNextVideo() 根据 type 字段调用）
 * 每个源 type 对应一个预缓存函数
 * 函数签名：function(url, done)
 *   url: 当前源 URL
 *   done: 完成后回调（无论成功/失败都要调用，释放 isPrefetching 锁）
 * ============================================= */
window.PrefetchStrategies = {
    // Feed 流类型：从 feedVideoList 缓存中取下一个
    feed: function(url, done) {
        // 获取当前源配置，判断是否为 mode:single
        var _curSrc = null;
        var _srcL = window.DEFAULT_SOURCES || DEFAULT_SOURCES || [];
        var _cname = localStorage.getItem('xjjname') || '';
        for (var _i = 0; _i < _srcL.length; _i++) {
            if (_srcL[_i].url === url) { _curSrc = _srcL[_i]; break; }
        }
        if (!_curSrc && _cname) {
            for (var _j = 0; _j < _srcL.length; _j++) {
                if (_srcL[_j].name && _cname.indexOf(_srcL[_j].name) === 0) { _curSrc = _srcL[_j]; break; }
            }
        }

        // 安全修复：currentFeedIndex 未定义时初始化为 0
        if (typeof currentFeedIndex === 'undefined') currentFeedIndex = 0;
        // 注意：currentFeedIndex >= feedVideoList.length 表示列表已播完，不重置为0（让调用方触发重新请求）
        // mode:single：缓存用完时提前拉下一个视频
        if (_curSrc && _curSrc.mode === 'single') {
            // 还有缓存，直接用（但 mode:single 缓存只有1个，用完即清空）
            if (typeof feedVideoList !== 'undefined' && feedVideoList.length > 0 && currentFeedIndex < feedVideoList.length) {
                var nextData = feedVideoList[currentFeedIndex];
                prefetchedFeedData = nextData;
                var nextUrl = nextData.fhd_url || nextData.sd_url || nextData.url;
                if (nextUrl) loadNextVideoEl(nextUrl, nextData);
                // 关键：mode:single 用完缓存立即清空，迫使下次重新请求新视频
                feedVideoList = [];
                currentFeedIndex = 0;
                hikerLog('[prefetch] mode:single 缓存已用完，下次将重新请求');
                done();
                return;
            }
            // 缓存用完，提前拉下一个
            hikerLog('[prefetch] mode:single 缓存用完，提前拉下一个视频');
            var pUrl = url;
            // 随机选分类（扁平分组）
            if (_curSrc.urlTemplate && _curSrc.categoryGroups && _curSrc.categoryGroups.length) {
                var fg = _curSrc.categoryGroups[0];
                if (fg.flat && fg.options && fg.options.length) {
                    var rc = fg.options[Math.floor(Math.random() * fg.options.length)];
                    pUrl = _curSrc.urlTemplate.replace(/\{cat\}/g, rc.value);
                }
            }
            var pOpts = {};
            if (_curSrc.fetch) {
                pOpts.method = _curSrc.fetch.method || 'GET';
                if (_curSrc.fetch.body) pOpts.body = _curSrc.fetch.body;
                if (_curSrc.fetch.headers) pOpts.headers = Object.assign({}, _curSrc.fetch.headers);
                // POST 请求时去掉 URL 中的查询参数
                if (pOpts.method === 'POST' && pUrl.indexOf('?') > -1) {
                    pUrl = pUrl.split('?')[0];
                }
                if (_curSrc.fetch.dynamicHeaders) {
                    if (!pOpts.headers) pOpts.headers = {};
                    var _rh = getReplayGuardHeaders();
                    for (var _rk in _rh) { pOpts.headers[_rk] = _rh[_rk]; }
                }
                // tuwei.space 已改用 developer API（dynamicHeaders），旧 X-Client-Device/X-Client-Token 已移除
            }
            fetch(pUrl, pOpts)
                .then(function(r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(function(data) {
                    // 检查是否被 parser 标记为 402（TuWei 匿名额度用完）
                    if (window._tuwei402) {
                        window._tuwei402 = false;
                        console.warn('[prefetch] mode:single TuWei 402，停止预加载');
                        done();
                        return;
                    }
                    var fn = _curSrc.parser ? window.FeedParsers[_curSrc.parser] : null;
                    var vList = (typeof fn === 'function') ? fn(data) : window.FeedParsers.generic(data);
                    if (vList && vList.length > 0) {
                        // 只缓存第一个，mode:single 每次只播一个
                        prefetchedFeedData = vList[0];
                        var pu = vList[0].fhd_url || vList[0].sd_url || vList[0].url;
                        if (pu) loadNextVideoEl(pu, vList[0]);
                        hikerLog('[prefetch] mode:single 预拉取成功');
                    } else {
                        console.warn('[prefetch] mode:single 预拉取返回空列表');
                    }
                    done();
                })
                .catch(function(err) {
                    console.warn('[prefetch] mode:single 预拉取失败:', err.message);
                    done();
                });
            return;
        }

        // mode:multi：从缓存取下一个（随机模式用 getNextFeedIndex，顺序模式用 currentFeedIndex）
        if (typeof feedVideoList === 'undefined' || feedVideoList.length === 0) {
            // 列表已空，触发重新请求（强制绕过防抖）
            hikerLog('[prefetch] mode:multi 列表已空，触发重新请求');
            // 先标记列表已播完，让 players() 能正确检测到
            if (typeof currentFeedIndex !== 'undefined' && feedVideoList && feedVideoList.length > 0) {
                currentFeedIndex = feedVideoList.length;
            }
            setTimeout(function() {
                if (typeof players === 'function') players(true);
            }, 0);
            done(); return;
        }
        // 仅 591 源尊重随机设置，其他源强制顺序
        var _curNamePrefetch = localStorage.getItem('xjjname') || '';
        var _isRandomPrefetch = false;
        if (_curNamePrefetch.indexOf('591') === 0) {
            _isRandomPrefetch = localStorage.getItem('randomPlay') === 'true' || localStorage.getItem('txtSourceRandomPlay') === 'true';
        }
        if (_isRandomPrefetch) {
            // 随机模式：只要列表有数据就随机挑一个预加载
            if (typeof getNextFeedIndex === 'function') {
                var _rIdx = getNextFeedIndex();
                if (_rIdx >= 0 && _rIdx < feedVideoList.length) {
                    var rNextData = feedVideoList[_rIdx];
                    prefetchedFeedData = rNextData;
                    var rNextUrl = rNextData.fhd_url || rNextData.sd_url || rNextData.url;
                    if (rNextUrl) loadNextVideoEl(rNextUrl, rNextData);
                }
            }
        } else {
            // 顺序模式：预加载 currentFeedIndex 的视频（currentFeedIndex 指向下一个要播放的）
            // 注意：currentFeedIndex 指向下一个要播放的视频，所以预加载 currentFeedIndex 即可
            if (currentFeedIndex >= feedVideoList.length) {
                // 列表已播完：清空预缓存，让 doSwitchToNext() 调用 players() 重新请求
                prefetchedFeedData = null;
                prefetchedUrl = '';
                hikerLog('[prefetch] mode:multi 顺序模式列表已播完 (' + currentFeedIndex + '/' + feedVideoList.length + ')，清空预缓存，等待重新请求');
                done(); return;
            }
            var _nextIdx = currentFeedIndex; // 预加载下一个要播放的视频
            var nextData = feedVideoList[_nextIdx]; // 预加载下一个
            prefetchedFeedData = nextData;
            var nextUrl = nextData.fhd_url || nextData.sd_url || nextData.url;
            if (nextUrl) {
                loadNextVideoEl(nextUrl, nextData);
            }
        }
        done();
    },

    // 直接 URL 类型：fetch 一次拿真实地址
    direct: function(url, done) {
        if (!url) { console.error('[预缓存-direct] URL 为空'); done(); return; }
        var fetchUrl = url.replace('ssss', Math.floor(Math.random() * 678 + 1));
        fetch(fetchUrl, { method: 'GET', redirect: 'follow' })
        .then(function(r) {
            var finalUrl = r.url;
            if (finalUrl && /\.mp4|\.m3u8|\.webm|\.flv/.test(finalUrl)) {
                prefetchedUrl = finalUrl;
                loadNextVideoEl(finalUrl, null);
            } else {
                return r.text().then(function(text) {
                    var trimmed = text.trim();
                    if (trimmed && trimmed.startsWith('http')) {
                        prefetchedUrl = trimmed;
                        loadNextVideoEl(trimmed, null);
                    }
                    done();
                });
            }
        })
        .catch(function() {})
        .finally(function() { done(); });
    },

    // TXT 文件类型：从 txtSourceVideoLists 缓存中取下一个
    txt: function(url, done) {
        if (typeof window.txtSourceVideoLists === 'undefined' || !window.txtSourceVideoLists[url] || window.txtSourceVideoLists[url].length === 0) {
            done(); return;
        }
        var list = window.txtSourceVideoLists[url];
        // 用公共函数获取下一个索引（支持随机/顺序模式）
        var nextIndex = (typeof getNextTxtIndex === 'function') ? getNextTxtIndex(url) : 0;
        var nextUrl = list[nextIndex];
        if (nextUrl) {
            prefetchedUrl = nextUrl;
            loadNextVideoEl(nextUrl, null);
            // 记录预缓存的 index，供 doSwitchToNext() 确认
            window._prefetchedTxtNextIndex = nextIndex;
            // 只在前一个视频快结束（预缓存真正被消费）时才打日志，避免刷屏
            // console.log('[PrefetchStrategies.txt] 预缓存视频', nextIndex + 1, '/', list.length, ':', nextUrl.substring(0, 60));
        }
        done();
    },

    // 抖一抖类型：$.get 获取视频 URL
    douyidou: function(url, done) {
        $.get(url, function(data) {
            var videoUrl = '';
            if (typeof data === 'object' && data !== null) {
                videoUrl = data.url || data.video || data.video || data.src || data.link || data.play_url || '';
            }
            if (typeof videoUrl === 'string' && videoUrl && !videoUrl.startsWith('http')) {
                videoUrl = 'https:' + videoUrl;
            }
            if (videoUrl) {
                prefetchedUrl = videoUrl;
                loadNextVideoEl(videoUrl, null);
            }
            done();
        }).fail(function() { done(); });
    },

    // yujn 类型：fetch + redirect:follow
    yujn: function(url, done) {
        fetch(url, { method: 'GET', redirect: 'follow' })
        .then(function(r) {
            var finalUrl = r.url;
            if (finalUrl && /\.(mp4|m3u8)(\?|$)/.test(finalUrl)) {
                prefetchedUrl = finalUrl;
                loadNextVideoEl(finalUrl, null);
            } else {
                return r.text().then(function(text) {
                    var videoUrl = text.trim();
                    // 尝试解析 JSON
                    if (videoUrl.startsWith('{') || videoUrl.startsWith('[')) {
                        try {
                            var data = JSON.parse(videoUrl);
                            if (typeof data === 'object' && data !== null) {
                                videoUrl = data.video || data.url || data.data || data.src || data.link || data.play_url || '';
                            }
                        } catch(e) { /* ignore */ }
                    }
                    if (typeof videoUrl === 'string' && videoUrl && !videoUrl.startsWith('http')) {
                        if (videoUrl.startsWith('//')) {
                            videoUrl = 'https:' + videoUrl;
                        } else if (videoUrl.startsWith('/')) {
                            try {
                                var u = new URL(url);
                                videoUrl = u.origin + videoUrl;
                            } catch(e) { /* ignore */ }
                        }
                    }
                    if (videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('http')) {
                        prefetchedUrl = videoUrl;
                        loadNextVideoEl(videoUrl, null);
                    }
                    done();
                });
            }
        })
        .catch(function() { done(); });
    },

    // wudada 类型：$.get 拿 data.data
    wudada: function(url, done) {
        $.get(url, function(data) {
            var videoUrl = '';
            if (typeof data === 'object' && data !== null) {
                videoUrl = data.data || data.url || data.video || '';
            } else if (typeof data === 'string') {
                try { var j = JSON.parse(data); videoUrl = j.data || j.url || ''; } catch(e) { videoUrl = data; }
            }
            if (videoUrl && typeof videoUrl === 'string' && !videoUrl.startsWith('http')) {
                videoUrl = 'https:' + videoUrl;
            }
            if (videoUrl) {
                prefetchedUrl = videoUrl;
                loadNextVideoEl(videoUrl, null);
            }
            done();
        }).fail(function() { done(); });
    }
};
