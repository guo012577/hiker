// ============================================================
// 源：XFree（xfree.com 推荐流，feed + multi）
// 由 sourceMarket.js 经 LOCAL_SOURCE_FILES 在解析期注入（无需改 HTML）。
// 解析器输出统一卡片字段：url / sd_url / fhd_url / user / text / likes / comments / favorites / tags
//
// ★ 翻页机制（换端点游标）
// - 首屏接口：GET https://www.xfree.com/api/rs/xbn/ ，query 含 lgbt / tag / country / device / limit。
// - 下一页接口：GET https://www.xfree.com/api/rs/next/ ，query 含 type=post / recommId / limit。
//   recommId 取自首屏返回的 body.recommId（游标），存于 window._srcCursor['cursor_xfree_']；
//   由下方 getNextUrl() 钩子在下一页请求时拼成 next URL（sv_multi.js 的 fetchFeedList 会调用它）。
// - 与通用 {cursor} 机制不同：XFree 是「换端点」（xbn→next），非同一端点加参数，故用源自定义钩子。
//
// ★ 数据说明
// - 返回结构：{ statusCode, body:{ recommId, banners:[...] } }。
// - banners 每项即一个视频卡片：
//     video       : 完整 mp4 直链（cdn77.hqmediago.com，优先用这个）
//     video_sample: 试看 mp4（video 缺失时回退用）
//     url         : 外站播放页（网页，非视频，不用于播放）
//     title       : 标题
//     user        : { displayName, username }
//     tags        : [{ tag, id, lang }]
// - mode:multi：banners 列表里每个视频各成一个滑动项（多视频队列）。
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  var XFREE_BASE  = 'https://www.xfree.com/api/rs/';
  var XFREE_FIRST = XFREE_BASE + 'xbn/?lgbt=1&tag=18&country=HK&device=desktop&limit=5';
  var XFREE_NEXT  = XFREE_BASE + 'next/?type=post&recommId=';

  // ========== 翻页钩子（供 sv_multi.js fetchFeedList 调用） ==========
  // 无游标 → 首屏 xbn；有游标 → 下一页 next?recommId=xxx
  function getNextUrl() {
    var rid = (window._srcCursor && window._srcCursor['cursor_xfree_']) || '';
    if (rid) return XFREE_NEXT + encodeURIComponent(rid) + '&limit=5';
    return XFREE_FIRST;
  }

  // ========== 源配置 ==========
  window.DEFAULT_SOURCES.push({
    fromFile: true,
    name: "xfree",
    url: XFREE_FIRST,
    type: "feed",
    mode: "multi",
    parser: "xfree",
    getNextUrl: getNextUrl,
    fetch: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en,zh-CN;q=0.9,zh;q=0.8',
        'apiversion': '1.0',
        'app-version': 'xf1.41.8',
        'country': 'HK',
        'language': 'en-US',
        'sec-ch-ua': '"Not;A=Brand";v="8", "Chromium";v="150", "Microsoft Edge";v="150"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'Referer': 'https://www.xfree.com/tag/18',
        'Priority': 'u=1, i'
      },
      // 翻页 next 接口需带会话 cookie（原浏览器请求 credentials:include）；
      // 透传到 fetchOptions，由 buildSourceRequest 转发，WebView 跨域带/存 cookie。
      credentials: 'include'
    }
  });

  // ========== 解析器 ==========
  window.FeedParsers['xfree'] = function (data) {
    // 翻页游标：首屏/下一页返回的 body.recommId → 写入通用游标槽（与源 name 对应）
    if (data && data.body && data.body.recommId) {
      if (!window._srcCursor) window._srcCursor = {};
      window._srcCursor['cursor_xfree_'] = data.body.recommId;
    }
    // 防御：兼容多种嵌套结构
    // xbn 接口返回 body.banners；next 接口返回 body.posts（字段名不同）
    var banners = [];
    if (data && data.body && Array.isArray(data.body.banners)) {
      banners = data.body.banners;
    } else if (data && data.body && Array.isArray(data.body.posts)) {
      banners = data.body.posts;
    } else if (data && Array.isArray(data.banners)) {
      banners = data.banners;
    } else if (data && Array.isArray(data.posts)) {
      banners = data.posts;
    } else if (Array.isArray(data)) {
      banners = data;
    }
    if (!banners.length) {
      console.warn('[FeedParsers.xfree] banners 为空');
      return [];
    }
    return banners.filter(function (b) {
      return b && (b.video || b.video_sample);   // 过滤无视频项
    }).map(function (b) {
      var vurl = b.video || b.video_sample || '';
      var user = (b.user && (b.user.displayName || b.user.username)) || '';
      var tags = Array.isArray(b.tags)
        ? b.tags.map(function (t) { return (t && t.tag) || ''; }).filter(Boolean)
        : [];
      return {
        url: vurl,
        sd_url: '',
        fhd_url: '',
        user: user,
        text: b.title || b.text || '',
        likes: b.likes || 0,
        comments: b.comments || 0,
        favorites: b.favorites || 0,
        tags: tags
      };
    });
  };
})();
