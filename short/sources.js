// [调试] 统一调试日志：Hiker 环境走 fy_bridge_app.log（在 Hiker 日志面板可见），浏览器预览回退 console.log
function hikerLog(msg) {
  try { if (window.fy_bridge_app && typeof window.fy_bridge_app.log === 'function') { window.fy_bridge_app.log(String(msg)); } } catch (e) {}
  try { console.log(msg); } catch (e) {}
}

window.DEFAULT_SOURCES = [
	// ---- yujn（默认）----
	// ---- 直接URL类型（type: "direct"）----	
	{ name: "yujn", url: "http://api.yujn.cn/api/zzxjj.php",
		type: "yujn", mode: "single",
		categoryGroups: [
			{ label: "分类", param: "cat", flat: true, options: [
			{ label: "zz小姐姐", value: "zzxjj" }, { label: "小姐姐", value: "xjj" },
			{ label: "女大学生", value: "nvda" }, { label: "黑丝", value: "heisi" },
			{ label: "cos", value: "manzhan" }, { label: "白丝", value: "baisi" },
			{ label: "身材", value: "wmsc" }, { label: "蛇姐", value: "shejie" },
			{ label: "吊带", value: "diaodai" }, { label: "玉足", value: "jpmt" },
			{ label: "清纯", value: "qingchun" }, { label: "汉服", value: "hanfu" },
			{ label: "萝莉", value: "luoli" }
		
			] }
		],		urlTemplate: "http://api.yujn.cn/api/{cat}.php"
	},
	{ name: "抖一抖", url: "https://www.douyidou.com/get/get1.php",
		type: "douyidou", mode: "single",
		categoryGroups: [
			{ label: "分类", param: "cat", flat: true, options: [
			{ label: "混合1", value: "get1" }, { label: "混合2", value: "get2" },
			{ label: "JK制服", value: "get3" }, { label: "欲梦", value: "get4" },
			{ label: "女大", value: "get5" }, { label: "女高", value: "get6" },
			{ label: "热舞", value: "get7" }, { label: "清纯", value: "get8" },
			{ label: "蛇姐", value: "get9" }, { label: "穿搭", value: "get10" },
			{ label: "高质量", value: "get11" }, { label: "汉服", value: "get12" },
			{ label: "黑丝", value: "get13" }, { label: "变装", value: "get14" },
			{ label: "萝莉", value: "get15" }, { label: "甜妹", value: "get16" },
			{ label: "白丝", value: "get17" }
		
			] }
		],		urlTemplate: "https://www.douyidou.com/get/{cat}.php"
	},
	{ name: "秀抖", url: "https://api.xudu.org/vos/vc?_t=0.10247156996766538", type: "direct", mode: "single" },
    { name: "抖抖", url: "http://dou.plus/get/get1.php", type: "direct", mode: "single" },
	{ name: "内涵小姐姐", url: "https://v.nrzj.vip/video.php?_t=0", type: "direct", mode: "single" },
	{ name: "xjj2", url: "http://xjj2.716888.xyz/fenlei/djxjj/dj1.php?_t=0", type: "direct", mode: "single" },
	{ name: "wudada", url: "http://www.wudada.online/Api/ScSp", type: "wudada", mode: "single" },
	{ name: "188sp", url: "https://188sp.711888.xyz/188/video.php?_t=0", type: "direct", mode: "single" },
	{ name: "远梦API", url: "https://api.mmp.cc/api/miss?type=mp4", type: "direct", mode: "single" },
	{ name: "dwoAPI", url: "https://openapi.dwo.cc/api/ksvideo", type: "direct", mode: "single" },
	{ name: "蓝莓API", url: "https://api.xiaotuo.net/api.php?act=Api_send&id=86&apikey=987bbfa9-aa4f-2406-631d-a2d384ae4e44d45bd690",
		type: "feed", mode: "single", parser: "lanmei"
	},
	{ name: "小职API", url: "http://api.4qb.cn/api/suiji-sp?msg=热舞&type=json",
		type: "feed", mode: "single", parser: "xiaoZhi"
	},
	{ name: "小众API", url: "https://api.xzdx.top/xjj",
		type: "feed", mode: "single", parser: "xzdx"
	},
	{ name: "TuWei", url: "https://www.tuwei.space/api/girl",
		type: "feed", mode: "single", parser: "tuwei",
		fetch: {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Client-Device': '64fddbe1-776e-44b0-90fb-0c3606ba94cd',
				'X-Client-Token': 'QORLIX2XE3F1T554K0YBHTCANQ7FAH7F'
			},
			dynamicHeaders: true,
			body: JSON.stringify({id:1,status:0,type:1})
		}
	},	
	// ---- TXT文件类型（type: "txt"）----
	{ name: "591meta", url: "https://v.591meta.com/ks.txt", type: "txt", mode: "multi" },

	// ---- JSON Feed流类型（type: "feed"）----
	{ name: "抖妹", url: "https://www.doumei.cc/api/v1/recommend", type: "feed", mode: "multi", parser: "doumei",
		fetch: { useProxy: true }
	},
	{ name: "美女极致", url: "https://p.txqq.pro/api/girls?limit=20", type: "feed", mode: "multi", parser: "meinv" },
	
];

