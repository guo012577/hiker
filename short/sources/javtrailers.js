// ============================================================
// 源：JavTrailers
// 由 sourceMarket.js 经 LOCAL_SOURCE_FILES 在解析期注入（非 index_multi.html 硬编码）。
// 播放：视频链接统一包公网 m3u8 代理（CF Worker 在 worker 端注入 Referer/Origin 防盗链头），
//       海阔 WebView 与桌面端经同一代理加载，绕开 WebView 禁止头与 ;{...} 原生语法限制。
// 解析器输出统一卡片字段：url / sd_url / fhd_url / user / text / likes / comments / favorites / tags
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // 公网 m3u8 代理（Cloudflare Worker）：在 worker 端为 m3u8 及其 ts 分片注入
  // Referer/Origin 等防盗链头，海阔 WebView 与桌面端统一走此代理加载，
  // 不再依赖 ;{...} 原生头后缀（WebView 的 XHR/fetch 不拦截该语法）。
  var _proxy = 'https://m3u8-proxy.guo012577.workers.dev/proxy';

  // ---- 视频地址构造 ----
  // 两种数据格式：
  //  格式1：csuid/bid 直接是完整 m3u8 URL（含 live 直链，保留并 text 标「直播」）。
  //  格式2：bid 为 Bunny uuid，按公式拼 b-cdn 主列表：
  //         https://vz-c20a9510-a5e.b-cdn.net/{bid}/playlist.m3u8
  var _cdnB = 'vz-c20a9510-a5e.b-cdn.net';
  function _isUrl(s) { return typeof s === 'string' && s.indexOf('http') === 0; }

  // 原始 m3u8（未包代理）
  function rawVideoUrl(it) {
    if (!it) return '';
    if (_isUrl(it.csuid)) return it.csuid;              // 格式1 / live 完整 m3u8
    if (_isUrl(it.bid)) return it.bid;                 // 部分格式1 bid 也是完整 URL
    if (typeof it.bid === 'string' && !_isUrl(it.bid))
      return 'https://' + _cdnB + '/' + it.bid + '/playlist.m3u8'; // 格式2
    return '';
  }
  // 包代理：PROXY + '?url=' + encodeURIComponent(原始 m3u8)
  function buildVideoUrl(it) {
    var raw = rawVideoUrl(it);
    if (!raw) return '';
    return _proxy + '?url=' + encodeURIComponent(raw);
  }
  window.__M3U8_PROXY__ = _proxy;
  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true, name: "javtrailers",
    url: "https://javtrailers.com/api/shorts?page=0&sort=for-you&excludemodels=",
    type: "feed", mode: "multi", parser: "javtrailers",
    categoryGroups: [
      { label: "排序", param: "cat", flat: true, options: [
        { label: "推荐", value: "for-you" },
        { label: "最新", value: "new" },
        { label: "预告", value: "trailer" }
      ] }
    ],
    fetch: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Authorization': 'AELAbPQCh_fifd93wMvf_kxMD_fqkUAVf@BVgb2!md@TNW8bUEopFExyGCoKRcZX',
        'Referer': 'https://javtrailers.com/shorts'
      }
    },
    urlTemplate: "https://javtrailers.com/api/shorts?page={page}&sort={cat}&excludemodels="
  });

  // ---- 解析器（JavTrailers 格式：shorts 数组）----
  window.FeedParsers['javtrailers'] = function (data) {
    var list = data.shorts && Array.isArray(data.shorts) ? data.shorts : [];
    return list.filter(function (it) {
      return it && buildVideoUrl(it);   // 直播(live)链接保留，仅 text 标记
    }).map(function (it) {
      var author = (it.creator && it.creator.username) || '';
      return {
        url: buildVideoUrl(it),                          // 主列表（包公网 m3u8 代理）
        sd_url: '',
        fhd_url: '',
        user: author,
        text: it.live ? '直播' : (it.videoContentId || it.duration || ''),    // 直播标记；否则番号代码
        likes: 0,
        comments: 0,
        favorites: 0,
        tags: it.tags || []
      };
    });
  };
})();
