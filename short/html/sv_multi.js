/* sv_multi.js — short-video-feed 多源播放器（阶段1）
 * 架构：每 slide 一个独立 <video>，垂直 Swiper 滑动；只播放激活 slide，其它暂停（避免后台出声）。
 * DOM 对齐 index_yujn.html 模板：.sv-card / .sv-card-media / .sv-card-meta / .sv-cat-bar / .sv-action--mute。
 * 数据源：复用 douyin-player/sources.js 的 window.DEFAULT_SOURCES / FeedParsers / buildSourceRequest 等纯函数。
 * 阶段1覆盖：单集随机类源（yujn / direct / douyidou / wudada / feed单集: tuwei,小职,小众,蓝莓）。
 */
(function () {
  'use strict';

  // ============ 源配置（来自 sources.js，可被本地覆盖持久化） ============
  var OVERRIDE_KEY = '_SV_SOURCES_OVERRIDE_';
  function loadSources() {
    var defaultLen = (window.DEFAULT_SOURCES || []).length;
    var overrideActive = false, overrideLen = 0, result;
    try {
      var raw = localStorage.getItem(OVERRIDE_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) { overrideActive = true; overrideLen = arr.length; result = arr; }
      }
    } catch (e) {}
    if (!result) result = (window.DEFAULT_SOURCES || []).slice();
    // 诊断：内置源(sources.js)是否加载、是否被 localStorage 覆盖顶掉
    window.__sourcesDiag = {
      defaultLen: defaultLen,          // sources.js 经 <script> 加载后的内置源数量
      overrideActive: overrideActive,  // 是否存在 localStorage 覆盖
      overrideLen: overrideLen,        // 覆盖里的源数量
      finalLen: result.length          // 最终进入运行列表的数量
    };
    try {
      hikerLog('[loadSources] defaultLen=' + defaultLen +
        ' | overrideActive=' + overrideActive + ' (overrideLen=' + overrideLen + ')' +
        ' | finalLen=' + result.length);
    } catch (e) {}
    return result;
  }
  var SOURCES = loadSources();
  var _seen = {};
  SOURCES = SOURCES.filter(function (s) {
    var k = (s.name || '') + '|' + (s.url || '') + '|' + (s.type || '');
    if (_seen[k]) return false;
    _seen[k] = true;
    return true;
  });

  var BATCH = 5;
  var PRELOAD_AHEAD = 2;
  var LS_MUTED = '_SV_MULTI_MUTED_';
  var LS_HINT = '_SV_MULTI_WHEEL_HINT_';
  var LS_LOOP = '_SV_MULTI_LOOP_';
  var LS_SRC_IDX = '_SV_MULTI_SRC_IDX_';
  var MAX_RETRIES = 5;
  var retryCount = {};

  var state = {
    sourceIndex: parseInt(localStorage.getItem(LS_SRC_IDX) || '0', 10),
    categoryKey: '',
    categoryParams: {},   // 维度模型：{ param: value }，如 { niche:'', tag:'', sort:'trending' }
    categoryLabel: '',
    isMuted: localStorage.getItem(LS_MUTED) !== '0',
    isLoop: localStorage.getItem(LS_LOOP) !== '1',  // 默认连播（false=连播，true=循环）
    fitCover: false,
    players: {},
    _uid: 0,
    isLoading: false,
    swiper: null,
    activeId: null,
    listLoading: {},
    overrideActive: false
  };

  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }
  var wrapper = $('.swiper-wrapper');
  var hint = $('.sv-wheel-hint');
  var muteBtn = $('.sv-action--mute');
  var srcGrid = $('#srcGrid');
  var srcSubTab = 'builtin'; // 换源页子 tab：'builtin' 内置源 | 'market' 市场源（fromFile）

  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAttr(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function formatNum(n) {
    var num = Number(n) || 0;
    if (num >= 10000) return (num / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(num);
  }
  function currentSource() { return SOURCES[state.sourceIndex] || SOURCES[0]; }
  function catLabel(key) {
    var s = currentSource();
    if (!s.categories) return key || '';
    for (var i = 0; i < s.categories.length; i++) {
      var c = s.categories[i];
      if (c.key === key) return c.label;
      if (c.children) {
        for (var j = 0; j < c.children.length; j++) {
          if (c.children[j].key === key) return c.label + ' / ' + c.children[j].label;
        }
      }
    }
    return key || '';
  }
  function hikerLog(msg) {
    try { if (window.fy_bridge_app && typeof window.fy_bridge_app.log === 'function') { window.fy_bridge_app.log(String(msg)); } } catch (e) {}
    try { console.log(msg); } catch (e) {}
  }
  // 维度模型：由 categoryGroups + 当前选中值合并出 {cat} 串
  // 维度分组（带 param，如 niche/sort）：基础参数由 src.catBase 决定（Sky Porn 默认 type=all；无则不加）
  // path:true 的分组（如 xxxfollow 的 tag 维度）注入 URL 路径而非 query，不进入此串
  // 扁平分组（flat:true，如其它单维度源）：直接把选中值拼入
  function buildCatString(src) {
    if (!src.categoryGroups) return state.categoryKey;
    var isDim = src.categoryGroups.some(function (g) { return g.param && !g.flat; });
    var base = (src.catBase != null) ? src.catBase : (isDim ? 'type=videos' : '');
    var parts = base ? [base] : [];
    src.categoryGroups.forEach(function (g) {
      var v = state.categoryParams[g.param] || '';
      if (g.flat) { if (v) parts.push(v); return; }
      if (g.path) return;                       // 路径维度不进入 query 串
      if (g.bare) { parts.push(v ? (g.param + '=' + v) : g.param); return; }   // 空值也发裸 param（由源配置声明，如 Sky Porn 的 tag）
      if (v) parts.push(g.param + '=' + v);
    });
    return parts.join('&');
  }

  // 路径维度（path:true 的分组）取值，注入 URL 路径中的 {tag} 占位符
  function buildPathTag(src) {
    if (!src.categoryGroups) return '';
    var g = null;
    for (var i = 0; i < src.categoryGroups.length; i++) {
      if (src.categoryGroups[i].path) { g = src.categoryGroups[i]; break; }
    }
    if (!g) return '';
    return state.categoryParams[g.param] || '';
  }

  // 维度模型：由选中值拼出面包屑标题（跳过空值/全部）
  function buildCatLabel(src) {
    if (!src.categoryGroups) return state.categoryLabel || '';
    var parts = [];
    src.categoryGroups.forEach(function (g) {
      var v = state.categoryParams[g.param] || '';
      if (!v) return;
      var opt = (g.options || []).filter(function (o) { return o.value === v; })[0];
      if (opt) parts.push(opt.label);
    });
    return parts.join(' / ');
  }

  // ============ 数据源适配（核心） ============
  async function nextItem() {
    var src = currentSource();
    var cat = src.categoryGroups ? buildCatString(src) : state.categoryKey;
    var tag = src.categoryGroups ? buildPathTag(src) : '';
    if (src.type === 'txt') return await nextTxtItem(src);
    if (src.mode === 'multi' && src.type === 'feed') return await nextMultiFeedItem(src, cat, tag);
    if (src.type === 'feed') {
      return await nextAnyFeedItem(src, cat, tag);
    }
    // yujn / direct / douyidou / wudada 统一走 resolveOneVideo
    var v = await resolveOneVideo(src, cat);
    if (!v || !v.url) return emptyItem(src, '解析为空');
    var ret = {
      id: uid(),
      video_url: v.url,
      title: src.name + (state.categoryLabel ? (' · ' + state.categoryLabel) : ''),
      text: v.text || '',
      user: '',
      likes: 0, comments: 0, favorites: 0, tags: []
    };
    // 多集非 feed 源也加上序号（resolveOneVideo 本身无列表，走循环计数）
    if (src.mode === 'multi') {
      if (!state._seq) state._seq = {};
      var sk = src.name + '|' + src.url;
      state._seq[sk] = (state._seq[sk] || 0) + 1;
      ret._index = state._seq[sk];
      ret._total = '?';
    }
    return ret;
  }

  // 通用 feed 源：缓存列表中循环取视频，支持单集/多集，显示序号
  async function nextAnyFeedItem(src, cat, tag) {
    var key = src.url + '|' + (cat || '') + '|' + (tag || '') + '|any';
    if (!state.listCache) state.listCache = {};
    var cache = state.listCache[key];
    if (!cache || !cache.items || cache.items.length === 0) {
      cache = state.listCache[key] = { items: await fetchFeedList(src, cat, tag), idx: 0 };
    }
    if (!cache.items || cache.items.length === 0) return emptyItem(src, 'feed list empty');
    var maxAttempts = cache.items.length * 2;
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      var i = cache.idx;
      if (i >= cache.items.length) {
        if (src.mode === 'multi') {
          cache.idx = 0;
          var nl = await refillList(key, src, cat, tag);
          if (!nl || nl.length === 0) return emptyItem(src, 'feed list empty');
          cache = state.listCache[key];
          i = 0;
        } else {
          var fresh = await fetchFeedList(src, cat, tag);
          if (!fresh || fresh.length === 0) return emptyItem(src, 'feed list empty');
          cache = state.listCache[key] = { items: fresh, idx: 0 };
          i = 0;
        }
      }
      cache.idx = i + 1;
      var it = cache.items[i];
      if (!it) continue;
      var videoUrl = it.fhd_url || it.sd_url || it.url;
      if (!videoUrl) continue;
      videoUrl = (await window.resolveVideoUrl(videoUrl)) || videoUrl;
      if (await validateVideoUrl(videoUrl)) {
        var mapped = mapFeedItem(it, src);
        mapped._index = i + 1;
        mapped._total = cache.items.length;
        return mapped;
      }
      hikerLog('[feed] 移除无效视频:', videoUrl.substring(0, 60));
      cache.items.splice(i, 1);
      cache.idx = Math.max(0, cache.idx - 1);
    }
    return emptyItem(src, 'feed list empty');
  }

  function emptyItem(src, msg) {
    return { id: uid(), video_url: '', title: src.name, text: msg || '', user: '', likes: 0, comments: 0, favorites: 0, tags: [] };
  }
  function mapFeedItem(it, src) {
    return {
      id: uid(),
      video_url: it.url || it.fhd_url || it.sd_url || '',
      title: src.name + (it.text ? (' · ' + it.text) : ''),
      text: it.text || '',
      user: it.user || '',
      likes: it.likes || 0,
      comments: it.comments || 0,
      favorites: it.favorites || 0,
      tags: it.tags || []
    };
  }
  function uid() { return 'v' + (++state._uid); }

  async function resolveOneVideo(src, cat) {
    var curl = src.url;
    if (cat && src.urlTemplate) curl = src.urlTemplate.replace(/\{cat\}/g, cat);
    var sep = curl.indexOf('?') >= 0 ? '&' : '?';
    curl = curl + sep + '_=' + Date.now() + '_' + uid();
    try {
      var r = await fetch(curl, { method: 'GET', redirect: 'follow' });
      var finalUrl = r.url;
      if (finalUrl && /\.(mp4|m3u8|webm|flv)(\?|$)/i.test(finalUrl)) {
        return { url: finalUrl, text: src.name };
      }
      var text = await r.text();
      var videoUrl = text.trim();
      if (videoUrl.startsWith('{') || videoUrl.startsWith('[')) {
        try {
          var d = JSON.parse(videoUrl);
          videoUrl = d.url || d.video || d.data || d.src || d.link || d.play_url || '';
        } catch (e) {}
      }
      if (videoUrl && !/^https?:\/\//i.test(videoUrl)) {
        if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl;
        else if (videoUrl.startsWith('/')) {
          try { var u = new URL(curl); videoUrl = u.origin + videoUrl; } catch (e) {}
        } else { videoUrl = 'https:' + videoUrl; }
      }
      return { url: videoUrl, text: src.name };
    } catch (e) {
      console.warn('[resolveOneVideo] 失败:', src.name, e && e.message);
      return { url: '', text: '' };
    }
  }

  async function fetchFeedList(src, cat, tag) {
    // 记录当前分类，供源解析器/翻页钩子按 (源,分类) 隔离游标键（与 xfree 同风格）
    window.__feedCat = cat || '';
    var curl;
    // 先算基准 URL（含 cat/tag 替换，不含游标注入）
    if (tag && src.urlTemplate) {
      hikerLog('tag:' + tag);
      curl = src.urlTemplate.replace(/\{cat\}/g, cat || '').replace(/\{tag\}/g, tag);
    } else {
      curl = src.urlTemplate || src.url;   // 无 urlTemplate 时回退到 url（蓝莓API等仅配置 url 的 feed 源）
      if (curl && cat) curl = curl.replace(/\{cat\}/g, cat);
    }
    // 源自定义翻页钩子：getNextUrl(baseCurl, cat, tag) 注入游标 → 下一页完整 URL
    //   用于 xfree 换端点、skyPorn/xxxtik 参数游标等响应游标式分页；无游标时返回 baseCurl（首屏）
    if (typeof src.getNextUrl === 'function') {
      curl = src.getNextUrl(curl, cat, tag);
    }
    hikerLog('[fetchFeedList] src=' + src.name + ' | hasUrl=' + (typeof src.url) + ' | url=' + (src.url || 'UNDEF') + ' | curl=' + (curl || 'UNDEF') + ' | override=' + (localStorage.getItem('_SV_SOURCES_OVERRIDE_') ? 'Y' : 'N'));
    var req = null, finalUrl = 'NOREQ';
    if (typeof window.buildSourceRequest !== 'function') {
      hikerLog('[fetchFeedList][ERROR] window.buildSourceRequest 未定义 —— engine.js 未加载（请重新导入规则，确保 index_multi.html 含 <script src="engine.js"> 且在 sv_multi.js 之前）');
      finalUrl = 'ERR_NO_ENGINE';
    } else {
      try {
        req = window.buildSourceRequest(curl, src, { randomPlay: src.random, cat: cat || '', tag: tag || '' });
        finalUrl = req ? req.fetchUrl : 'NOREQ';
      } catch (e) {
        hikerLog('[fetchFeedList][ERROR] buildSourceRequest 抛异常: ' + (e && e.message) + ' | curl=' + curl);
        finalUrl = 'ERR_THROW:' + (e && e.message);
      }
    }
    hikerLog('视频源地址:' + finalUrl );
    if (!req) return [];
    var opts = req.fetchOptions || {};
    if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    var data;
    if (req.useProxy) {
      data = await window.fetchWithProxyFallback(finalUrl, opts);
    } else {
      var r = await fetch(finalUrl, opts);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var ct = r.headers.get('content-type') || '';
      if (ct.indexOf('application/json') >= 0 || src.parser) {
        data = await r.json();
      } else {
        var t = await r.text();
        try { data = JSON.parse(t); } catch (e) { data = t; }
      }
    }
    // 诊断：打印从 API 获取到的原始数据（超长截断，避免刷屏）
    try {
      var _rawStr = (typeof data === 'string') ? data : JSON.stringify(data);
      var _rawLen = _rawStr ? _rawStr.length : 0;
      if (_rawStr && _rawLen > 1200) _rawStr = _rawStr.slice(0, 1200) + '…[截断 ' + (_rawLen - 1200) + ' 字符]';
      hikerLog('[fetchFeedList][API数据] src=' + src.name + ' | len=' + _rawLen + ' | data=' + _rawStr);
    } catch (e) { hikerLog('[fetchFeedList][API数据] 序列化失败: ' + e.message); }
    var fn = src.parser ? window.FeedParsers[src.parser] : window.FeedParsers.generic;
    var list = (typeof fn === 'function') ? fn(data) : window.FeedParsers.generic(data);
    return list || [];
  }

  async function nextMultiFeedItem(src, cat, tag) {
    var key = src.url + '|' + (cat || '') + '|' + (tag || '');
    if (!state.listCache) state.listCache = {};
    var cache = state.listCache[key];
    if (!cache || !cache.items || cache.items.length === 0) {
      cache = state.listCache[key] = { items: await fetchFeedList(src, cat, tag), idx: 0 };
    }
    if (!cache.items || cache.items.length === 0) return emptyItem(src, 'feed list empty');
    var maxAttempts = cache.items.length * 2;
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      var i;
      if (src.random) {
        i = Math.floor(Math.random() * cache.items.length);
        cache.randPicks = (cache.randPicks || 0) + 1;
        if (cache.randPicks >= cache.items.length) {
          cache.randPicks = 0;
          refillList(key, src, cat, tag);
        }
      } else {
        i = cache.idx;
        if (i >= cache.items.length) {
          cache.idx = 0;
          var nl = await refillList(key, src, cat, tag);
          if (!nl || nl.length === 0) return emptyItem(src, 'feed list empty');
          cache = state.listCache[key];
          i = 0;
        }
        cache.idx = i + 1;
      }
      var it = cache.items[i];
      if (!it) continue;
      var videoUrl = it.fhd_url || it.sd_url || it.url;
      if (!videoUrl) continue;
      videoUrl = (await window.resolveVideoUrl(videoUrl)) || videoUrl;
      var valid = await validateVideoUrl(videoUrl);
      if (valid) {
        if (!src.random && cache.idx >= cache.items.length - 1) {
          refillList(key, src, cat, tag);
        }
        var mapped = mapFeedItem(it, src);
        mapped._index = !src.random ? i + 1 : '?';
        mapped._total = cache.items.length;
        return mapped;
      }
      hikerLog('[feed] 移除无效视频:', videoUrl.substring(0, 60));
      cache.items.splice(i, 1);
      if (!src.random) cache.idx = Math.max(0, cache.idx - 1);
    }
    return emptyItem(src, 'feed list empty');
  }

  async function refillList(key, src, cat, tag) {
    hikerLog('[refillList] 触发翻页 src=' + src.name + ' | cat=' + (cat || '') + ' | tag=' + (tag || ''));
    if (state.listLoading[key]) return state.listLoading[key];
    var p = (async function () {
      try {
        // sequential paging sources: increment page counter before refetch
        // (randomPage sources are randomized automatically inside buildSourceRequest)
        if (src.fetch && !src.fetch.randomPage) {
          var pk = src.fetch.pageKey || src.name;
          if (!window._srcPage) window._srcPage = {};
          var cur = window._srcPage[pk] || 1;
          window._srcPage[pk] = cur + 1;
        }
        var list = await fetchFeedList(src, cat, tag);
        if (list && list.length) {
          state.listCache[key] = { items: list, idx: 0 };
          return list;
        }
      } catch (e) {
        if (window.console) console.warn('[refillList] failed', e);
      }
      return null;
    })();
    state.listLoading[key] = p;
    try { return await p; }
    finally { if (state.listLoading[key] === p) state.listLoading[key] = null; }
  }

  async function nextTxtItem(src) {
    var url = src.url;
    if (!state.txtCache) state.txtCache = {};
    if (!state.txtCache[url]) {
      var r = await fetch(url);
      var text = await r.text();
      var lines = text.split('\n').map(function (l) { return l.trim(); })
        .filter(function (l) { return l && l.startsWith('http'); });
      state.txtCache[url] = { lines: lines, idx: 0 };
    }
    var c = state.txtCache[url];
    if (!c.lines || c.lines.length === 0) return emptyItem(src, 'TXT列表为空');
    var maxAttempts = c.lines.length * 2;
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      var i = src.random ? Math.floor(Math.random() * c.lines.length) : c.idx;
      if (i >= c.lines.length) i = 0;
      c.idx = i + 1;
      var videoUrl = c.lines[i];
      if (!videoUrl) continue;
      if (await validateVideoUrl(videoUrl)) {
        return { id: uid(), video_url: videoUrl, title: src.name, text: '', user: '', likes: 0, comments: 0, favorites: 0, tags: [], _index: i + 1, _total: c.lines.length };
      }
      hikerLog('[txt] 移除无效视频:', videoUrl.substring(0, 60));
      c.lines.splice(i, 1);
      if (!src.random) c.idx = Math.max(0, c.idx - 1);
    }
    return emptyItem(src, 'TXT列表均失效');
  }

  // ============ 视频 URL 有效性检测 ============
  var _validatedUrls = {};

  async function validateVideoUrl(url) {
    if (!url) return false;
    if (_validatedUrls[url] !== undefined) return _validatedUrls[url];
    // 已知可靠格式直接放行
    if (/api\.redgifs\.com.*\.m3u8/i.test(url) || /^blob:/.test(url) || /media\.redgifs\.com.*\.mp4/i.test(url)) {
      _validatedUrls[url] = true;
      return true;
    }
    // GET + Range 只拉第一个字节，比 HEAD 兼容性更好（大部分 CDN 支持 206）
    try {
      var r = await fetch(url, { headers: { Range: 'bytes=0-0' }, cache: 'no-cache' });
      var ok = r.status === 206 || r.status === 200 || r.status === 304;
      if (!ok) hikerLog('[validate] 失效:', r.status, url.substring(0, 80));
      _validatedUrls[url] = ok;
      return ok;
    } catch (e) {
      hikerLog('[validate] 请求失败:', url.substring(0, 80));
      _validatedUrls[url] = false;
      return false;
    }
  }

  // 清理缓存（切换源时调用）
  function clearValidationCache() { _validatedUrls = {}; }
  var slideCounter = 0;
  function buildSlideHTML(i) {
    var id = 'v' + (++state._uid);
    return '<li class="swiper-slide sv-slide" data-id="' + id + '" data-index="' + i + '" data-url="" data-poster="" data-cate-name="" data-cate-id="0">' +
      '<article class="sv-card">' +
        '<div class="sv-card-media"><div class="sv-media"></div></div>' +
        '<div class="sv-card-progress"><div class="sv-card-progress-played" style="width:0%"></div></div>' +
        '<header class="sv-card-meta">' +
          '<div class="sv-card-author"><img class="sv-card-author-avatar" alt=""><a class="sv-card-author-name" href="javascript:void(0)">@</a></div>' +
          '<h2 class="sv-card-title"></h2>' +
          '<ul class="sv-card-tags"></ul>' +
          '<time class="sv-card-time"></time>' +
      '<div class="sv-card-index"></div>' +
        '</header>' +
        '<div class="sv-ff-indicator">快进 3x</div>' +
        '<div class="sv-loading"><span class="sv-loading-spinner"></span></div>' +
        '<div class="sv-error">加载失败</div>' +
      '</article>' +
    '</li>';
  }

  function fillSlide(slide, item) {
    slide.dataset.url = item.video_url || '';
    slide._item = item;
    var loading = slide.querySelector('.sv-loading');
    if (loading) loading.classList.remove('is-visible');
    var err = slide.querySelector('.sv-error');
    if (err) err.style.display = 'none';
    var titleEl = slide.querySelector('.sv-card-title');
    if (titleEl) titleEl.textContent = item.title || '';
    var authorEl = slide.querySelector('.sv-card-author-name');
    if (authorEl) authorEl.textContent = '@' + (item.user || '');
    var avatarEl = slide.querySelector('.sv-card-author-avatar');
    if (avatarEl) avatarEl.style.display = item.user ? '' : 'none';
    var tagsEl = slide.querySelector('.sv-card-tags');
    if (tagsEl) {
      tagsEl.innerHTML = '';
      (item.tags || []).slice(0, 4).forEach(function (tg) {
        var li = document.createElement('li');
        li.className = 'sv-card-tag';
        li.textContent = (typeof tg === 'string') ? tg : (tg.tag || tg.text || '');
        tagsEl.appendChild(li);
      });
    }
    var timeEl = slide.querySelector('.sv-card-time');
    if (timeEl) {
      var parts = [];
      if (item.likes) parts.push('♥ ' + formatNum(item.likes));
      if (item.comments) parts.push('💬 ' + formatNum(item.comments));
      if (item.favorites) parts.push('⭐ ' + formatNum(item.favorites));
      timeEl.textContent = parts.join('   ');
    }
    var idxEl = slide.querySelector('.sv-card-index');
    if (idxEl) {
      if (item._total && item._index && item._index !== '?') {
        idxEl.textContent = item._index + '/' + item._total;
      } else {
        idxEl.textContent = '';
      }
    }
  }

  async function resolveSlide(slide, autoplay) {
    if (!slide || slide.dataset.url) {
      // 已解析：直接播放/缓冲
      if (slide.dataset.url && autoplay) { var p = state.players[slide.dataset.id]; if (p) p.play().catch(function () {}); }
      return;
    }
    var item = await nextItem();
    updateQuotaDisplay();
    fillSlide(slide, item);
    if (item.video_url) {
      initPlayerForSlide(slide, item.video_url, autoplay);
    } else {
      var err = slide.querySelector('.sv-error');
      if (err) err.style.display = 'flex';
    }
  }

  // ============ 播放器 ============
  function initPlayerForSlide(slideEl, videoUrl, autoplay) {
    var mediaSlot = slideEl.querySelector('.sv-media');
    if (!mediaSlot || !videoUrl) return null;
    if (!/^https?:\/\//i.test(videoUrl)) return null;
    var id = slideEl.dataset.id;
    if (state.players[id]) {
      var ex = state.players[id];
      if (ex.dataset.src === videoUrl) { if (autoplay) tryPlay(ex); return ex; }
      try { ex.pause(); if (ex._hls) ex._hls.destroy(); } catch (e) {}
      if (ex.parentNode) ex.parentNode.removeChild(ex);
      delete state.players[id];
    }
    var video = document.createElement('video');
    video.dataset.src = videoUrl;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('x5-playsinline', '');
    video.muted = state.isMuted;
    video.loop = state.isLoop;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = state.fitCover ? 'cover' : 'contain';
    video.style.position = 'absolute';
    video.style.inset = '0';
    mediaSlot.appendChild(video);

    var isHls = /\.m3u8(\?|$)/i.test(videoUrl) || /^blob:/i.test(videoUrl);
    if (isHls && window.Hls && Hls.isSupported()) {
      // redgifs HLS: 浏览器原生播放（Android Chrome 原生支持 HLS）
      if (/api\.redgifs\.com/i.test(videoUrl)) {
        video.setAttribute('referrerpolicy', 'unsafe-url');
        video.src = videoUrl;
        if (autoplay) video.play().catch(function () {});
      } else {
        var hls = new Hls({ enableWorker: false, lowLatencyMode: true });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () { if (autoplay) video.play().catch(function () {}); });
        hls.on(Hls.Events.ERROR, function (e, data) {
          if (data && data.fatal) {
            if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = videoUrl; video.play().catch(function () {}); }
            else retryVideo(slideEl, videoUrl);
          }
        });
        video._hls = hls;
      }
    } else {
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', function () { if (autoplay) video.play().catch(function () {}); });
      video.addEventListener('error', function () { retryVideo(slideEl, videoUrl); });
    }
    video.addEventListener('loadeddata', function () {
      delete retryCount[id];
    });
    video.addEventListener('timeupdate', function () {
      var bar = slideEl.querySelector('.sv-card-progress-played');
      if (bar && video.duration) bar.style.width = Math.min(video.currentTime / video.duration * 100, 100) + '%';
    });

    // ============ 长按屏幕快进 ============
    var _longPressTimer = null;
    var _isFastForward = false;
    var FF_SPEED = 3;

    function clearLongPress() {
      if (_longPressTimer) { clearTimeout(_longPressTimer); _longPressTimer = null; }
      if (_isFastForward) {
        _isFastForward = false;
        video.playbackRate = 1;
        video.style.removeProperty('filter');
        slideEl.classList.remove('sv-ff-active');
      }
    }

    video.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      clearLongPress();
      _longPressTimer = setTimeout(function () {
        _longPressTimer = null;
        if (video.paused) return;
        _isFastForward = true;
        video.playbackRate = FF_SPEED;
        video.style.filter = 'brightness(1.15)';
        slideEl.classList.add('sv-ff-active');
      }, 500);
    }, { passive: true });

    video.addEventListener('touchend', clearLongPress);
    video.addEventListener('touchcancel', clearLongPress);
    video.addEventListener('touchmove', function (e) {
      // 滑动距离过大则取消长按（防止与滑动手势冲突）
      if (_longPressTimer && e.touches.length === 1) {
        // 不取消，只在手指离开时取消
      }
    }, { passive: true });

    // 连播模式：视频播完自动滑到下一个
    video.addEventListener('ended', function () {
      if (!state.isLoop && state.swiper && slideEl) {
        var idx = Array.prototype.indexOf.call(state.swiper.slides, slideEl);
        if (idx >= 0 && idx < state.swiper.slides.length - 1) {
          state.swiper.slideNext();
        }
      }
    });
    state.players[id] = video;
    if (!autoplay) {
      var pp = video.play();
      if (pp && pp.then) pp.then(function () { video.pause(); }).catch(function () {});
    }
    return video;
  }

  function tryPlay(v) {
    if (!v) return;
    v.muted = state.isMuted;
    var p = v.play();
    if (p && p.then) p.catch(function () {});
  }

  function pauseAllExcept(activeId) {
    Object.keys(state.players).forEach(function (id) {
      if (id !== activeId) {
        var p = state.players[id];
        if (p) { try { p.pause(); } catch (e) {} }
      }
    });
  }

  // ============ Swiper 流程 ============
  function appendSlides(count) {
    var html = '';
    for (var i = 0; i < count; i++) html += buildSlideHTML(slideCounter++);
    wrapper.insertAdjacentHTML('beforeend', html);
    if (state.swiper) state.swiper.update();
  }

  async function playSlide(index) {
    var slide = state.swiper.slides[index];
    if (!slide) return;
    var id = slide.dataset.id;
    pauseAllExcept(id);
    state.activeId = id;
    if (!slide.dataset.url) {
      await resolveSlide(slide, true);
    } else {
      var p = state.players[id];
      if (p) tryPlay(p);
    }
    preloadAhead(index);
    updateMeta(slide);
  }

  async function preloadAhead(index) {
    for (var k = 1; k <= PRELOAD_AHEAD; k++) {
      var ni = index + k;
      var slide = state.swiper.slides[ni];
      if (!slide) {
        appendSlides(1);
        slide = state.swiper.slides[ni];
      }
      if (!slide) continue;
      if (!slide.dataset.url) await resolveSlide(slide, false);
      if (ni >= slideCounter - 2) appendSlides(BATCH);
    }
  }

  function updateMeta(slide) {
    // 分类信息已由右侧分类按钮 + 弹窗管理
  }

  function loadMore() {
    if (state.isLoading) return;
    state.isLoading = true;
    setTimeout(function () {
      appendSlides(BATCH);
      state.isLoading = false;
    }, 200);
  }

  function initSwiper() {
    state.swiper = new Swiper('.sv-swiper', {
      direction: 'vertical',
      slidesPerView: 1,
      mousewheel: { sensitivity: 0.8, releaseOnEdges: true },
      speed: 400,
      on: {
        init: function () {
          if (!localStorage.getItem(LS_HINT) && hint) hint.classList.add('is-visible');
          setTimeout(function () { playSlide(0); }, 300);
        },
        slideChange: function () {
          if (hint && hint.classList.contains('is-visible')) { hint.classList.remove('is-visible'); localStorage.setItem(LS_HINT, '1'); }
          playSlide(this.activeIndex);
          if (this.activeIndex >= slideCounter - 3) loadMore();
        },
        reachEnd: function () { loadMore(); }
      }
    });
  }

  // ============ 源切换器 ============
  function renderSourceList() {
    if (!srcGrid) return;
    // 同步子 tab 激活态与计数
    var subBtns = $$('.sv-src-subtab');
    var nBuiltin = 0, nMarket = 0;
    SOURCES.forEach(function (s) { if (s.fromFile) nMarket++; else nBuiltin++; });
    subBtns.forEach(function (b) {
      var tab = b.dataset.srctab;
      b.classList.toggle('is-active', tab === srcSubTab);
      var cnt = (tab === 'market') ? nMarket : nBuiltin;
      b.textContent = (tab === 'market' ? '市场源' : '内置源') + (cnt ? ' (' + cnt + ')' : '');
    });
    var _showMarket = (srcSubTab === 'market');
    srcGrid.innerHTML = '';
    SOURCES.forEach(function (s, i) {
      if (!!s.fromFile !== _showMarket) return; // 按子 tab 过滤
      var item = document.createElement('div');
      item.className = 'sv-src-item' + (i === state.sourceIndex ? ' active' : '');
      var label = s.name || ('源' + i);
      var modeLabel = s.mode === 'multi' ? '多集' : '单集';
      var modeBadge = '<span class="sv-src-mode">' + modeLabel + '</span>';
      var catN = s.categoryGroups
        ? s.categoryGroups.reduce(function (n, g) { return n + (g.options ? g.options.length : 0); }, 0)
        : (s.categories ? s.categories.length : 0);
      var catBadge = catN ? ('<span class="sv-src-cat">#' + catN + '</span>') : '';
      // 市场源（fromFile：市场下载或 sources/ 文件源）加专属徽标，与内置源区分
      var marketBadge = s.fromFile ? '<span class="sv-src-market">市场</span>' : '';
      var randBtn = s.mode === 'multi' ? '<button class="sv-src-rand' + (s.random ? ' is-on' : '') + '" data-idx="' + i + '" type="button">' + (s.random ? '✓' : '随') + '</button>' : '';
      item.innerHTML =
        '<div class="sv-src-top"><span class="sv-src-name">' + escHtml(label) + '</span>' + randBtn + '</div>' +
        '<div class="sv-src-meta">' + modeBadge + marketBadge + catBadge + '</div>';
      item.addEventListener('click', function (e) {
        if (e.target.closest('.sv-src-rand')) return;
        switchSource(i);
      });
      srcGrid.appendChild(item);
    });
    // 绑定随机按钮事件
    srcGrid.querySelectorAll('.sv-src-rand').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(this.dataset.idx, 10);
        var s = SOURCES[idx];
        if (!s) return;
        s.random = !s.random;
        persistSources();
        renderSourceList();
        if (idx === state.sourceIndex) {
          state.listCache = {};
          state.txtCache = {};
          resetFeed();
        }
      });
    });
  }

  function buildCatBar() {
    // 顶部分类栏已移除，分类功能由右侧分类按钮 + 弹窗提供
  }

  function switchSource(i) {
    if (i < 0 || i >= SOURCES.length) return;
    state.sourceIndex = i;
    try { localStorage.setItem(LS_SRC_IDX, String(i)); } catch (e) {}
    var s = currentSource();
    if (s.categoryGroups) {
      state.categoryParams = {};
      s.categoryGroups.forEach(function (g) {
        state.categoryParams[g.param] = (g.options && g.options[0]) ? g.options[0].value : '';
      });
      state.categoryLabel = buildCatLabel(s);
    } else {
      state.categoryKey = (s.categories && s.categories.length) ? s.categories[0].key : '';
      state.categoryLabel = (s.categories && s.categories.length) ? s.categories[0].label : '';
    }
    state.listCache = {};
    state.txtCache = {};
    state._seq = {};
    renderSourceList();
    buildCatBar();
    clearValidationCache();
    closeSettings();
    resetFeed();
    var setCurSrc = $('#setCurSrc'); if (setCurSrc) setCurSrc.textContent = s.name;
    updateQuotaDisplay();
  }


  function resetFeed() {
    Object.keys(state.players).forEach(function (id) {
      var p = state.players[id];
      try { p.pause(); if (p._hls) p._hls.destroy(); } catch (e) {}
    });
    state.players = {};
    wrapper.innerHTML = '';
    slideCounter = 0;
    state.listLoading = {};
    try { window._srcPage = {}; } catch (e) {}
    state._seq = {};
    appendSlides(BATCH);
    if (state.swiper) { state.swiper.update(); state.swiper.slideTo(0, 0); }
    setTimeout(function () { playSlide(0); }, 100);
  }

  // ============ 静音 ============
  function updateMuteBtn() {
    if (!muteBtn) return;
    if (state.isMuted) muteBtn.classList.add('is-muted'); else muteBtn.classList.remove('is-muted');
    muteBtn.setAttribute('aria-label', state.isMuted ? '点击开启声音' : '点击静音');
  }
  function toggleMute() {
    state.isMuted = !state.isMuted;
    localStorage.setItem(LS_MUTED, state.isMuted ? '1' : '0');
    Object.keys(state.players).forEach(function (id) {
      var p = state.players[id];
      if (p) p.muted = state.isMuted;
    });
    updateMuteBtn();
  }

  // ============ 原始/满屏 ============
  function toggleFit() {
    state.fitCover = !state.fitCover;
    var btn = document.getElementById('fitBtn');
    if (btn) {
      var label = btn.querySelector('.sv-action-count');
      if (label) label.textContent = state.fitCover ? '满屏' : '原始';
    }
    Object.keys(state.players).forEach(function (id) {
      var v = state.players[id];
      if (v) v.style.objectFit = state.fitCover ? 'cover' : 'contain';
    });
  }

  // ============ 连播/循环 ============
  function toggleLoop() {
    state.isLoop = !state.isLoop;
    localStorage.setItem(LS_LOOP, state.isLoop ? '1' : '0');
    var btn = document.getElementById('loopBtn');
    if (btn) {
      var label = btn.querySelector('.sv-action-count');
      if (label) label.textContent = state.isLoop ? '循环' : '连播';
    }
    Object.keys(state.players).forEach(function (id) {
      var v = state.players[id];
      if (v) v.loop = state.isLoop;
    });
  }

  // ============ 全屏切换 ============
  function toggleFullscreen() {
    var el = document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
      document.querySelector('.sv-fullscreen-btn') && document.querySelector('.sv-fullscreen-btn').classList.remove('is-fullscreen');
    } else {
      el.requestFullscreen().catch(function () {});
      document.querySelector('.sv-fullscreen-btn') && document.querySelector('.sv-fullscreen-btn').classList.add('is-fullscreen');
    }
  }

  // ============ 视频错误重试 ============
  function retryVideo(slideEl, videoUrl) {
    if (!slideEl || !videoUrl) return;
    var id = slideEl.dataset.id;
    retryCount[id] = (retryCount[id] || 0) + 1;
    hikerLog('[retry] 视频加载失败 (' + retryCount[id] + '/' + MAX_RETRIES + '):'+videoUrl);
   
    if (retryCount[id] > MAX_RETRIES) {
      hikerLog('[retry] 连续失败 ' + MAX_RETRIES + ' 次，停止重试:', videoUrl);
      // 标记 URL 失效，避免再次被抓到
      _validatedUrls[videoUrl] = false;
      // 清理旧 video
      if (state.players[id]) {
        try { state.players[id].pause(); if (state.players[id]._hls) state.players[id]._hls.destroy(); } catch (e) {}
        if (state.players[id].parentNode) state.players[id].parentNode.removeChild(state.players[id]);
        delete state.players[id];
      }
      slideEl.dataset.url = '';
      // 尝试重新解析一个新的视频来代替这个失败的
      resolveSlide(slideEl, true);
      return;
    }
    // 释放旧的 video
    if (state.players[id]) {
      try { state.players[id].pause(); if (state.players[id]._hls) state.players[id]._hls.destroy(); } catch (e) {}
      if (state.players[id].parentNode) state.players[id].parentNode.removeChild(state.players[id]);
      delete state.players[id];
    }
    // 清空 dataset.url 让 resolveSlide 重新走完整解析流程
    slideEl.dataset.url = '';
    resolveSlide(slideEl, true);
  }

  // ============ 事件 ============
  function dismissHint() {
    if (hint) hint.classList.remove('is-visible');
    localStorage.setItem(LS_HINT, '1');
  }

  // ============ 阶段3：设置 / 源管理 / 额度 / 分类弹窗 / 随机连播 ============
  var setBtn = $('#setBtn');
  var setPanel = $('#setPanel');
  var setPanelClose = $('#setPanelClose');
  var exportBtn = $('#exportBtn');
  var restoreBtn = $('#restoreBtn');
  var setHint = $('#setHint');
  var addSrcBtn = $('#addSrcBtn');
  var srcAddForm = $('#srcAddForm');
  var cancelAdd = $('#cancelAdd');
  var srcManageList = $('#srcManageList');
  var feedQuota = $('#feedQuota');
  var catPopup = $('#catPopup');
  var catPopupGrid = $('#catPopupGrid');
  var catPopupClose = $('#catPopupClose');

  function persistSources() {
    try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(SOURCES)); state.overrideActive = true; }
    catch (e) { if (window.console) console.warn('[persistSources] 失败', e); }
  }

  function showToast(msg) {
    if (!setHint) return;
    setHint.textContent = msg;
    setHint.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { setHint.classList.remove('is-visible'); }, 2600);
  }

  function renderManageList() {
    if (!srcManageList) return;
    srcManageList.innerHTML = '';
    SOURCES.forEach(function (s, i) {
      var row = document.createElement('div');
      row.className = 'sv-mng-row' + (s.locked ? ' is-locked' : '');
      var catCount = s.categoryGroups
        ? s.categoryGroups.reduce(function (n, g) { return n + (g.options ? g.options.length : 0); }, 0)
        : (s.categories ? s.categories.length : 0);
      var info = document.createElement('div');
      info.className = 'sv-mng-info';
      info.innerHTML = '<div class="sv-mng-name">' + escHtml(s.name || ('源' + i)) +
        (s.locked ? ' <span class="sv-mng-lock">🔒</span>' : '') + '</div>' +
        '<div class="sv-mng-sub">' + (s.mode === 'multi' ? '多集' : '单集') +
        (catCount ? ' · ' + catCount + '分类' : '') + (s.random ? ' · 随机' : '') + '</div>';
      var ops = document.createElement('div');
      ops.className = 'sv-mng-ops';
      ops.innerHTML =
        '<button class="sv-mng-btn" data-act="up" type="button">↑</button>' +
        '<button class="sv-mng-btn" data-act="down" type="button">↓</button>' +
        '<button class="sv-mng-btn" data-act="lock" type="button">' + (s.locked ? '解锁' : '锁定') + '</button>' +
        (s.fromFile ? '' : '<button class="sv-mng-btn" data-act="edit" type="button">编辑</button>') +
        (s.locked ? '' : '<button class="sv-mng-btn sv-mng-del" data-act="del" type="button">删</button>');
      ops.addEventListener('click', function (e) {
        var btn = e.target.closest('button'); if (!btn) return;
        var act = btn.dataset.act;
        if (act === 'up') moveSource(i, -1);
        else if (act === 'down') moveSource(i, 1);
        else if (act === 'lock') toggleLock(i);
        else if (act === 'edit') startEdit(i);
        else if (act === 'del') deleteSource(i);
      });
      row.appendChild(info);
      row.appendChild(ops);
      srcManageList.appendChild(row);
    });
  }

  function moveSource(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= SOURCES.length) return;
    var t = SOURCES[i]; SOURCES[i] = SOURCES[j]; SOURCES[j] = t;
    if (state.sourceIndex === i) state.sourceIndex = j;
    else if (state.sourceIndex === j) state.sourceIndex = i;
    persistSources();
    renderManageList();
  }

  function toggleLock(i) {
    if (!SOURCES[i]) return;
    SOURCES[i].locked = !SOURCES[i].locked;
    persistSources();
    renderManageList();
    renderSourceList();
  }

  function deleteSource(i) {
    if (!SOURCES[i]) return;
    if (SOURCES[i].locked) { showToast('锁定源不可删除'); return; }
    SOURCES.splice(i, 1);
    if (state.sourceIndex >= SOURCES.length) state.sourceIndex = SOURCES.length - 1;
    if (state.sourceIndex < 0) state.sourceIndex = 0;
    persistSources();
    renderManageList();
    renderSourceList();
  }

  // 供 sourceMarket.js（获取源弹窗）调用：动态加载的源仅支持「删除」（内存 + localStorage 覆盖），不支持编辑
  window.SVMarket = {
    // 当前运行列表（覆盖生效后的 SOURCES）中的源名称，用于判断「已安装」
    activeNames: function () {
      return (SOURCES || []).map(function (s) { return s.name; });
    },
    // 按名称删除（锁定源会被 deleteSource 拦截），删除后自动持久化覆盖并重渲
    removeByName: function (name) {
      for (var i = 0; i < SOURCES.length; i++) {
        if (SOURCES[i] && SOURCES[i].name === name) { deleteSource(i); return true; }
      }
      return false;
    },
    // 把运行时 window.DEFAULT_SOURCES 里、尚未进入运行列表 SOURCES 的源并入（用于 sources/*.js 被
    // loadFolderSources 异步注入后回填，使其出现在源选择器/管理页/可播放列表）。不持久化（每次会话由
    // loadFolderSources 重新注入），按 name 去重，避免重复。
    syncFromDefaults: function () {
      var defs = window.DEFAULT_SOURCES || [];
      var names = {};
      SOURCES.forEach(function (s) { if (s && s.name) names[s.name] = true; });
      var added = false;
      defs.forEach(function (s) {
        if (!s || !s.name || names[s.name]) return;
        var k = (s.name || '') + '|' + (s.url || '') + '|' + (s.type || '');
        if (_seen[k]) return;
        _seen[k] = true;
        SOURCES.push(s);
        added = true;
      });
      if (added) {
        if (state.sourceIndex >= SOURCES.length) state.sourceIndex = 0;
        renderSourceList();
        renderManageList();
      }
    }
  };

  function parseCats(str) {
    if (!str) return [];
    return str.split(',').map(function (p) {
      var kv = p.split(':');
      return { key: (kv[0] || '').trim(), label: (kv[1] || kv[0] || '').trim() };
    }).filter(function (c) { return c.key; });
  }

  function startEdit(i) {
    var s = SOURCES[i]; if (!s || !srcAddForm) return;
    if (s.fromFile) { showToast('该源来自 sources 文件夹，不支持编辑'); return; }
    srcAddForm.querySelector('[name=name]').value = s.name || '';
    srcAddForm.querySelector('[name=url]').value = s.url || '';
    srcAddForm.querySelector('[name=type]').value = s.type || 'feed';
    srcAddForm.querySelector('[name=mode]').value = s.mode || 'single';
    srcAddForm.querySelector('[name=categories]').value = (s.categories || []).map(function (c) { return c.key + ':' + c.label; }).join(',');
    srcAddForm.querySelector('[name=urlTemplate]').value = s.urlTemplate || '';
    srcAddForm.dataset.edit = String(i);
    srcAddForm.hidden = false;
    if (addSrcBtn) addSrcBtn.textContent = '取消编辑';
  }

  function addSource(data) {
    var src = {
      name: data.name || ('源' + (SOURCES.length + 1)),
      url: data.url || '',
      type: data.type || 'feed',
      mode: data.mode || 'single',
      categories: parseCats(data.categories)
    };
    if (data.urlTemplate) src.urlTemplate = data.urlTemplate;
    SOURCES.push(src);
    persistSources();
    renderManageList();
    renderSourceList();
  }

  function saveEdit(i, data) {
    var s = SOURCES[i]; if (!s) return;
    s.name = data.name || s.name;
    s.url = data.url || s.url;
    s.type = data.type || s.type;
    s.mode = data.mode || s.mode;
    s.categories = parseCats(data.categories);
    if (data.urlTemplate) s.urlTemplate = data.urlTemplate; else delete s.urlTemplate;
    persistSources();
    renderManageList();
    renderSourceList();
    if (i === state.sourceIndex) { buildCatBar(); resetFeed(); }
  }

  function restoreDefaults() {
    try { localStorage.removeItem(OVERRIDE_KEY); } catch (e) {}
    try { localStorage.removeItem(LS_SRC_IDX); } catch (e) {}
    state.overrideActive = false;
    SOURCES = (window.DEFAULT_SOURCES || []).slice();
    var _s = {};
    SOURCES = SOURCES.filter(function (s) {
      var k = (s.name || '') + '|' + (s.url || '') + '|' + (s.type || '');
      if (_s[k]) return false; _s[k] = true; return true;
    });
    state.sourceIndex = 0;
    state.categoryKey = '';
    state.categoryParams = {};
    renderManageList();
    renderSourceList();
    buildCatBar();
    resetFeed();
    showToast('已恢复默认源');
  }

  // ============ 清理缓存 ============
  function clearCache() {
    state.listCache = {};
    state.txtCache = {};
    state._seq = {};
    clearValidationCache();
    try { localStorage.removeItem(OVERRIDE_KEY); } catch (e) {}
    try { localStorage.removeItem(LS_SRC_IDX); } catch (e) {}
    try { localStorage.removeItem(LS_LOOP); } catch (e) {}
    try { localStorage.removeItem(LS_MUTED); } catch (e) {}
    try { localStorage.removeItem(LS_HINT); } catch (e) {}
    try { localStorage.removeItem(LS_MUTED); } catch (e) {}
    showToast('已清理缓存');
  }

  function exportSources() {
    function hikerLog(msg) {
      try { if (window.fy_bridge_app && typeof window.fy_bridge_app.log === 'function') { window.fy_bridge_app.log(String(msg)); } } catch (e) {}
      try { console.log(msg); } catch (e) {}
    }
    // 参考 a.html 的导出逻辑：先读完整文件，再替换 DEFAULT_SOURCES 段
    var _ruleName = '';
    try { if (typeof fba !== 'undefined' && fba && typeof fba.getVar === 'function') _ruleName = fba.getVar('小程序名') || ''; } catch (e) {}
    try { if (!_ruleName && typeof fy_bridge_app !== 'undefined' && fy_bridge_app && typeof fy_bridge_app.getVar === 'function') _ruleName = fy_bridge_app.getVar('小程序名') || ''; } catch (e) {}
    if (!_ruleName) _ruleName = 'short-video-feed';

    function _exportPath() { return 'hiker://files/data/' + _ruleName + '/sources.js'; }

    // 找出能用的文件 API
    function writeFile(path, content) {
      if (window.fy_bridge_app && typeof window.fy_bridge_app.writeFile === 'function') { window.fy_bridge_app.writeFile(path, content); return true; }
      if (window.fba && typeof window.fba.writeFile === 'function') { window.fba.writeFile(path, content); return true; }
      return false;
    }
    function readFile(path) {
      // 已实测：本环境 fy_bridge_app.readFile 是【同步】返回字符串（读 sources.js 字长 48119），
      // 而 request() 对 hiker:// 规则文件读不到（返回 null/空）。故 readFile 优先，request 仅最后兜底。
      if (window.fy_bridge_app && typeof window.fy_bridge_app.readFile === 'function') {
        try { var r = window.fy_bridge_app.readFile(path); hikerLog('[exportSources.readFile] fy_bridge_app.readFile 返回 typeof=' + typeof r + (typeof r === 'string' ? ' 字长=' + r.length : (r != null ? ' (非字符串, 应为Promise)' : ' (null)'))); if (r != null && typeof r === 'string') return r; } catch (e) { hikerLog('[exportSources.readFile] fy_bridge_app.readFile 抛错: ' + (e && e.message || e)); }
      }
      if (window.fba && typeof window.fba.readFile === 'function') {
        try { var r2 = window.fba.readFile(path); hikerLog('[exportSources.readFile] fba.readFile 返回 typeof=' + typeof r2 + (typeof r2 === 'string' ? ' 字长=' + r2.length : (r2 != null ? ' (非字符串)' : ' (null)'))); if (r2 != null && typeof r2 === 'string') return r2; } catch (e) { hikerLog('[exportSources.readFile] fba.readFile 抛错: ' + (e && e.message || e)); }
      }
      // request 仅作最后兜底（如浏览器预览），hiker:// 规则环境通常读不到
      try { if (typeof request === 'function') { var rt = request(path); hikerLog('[exportSources.readFile] request 返回 typeof=' + typeof rt + (rt != null ? ' 字长=' + String(rt).length : ' (null)')); if (rt != null && String(rt).length) return String(rt); } } catch (e) { hikerLog('[exportSources.readFile] request 抛错: ' + (e && e.message || e)); }
      return null;
    }
    function requestUrl(path) {
      if (typeof request === 'function') { var rv = request(path); hikerLog('[exportSources.requestUrl] request 返回 typeof=' + typeof rv + (rv != null ? ' 字长=' + String(rv).length : ' (null)')); return rv; }
      return null;
    }

    var path = _exportPath();
    // 仅导出内置与用户自定义源；市场下载的 fromFile 源不写回静态 sources.js
    // （避免：① 与 sources/ 文件夹里的同一份文件重复；② 烤入不可编辑的 fromFile 条目）
    var _exportList = (SOURCES || []).filter(function (s) { return !(s && s.fromFile); });
    var newBlock = 'window.DEFAULT_SOURCES = ' + JSON.stringify(_exportList, null, '\t') + ';';
    var fullText = null;
    var _readVia = '未读取';

    // 方案一：readFile（内部优先 fy_bridge_app.readFile，其次 fba.readFile，最后 request 兜底）
    try { fullText = readFile(path); if (fullText && typeof fullText === 'object') { fullText = JSON.stringify(fullText, null, '\t'); _readVia = 'readFile(返回Promise/object→已string化)'; } else if (fullText) { _readVia = 'readFile(返回字符串)'; } } catch (e) { hikerLog('[exportSources] 方案一抛错', e); }
    // 方案二：request 读
    if (!fullText) { try { fullText = requestUrl(path); if (fullText && typeof fullText === 'object') { fullText = JSON.stringify(fullText, null, '\t'); _readVia = 'requestUrl(返回Promise/object→已string化)'; } else if (fullText) { _readVia = 'requestUrl(返回字符串)'; } } catch (e) { hikerLog('[exportSources] 方案二抛错', e); } }
    // 汇聚诊断到 window.__exportDiag，供「通用」页诊断日志框显示；并用 fy_bridge_app.log 打印（Hiker 可见）
    window.__exportDiag = {
      path: path,
      via: _readVia,
      fullTextType: typeof fullText,
      fullTextLen: (typeof fullText === 'string') ? fullText.length : 0,
      ts: (function () { try { return new Date().toLocaleString(); } catch (e) { return ''; } })()
    };
    hikerLog('[exportSources] 读取 sources.js 路径=' + path + ' | 方法=' + _readVia + ' | fullText typeof=' + typeof fullText + (typeof fullText === 'string' ? ' 字长=' + fullText.length : ''));
    if (window.SV_renderDebugLog) { try { window.SV_renderDebugLog(); } catch (e) {} }

    if (fullText) {
      // 能读到文件 → 替换 DEFAULT_SOURCES 数组段，保留其他内容
      var marker = 'window.DEFAULT_SOURCES = [';
      var startIdx = fullText.indexOf(marker);
      if (startIdx !== -1) {
        var depth = 0, i = startIdx + marker.length;
        for (; i < fullText.length; i++) {
          var ch = fullText[i];
          if (ch === '[') depth++;
          else if (ch === ']') { if (depth === 0) break; depth--; }
        }
        var endIdx = fullText.indexOf(';', i);
        if (endIdx === -1) endIdx = i;
        fullText = fullText.substring(0, startIdx) + newBlock + fullText.substring(endIdx + 1);
      } else {
        fullText = fullText + '\n' + newBlock;
      }
    }

    // 写入
    if (fullText) {
      if (writeFile(path, fullText)) { showToast('✅ sources.js 已更新'); return; }
    } else {
      if (writeFile(path, newBlock + '\n')) { showToast('✅ sources.js 已保存'); return; }
      // 无文件 API → 降级到剪贴板/下载
      try {
        var code = newBlock + '\n';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(function () { showToast('已复制到剪贴板'); }).catch(function () {});
        } else {
          var blob = new Blob([code], { type: 'text/javascript' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'sources.local.js';
          a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
          showToast('已下载 sources.local.js');
        }
      } catch (e) { showToast('⚠️ 导出失败'); }
    }
  }

  function updateQuotaDisplay() {
    if (!feedQuota) return;
    var q = window._tuweiQuota;
    if (q && typeof q.limit !== 'undefined') {
      feedQuota.hidden = false;
      feedQuota.textContent = 'TuWei 额度 ' + (q.used || 0) + '/' + (q.limit || 0);
    } else {
      feedQuota.hidden = true;
    }
  }

  function openSettings() {
    if (setPanel) setPanel.classList.add('open');
    var o = document.getElementById('setOverlay');
    if (o) o.classList.add('is-visible');
  }
  function closeSettings() {
    if (setPanel) setPanel.classList.remove('open');
    var o = document.getElementById('setOverlay');
    if (o) o.classList.remove('is-visible');
  }

  /* ---------- 通用源认证框架 ----------
   * 各源在自身配置里声明 auth 描述符（注册地址 / 请求体构造 / token 解析 / 注入的请求头 / UI 选择器），
   * 此处只提供通用接线与持久化，不含任何单一源专属逻辑。 */
  function svAuthRead(name) {
    try { return JSON.parse(localStorage.getItem('SV_AUTH_' + name) || 'null'); } catch (e) { return null; }
  }
  function svAuthWrite(name, obj) {
    try { localStorage.setItem('SV_AUTH_' + name, JSON.stringify(obj)); } catch (e) {}
  }
  function svAuthSetHeaders(src, headers) {
    [SOURCES, window.DEFAULT_SOURCES].forEach(function (list) {
      (list || []).forEach(function (x) {
        if (!x || x.name !== src.name) return;
        if (!x.fetch) x.fetch = {};
        if (!x.fetch.headers) x.fetch.headers = {};
        for (var k in headers) { if (headers.hasOwnProperty(k)) x.fetch.headers[k] = headers[k]; }
      });
    });
  }
  function svAuthHint(src, msg, isErr) {
    var ui = src.auth && src.auth.ui || {};
    var el = ui.hint ? document.getElementById(ui.hint) : null;
    if (!el) return;
    el.textContent = msg;
    el.style.color = isErr ? '#ff6b6b' : '#80d8ff';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.textContent = ''; }, 4000);
  }
  function svAuthApply(src, token, device, user) {
    var hdrs = (typeof src.auth.headers === 'function') ? src.auth.headers(token, device) : {};
    svAuthSetHeaders(src, hdrs);
    svAuthWrite(src.name, { token: token, device: device || '', user: user || '' });
  }
  async function svAuthDoRegister(src, user, pass) {
    var a = src.auth;
    if (!user || !pass) { svAuthHint(src, '请输入用户名和密码', true); return; }
    svAuthHint(src, '正在请求注册接口…');
    try {
      var reg = a.register || {};
      var body = (typeof reg.body === 'function') ? reg.body(user, pass) : { username: user, password: pass };
      var r = await fetch(reg.url, {
        method: reg.method || 'POST',
        headers: { 'Content-Type': reg.contentType || 'application/json' },
        body: JSON.stringify(body)
      });
      var data;
      try { data = await r.json(); } catch (e) { data = null; }
      if (window.fy_bridge_app && window.fy_bridge_app.log) window.fy_bridge_app.log('[' + src.name + ' register] 返回: ' + (data ? JSON.stringify(data).slice(0, 400) : '非JSON'));
      if (!data) { svAuthHint(src, '返回数据解析失败', true); return; }
      var ext = (typeof a.extract === 'function') ? a.extract(data) : { token: data.token, device: data.device };
      if (!ext || !ext.token) { svAuthHint(src, '未找到 token（返回: ' + (data.msg || JSON.stringify(data).slice(0, 120)) + '）', true); return; }
      svAuthApply(src, ext.token, ext.device, user);
      svAuthHint(src, '✅ 已更新 Token' + (ext.device ? '（含 Device）' : ''));
    } catch (e) {
      svAuthHint(src, '请求失败: ' + (e && e.message || e), true);
    }
  }
  function setupSourceAuth() {
    if (!SOURCES) return;
    SOURCES.forEach(function (s) {
      if (!s || !s.auth) return;
      var ui = s.auth.ui || {};
      var userEl = ui.user ? document.getElementById(ui.user) : null;
      var pwdEl = ui.pwd ? document.getElementById(ui.pwd) : null;
      var btnEl = ui.btn ? document.getElementById(ui.btn) : null;
      try {
        var saved = svAuthRead(s.name);
        if (saved && saved.token) svAuthApply(s, saved.token, saved.device, saved.user);
        if (saved && saved.user && userEl) userEl.value = saved.user;
      } catch (e) {}
      if (btnEl) btnEl.addEventListener('click', function () {
        var u = userEl ? userEl.value.trim() : '';
        var p = pwdEl ? pwdEl.value : '';
        svAuthDoRegister(s, u, p);
      });
    });
  }

  var catViewParent = null;  // 当前弹窗所处的父级分类（null 表示顶层，仅旧 drill 模型用）
  var catGroupIdx = 0;       // 维度弹窗当前显示的维度索引

  function openCatPopup() {
    var s = currentSource();
    if (s.categoryGroups) { openGroupsPopup(); return; }
    if (!catPopup || !catPopupGrid || !s.categories || !s.categories.length) return;
    catViewParent = null;
    renderCatLevel();
    catPopup.hidden = false;
  }

  // 维度模型弹窗：顶部一排维度切换按钮，下方仅显示当前维度的选项
  function openGroupsPopup() {
    var s = currentSource();
    if (!catPopup || !catPopupGrid || !s.categoryGroups || !s.categoryGroups.length) return;
    catGroupIdx = 0;
    renderGroupsLevel();
    catPopup.hidden = false;
  }

  function renderGroupsLevel() {
    var s = currentSource();
    if (!catPopup || !catPopupGrid || !s.categoryGroups) return;
    if (catGroupIdx >= s.categoryGroups.length) catGroupIdx = 0;
    catPopupGrid.innerHTML = '';

    // 顶部维度切换按钮（仅当分组数 > 1 时显示，单分组源直接列选项）
    if (s.categoryGroups.length > 1) {
      var tabs = document.createElement('div');
      tabs.className = 'sv-cat-tabs';
      s.categoryGroups.forEach(function (g, gi) {
        var def = (g.options && g.options[0]) ? g.options[0].value : '';
        var isSet = (state.categoryParams[g.param] || '') !== def;
        var tab = document.createElement('button');
        tab.className = 'sv-cat-pop-chip sv-cat-tab' + (gi === catGroupIdx ? ' is-active' : '') + (isSet ? ' is-set' : '');
        tab.textContent = g.label + (isSet ? ' ●' : '');
        tab.addEventListener('click', function () {
          catGroupIdx = gi;
          renderGroupsLevel();
        });
        tabs.appendChild(tab);
      });
      catPopupGrid.appendChild(tabs);
    }

    // 当前维度下的选项
    var g = s.categoryGroups[catGroupIdx];
    var title = document.createElement('div');
    title.className = 'sv-cat-group-title';
    title.textContent = g.label;
    catPopupGrid.appendChild(title);

    (g.options || []).forEach(function (o) {
      var b = document.createElement('button');
      var active = (state.categoryParams[g.param] === o.value);
      b.className = 'sv-cat-pop-chip' + (active ? ' is-active' : '');
      b.textContent = o.label;
      b.addEventListener('click', function () {
        state.categoryParams[g.param] = o.value;
        state.categoryLabel = buildCatLabel(s);
        renderGroupsLevel();
        resetFeed();
      });
      catPopupGrid.appendChild(b);
    });
  }

  function renderCatLevel() {
    var s = currentSource();
    if (!catPopup || !catPopupGrid || !s.categories || !s.categories.length) return;
    catPopupGrid.innerHTML = '';

    var list;
    if (catViewParent) {
      // 二级：返回按钮 + 子分类
      var back = document.createElement('button');
      back.className = 'sv-cat-pop-chip sv-cat-pop-back';
      back.textContent = '← ' + catViewParent.label;
      back.addEventListener('click', function () {
        catViewParent = null;
        renderCatLevel();
      });
      catPopupGrid.appendChild(back);
      list = catViewParent.children || [];
    } else {
      list = s.categories;
    }

    list.forEach(function (c) {
      var b = document.createElement('button');
      var active = (c.key === state.categoryKey);
      // 顶层父级若其某个子项当前被选中，则高亮父级
      if (!catViewParent && c.children && c.children.some(function (ch) { return ch.key === state.categoryKey; })) {
        active = true;
      }
      b.className = 'sv-cat-pop-chip' + (active ? ' is-active' : '');
      b.textContent = c.label;
      b.addEventListener('click', function () {
        if (c.children && c.children.length) {
          // 进入二级，默认选中第一个子项（热门）
          var def = c.children[0];
          state.categoryKey = def.key;
          state.categoryLabel = c.label + ' / ' + def.label;
          catViewParent = c;
          renderCatLevel();
          resetFeed();
        } else {
          if (state.categoryKey === c.key) { closeCatPopup(); return; }
          state.categoryKey = c.key;
          state.categoryLabel = c.label;
          closeCatPopup();
          resetFeed();
        }
      });
      catPopupGrid.appendChild(b);
    });
  }
  function closeCatPopup() { if (catPopup) catPopup.hidden = true; }

  function bindSetTabs() {
    var tabs = document.querySelectorAll('.sv-set-tab');
    var pages = document.querySelectorAll('.sv-set-page');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.remove('is-active'); });
        t.classList.add('is-active');
        var name = t.dataset.tab;
        pages.forEach(function (p) { p.hidden = (p.dataset.page !== name); });
        if (name === 'manage') renderManageList();
        if (name === 'sources') renderSourceList();
      });
    });
    // 换源页：内置源 / 市场源 子 tab 切换
    $$('.sv-src-subtab').forEach(function (b) {
      b.addEventListener('click', function () {
        srcSubTab = b.dataset.srctab;
        renderSourceList();
      });
    });
  }

  function init() {
    if (muteBtn) muteBtn.addEventListener('click', toggleMute);
    if (setBtn) setBtn.addEventListener('click', openSettings);
    if (setPanelClose) setPanelClose.addEventListener('click', closeSettings);
    var setOverlay = document.getElementById('setOverlay');
    if (setOverlay) setOverlay.addEventListener('click', closeSettings);

    // 原始/满屏按钮
    var fitEl = document.getElementById('fitBtn');
    if (fitEl) {
      var fitLabel = fitEl.querySelector('.sv-action-count');
      if (fitLabel) fitLabel.textContent = state.fitCover ? '满屏' : '原始';
      fitEl.addEventListener('click', toggleFit);
    }

    // 全屏按钮
    var fsBtn = document.querySelector('.sv-fullscreen-btn');
    if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);

    // 分类按钮
    document.addEventListener('click', function catHandler(e) {
      var btn = e.target.closest('#catActionBtn');
      if (btn) { openCatPopup(); }
    });

    // 连播/循环按钮
    var loopEl = document.getElementById('loopBtn');
    if (loopEl) {
      var loopLabel = loopEl.querySelector('.sv-action-count');
      if (loopLabel) loopLabel.textContent = state.isLoop ? '循环' : '连播';
      loopEl.addEventListener('click', toggleLoop);
    }

    if (exportBtn) exportBtn.addEventListener('click', exportSources);
    if (restoreBtn) restoreBtn.addEventListener('click', restoreDefaults);
    var clearCacheBtn = $('#clearCacheBtn');
    if (clearCacheBtn) clearCacheBtn.addEventListener('click', clearCache);
    if (addSrcBtn) addSrcBtn.addEventListener('click', function () {
      if (srcAddForm && !srcAddForm.hidden) { srcAddForm.hidden = true; srcAddForm.dataset.edit = ''; addSrcBtn.textContent = '+ 新增源'; }
      else if (srcAddForm) { srcAddForm.hidden = false; srcAddForm.dataset.edit = ''; }
    });
    if (cancelAdd) cancelAdd.addEventListener('click', function () { if (srcAddForm) { srcAddForm.hidden = true; srcAddForm.dataset.edit = ''; } if (addSrcBtn) addSrcBtn.textContent = '+ 新增源'; });
    if (srcAddForm) srcAddForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(srcAddForm);
      var data = { name: fd.get('name'), url: fd.get('url'), type: fd.get('type'), mode: fd.get('mode'), categories: fd.get('categories'), urlTemplate: fd.get('urlTemplate') };
      var editIdx = srcAddForm.dataset.edit;
      if (editIdx) saveEdit(parseInt(editIdx, 10), data); else addSource(data);
      srcAddForm.hidden = true; srcAddForm.dataset.edit = ''; if (addSrcBtn) addSrcBtn.textContent = '+ 新增源';
    });
    if (catPopupClose) catPopupClose.addEventListener('click', closeCatPopup);
    if (catPopup) catPopup.addEventListener('click', function (e) { if (e.target === catPopup) closeCatPopup(); });
    // 通用源认证：各源在自身配置声明 auth 描述符，此处统一接线（无单一源专属逻辑）
    setupSourceAuth();
    bindSetTabs();
    var setCurSrc0 = $('#setCurSrc'); if (setCurSrc0) setCurSrc0.textContent = (currentSource() && currentSource().name) || '-';
    renderManageList();
    updateQuotaDisplay();
    state.sourceIndex = state.sourceIndex || 0;
    if (hint) {
      var wc = hint.querySelector('.sv-wheel-close');
      if (wc) wc.addEventListener('click', dismissHint);
      hint.addEventListener('wheel', dismissHint, { passive: true });
    }
    var shareBtn = $('.btn-share');
    if (wrapper) wrapper.addEventListener('click', function (e) {
      if (e.target.closest('.sv-action, .sv-card-meta, .sv-card-tag, .sv-fullscreen-btn')) return;
      var slide = e.target.closest('.sv-slide');
      if (slide) {
        var video = slide.querySelector('video');
        if (video) { video.paused ? video.play().catch(function () {}) : video.pause(); }
      }
    });
    document.addEventListener('keydown', function (e) {
      if (!state.swiper) return;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); state.swiper.slidePrev(); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); state.swiper.slideNext(); break;
        case 'm': case 'M': toggleMute(); break;
        case 'p': case 'P': toggleFit(); break;
        case 'b': case 'B': toggleLoop(); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'Escape': if (setPanel && setPanel.classList.contains('open')) closeSettings(); break;
      }
    });

    if (state.isMuted) { if (muteBtn) muteBtn.classList.add('is-muted'); } else { if (muteBtn) muteBtn.classList.remove('is-muted'); }
    renderSourceList();
    var s = currentSource();
    if (s.categoryGroups) {
      state.categoryParams = {};
      s.categoryGroups.forEach(function (g) {
        state.categoryParams[g.param] = (g.options && g.options[0]) ? g.options[0].value : '';
      });
      state.categoryLabel = buildCatLabel(s);
    } else {
      state.categoryKey = (s.categories && s.categories.length) ? s.categories[0].key : '';
      state.categoryLabel = (s.categories && s.categories.length) ? s.categories[0].label : '';
    }
    buildCatBar();
    appendSlides(BATCH);
    initSwiper();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== 解析期版本标记（用于确认 Hiker 实际加载的是否最新文件）=====
  hikerLog('[sv_multi] BUILD=20260718D 已加载');
  hikerLog('[diag] engine.js 状态: ' + (typeof window.buildSourceRequest === 'function' ? '已加载 ✅' : '未加载 ❌(buildSourceRequest 不存在)'));
})();