/* 防重放头部生成（TuWei API 专用） */
// 防重放头部生成（tuwei.space 的 /api/girl 和 /api/developer/random-video 共用）
// headers 注入在 buildSourceRequest / prefetch 中用 dynamicHeaders: true 触发
window.getReplayGuardHeaders = function getReplayGuardHeaders() {
    return {
        'X-Request-Time': String(Date.now()),
        'X-Request-Nonce': crypto.randomUUID()
    };
};

/* =============================================
 * Feed 数据解析器注册表（由 handleFeedSource() 根据 source.parser 字段调用）
 * 每个源配置里的 parser 字段对应这里的一个函数名
 * 新增数据格式：只需在此文件加一个解析函数，不需要改 app.js
 * ============================================= */
window.FeedParsers = {
    /* JAV Trailers 格式 */
    javtrailers: function(data) {
        if (!data.shorts || !Array.isArray(data.shorts)) return [];
        return data.shorts.filter(function(s) { return s.csuid || s.bid; }).map(function(item) {
            var bid = item.bid || item.csuid || '';
            var cdnPath = '';
            if (typeof bid === 'string') {
                if (bid.startsWith('http')) {
                    try { cdnPath = new URL(bid).pathname; } catch(e) { cdnPath = '/' + bid; }
                } else {
                    cdnPath = '/' + bid + '/360p/video.m3u8';
                }
            }
            // 走本地 server.js 代理，自动带上 Referer/Origin 绕过 CDN 防盗链
            var url = cdnPath ? ('http://localhost:8080/jav-video' + cdnPath) : '';
            return {
                url: url,
                sd_url: '',
                fhd_url: '',
                user: item.creator ? item.creator.username : '',
                text: item.videoContentId || '',
                likes: 0,
                comments: 0,
                favorites: 0,
                tags: item.tags || []
            };
        });
    },



    /* 抖妹 格式（data 数组，content 字段） */
    doumei: function(data) {
        var list = data.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        return list.filter(function(item) { return item.content; }).map(function(item) {
            return {
                url: item.content,
                sd_url: '',
                fhd_url: '',
                user: item.author || item.user || '',
                text: item.desc || item.title || '',
                likes: item.like || item.likes || 0,
                comments: item.comment || item.comments || 0,
                favorites: item.favorite || item.favorites || 0,
                tags: item.tags || []
            };
        });
    },

    /* 美女极致 格式（list 数组，video_url 字段） */
    meinv: function(data) {
        var list = data.list && Array.isArray(data.list) ? data.list : [];
        return list.filter(function(item) { return item.video_url; }).map(function(item) {
            return {
                url: item.video_url,
                sd_url: '',
                fhd_url: '',
                user: item.author || '',
                text: item.title || '',
                likes: item.like_count || 0,
                comments: 0,
                favorites: 0,
                tags: []
            };
        });
    },





    /* 通用 Feed 格式（list[].post.media） */
    generic: function(data) {
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
    },

    /* TuWei 格式（单次返回一个视频，支持新旧API结构） */
    tuwei: function(data) {
        // 提取额度信息
        var _used, _limit, _balance;
        if (data && data.data) {
            // 新版：data.data.limit 包含额度
            if (data.data.limit) {
                var lim = data.data.limit;
                if (lim.user) {
                    _used = lim.user.used_count;
                    _limit = lim.user.free_limit;
                    _balance = lim.user.balance;
                } else {
                    _used = lim.anon_count;
                    _limit = lim.anon_limit;
                }
            }
            // 旧版：data.data 直接有 anon_count
            if (_used === undefined && data.data.anon_count !== undefined) {
                _used = data.data.anon_count;
                _limit = data.data.anon_limit || 100;
            }
            if (_used !== undefined) {
                var _remaining = Math.max(0, _limit - _used);
                if (_balance !== undefined) _remaining = _balance;
                window._tuweiQuota = { used: _used, limit: _limit, remaining: _remaining, balance: _balance };
                hikerLog('[TuWei 额度] 已用 ' + _used + '/' + _limit + '，剩余 ' + _remaining + (_balance !== undefined ? ' (余额 ' + _balance + ')' : ''));
            }
        }
        if (!data || data.code !== 200 || !data.data || !data.data.video) {
            if (data && data.code === 402) {
                var _q = window._tuweiQuota || { used: '?', limit: 100, remaining: 0 };
                console.warn('[FeedParsers.tuwei] 额度已用完 (' + _q.used + '/' + _q.limit + ')，' + (data.msg || ''));
                window._tuwei402 = true;
                window._tuwei402Msg = data.msg || '额度已用完';
            } else {
                console.warn('[FeedParsers.tuwei] 数据异常:', data);
            }
            return [];
        }
        var v = data.data.video;
        var videoUrl = v.Path || '';
        // Path 是相对路径，需要补全域名
        if (videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('/')) {
            videoUrl = 'https://www.tuwei.space' + videoUrl;
        }
        hikerLog('[tuwei parser] 视频URL:', videoUrl, '| id:', v.Id || 'unknown');
        return [{
            url: videoUrl,
            sd_url: '',
            fhd_url: '',
            user: v.User || '',
            text: v.Name || '',
            likes: 0,
            comments: 0,
            favorites: 0,
            tags: []
        }];
    },

    /* 小职API 格式（单次返回一个随机视频） */
    xiaoZhi: function(data) {
        hikerLog('[xiaoZhi parser] 原始数据:', JSON.stringify(data).substring(0,300));
        if (!data || data.code !== 1 || !data.data || !data.data.url) {
            // 兼容: data.cover 或 data.url 在根级
            if (data && data.data && typeof data.data === 'string' && data.data.length > 10) {
                return [{url: data.data.replace(/\\?\//g,'/'), sd_url:'', fhd_url:'', user:'', text:'', likes:0, comments:0, favorites:0, tags:[]}];
            }
            if (data && data.url && typeof data.url === 'string') {
                var vu = data.url.startsWith('//') ? 'https:'+data.url : data.url;
                return [{url: vu, sd_url:'', fhd_url:'', user:'', text:data.text||data.title||'', likes:0, comments:0, favorites:0, tags:[]}];
            }
            console.warn('[FeedParsers.xiao职] 数据异常:', data);
            return [];
        }
        var d = data.data;
        var videoUrl = d.url || '';
        // 补全协议（如果是 // 开头）
        if (videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('//')) {
            videoUrl = 'http:' + videoUrl;
        }
        return [{
            url: videoUrl,
            sd_url: '',
            fhd_url: '',
            user: '',
            text: d.mold || '',
            likes: 0,
            comments: 0,
            favorites: 0,
            tags: d.mold ? [d.mold] : []
        }];
    },
    /* 蓝莓API 格式（单次返回一个视频 URL） */
    lanmei: function(data) {
        hikerLog('[lanmei parser] 原始数据:', JSON.stringify(data).substring(0,300));
        // 频率限制：code 201，优雅处理，不报错误，返回空数组让上层跳过
        if (data && data.code === 201) {
            hikerLog('[FeedParsers.lan梅] 频率限制，暂停请求（' + (data.msg || '') + '）');
            return [];
        }
        if (!data || data.code !== 200 || !data.data) {
            console.warn('[FeedParsers.lan梅] 数据异常:', data);
            return [];
        }
        var videoUrl = '';
        if (typeof data.data === 'string') {
            videoUrl = data.data;
            videoUrl = videoUrl.replace(/\\?\//g, '/');
        } else if (typeof data.data === 'object') {
            videoUrl = data.data.url || data.data.video || data.data.src || data.data.path || data.data.cover || '';
            if (typeof videoUrl === 'string') videoUrl = videoUrl.replace(/\\?\//g, '/');
        }
        return [{
            url: videoUrl,
            sd_url: '',
            fhd_url: '',
            user: '',
            text: data.msg || '',
            likes: 0,
            comments: 0,
            favorites: 0,
            tags: []
        }];
    },
    /* 小众API 格式（单次返回一个视频 URL） */
    xzdx: function(data) {
        if (!data || data.code !== 0 || !data.data || !data.data.url) {
            console.warn('[FeedParsers.xzdx] 数据异常:', data);
            return [];
        }
        return [{
            url: data.data.url,
            sd_url: '',
            fhd_url: '',
            user: '',
            text: data.ym || '',
            likes: 0,
            comments: 0,
            favorites: 0,
            tags: []
        }];
    },
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
 * buildSourceRequest：构造实际 fetch 请求的 URL + options
 * sv_multi.js 的 fetchFeedList() 调用此函数
 * ============================================= */
window.buildSourceRequest = function buildSourceRequest(baseUrl, src, options) {
    options = options || {};
    var url = baseUrl || src.url || '';
    var fetchCfg = src.fetch || {};
    var useProxy = !!fetchCfg.useProxy;

    // 替换 URL 中的 {cat} {page} {catType} {catOrderBy} {startTime} 等占位符
    var placeholders = ['cat', 'page', 'catType', 'catOrderBy', 'startTime'];
    for (var i = 0; i < placeholders.length; i++) {
        var ph = placeholders[i];
        if (url.indexOf('{' + ph + '}') >= 0) {
            // page 占位符：从 pageKey 缓存计数器取当前页码
            if (ph === 'page') {
                var pk = fetchCfg.pageKey || src.name;
                if (!window._srcPage) window._srcPage = {};
                if (!window._srcPage[pk]) window._srcPage[pk] = 1;
                var pg = window._srcPage[pk];
                // randomPage：随机取页（避免重复内容）
                if (fetchCfg.randomPage) pg = Math.floor(Math.random() * (fetchCfg.maxPage || 50)) + 1;
                url = url.replace(new RegExp('\\{page\\}', 'g'), pg);
            } else {
                url = url.replace(new RegExp('\\{' + ph + '\\}', 'g'), options[ph] || '');
            }
        }
    }

    // 构造 fetch options
    var method = fetchCfg.method || 'GET';
    var headers = {};
    if (fetchCfg.headers) {
        for (var hk in fetchCfg.headers) headers[hk] = fetchCfg.headers[hk];
    }
    // dynamicHeaders：注入防重放头（tuwei 等专用）
    if (fetchCfg.dynamicHeaders && typeof window.getReplayGuardHeaders === 'function') {
        var rg = window.getReplayGuardHeaders();
        for (var rk in rg) headers[rk] = rg[rk];
    }
    // 构造 body（支持占位符替换）
    var body = fetchCfg.body || null;
    if (body && typeof body === 'string') {
        for (var bk = 0; bk < placeholders.length; bk++) {
            var bph = placeholders[bk];
            if (body.indexOf('{' + bph + '}') >= 0) {
                var bval = options[bph] || (bph === 'page' ? (window._srcPage ? window._srcPage[fetchCfg.pageKey || src.name] || 1 : 1) : '');
                body = body.replace(new RegExp('\\{' + bph + '\\}', 'g'), bval);
            }
        }
    }

    var fetchOptions = { method: method };
    if (Object.keys(headers).length > 0) fetchOptions.headers = headers;
    if (body) fetchOptions.body = body;
    // 跟随重定向
    fetchOptions.redirect = 'follow';

    return { fetchUrl: url, fetchOptions: fetchOptions, useProxy: useProxy };
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
    var fetchUrl = _curl;
    var fetchOptions = {};
    var useProxy = false;

    if (_curSrc && _curSrc.fetch) {
        var cfg = _curSrc.fetch;
        fetchOptions.method = cfg.method || 'GET';
        if (cfg.headers) fetchOptions.headers = Object.assign({}, cfg.headers);

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

        // TuWei API 的 id 随机化逻辑：旧匿名API用 /api/girl，新 developer API 不需要
        // if (_curl && _curl.indexOf('tuwei.space') > -1 && fetchOptions.body) { … }

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

/* =============================================
 * HLS 请求头规则（由 hls.js 的 xhrSetup 回调使用）
 * 根据视频片段 URL 特征匹配对应的请求头
 * 新增 CDN 规则只需改此文件，不需要动 app.js
 * ============================================= */
window.HlsHeaderRules = [
    {
        // JAV Trailers CDN
        match: function(u) { return u.indexOf('vz-c20a9510-a5e.b-cdn.net') > -1 || u.indexOf('javtrailers') > -1; },
        headers: { 'Referer': 'https://javtrailers.com/', 'Origin': 'https://javtrailers.com' }
    },
    {
        // RedGifs CDN
        match: function(u) { return /redgifs/.test(u); },
        headers: { 'Referer': 'https://www.redgifs.com/', 'Origin': 'https://www.redgifs.com' }
    }
];
