
//    切勿改成 api.xfree.com —— 该主机即使带 JWT 也返回 302 重定向，会导致源失效。
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  
  var XFREE_BASE  = 'https://www.xfree.com/api/rs/';
 
  var XFREE_CDN   = 'https://cdn.xfree.com/xfree-prod/';

  var XFREE_HOME  = XFREE_BASE + 'homepage/?{cat}&tag={tag}&device=desktop&limit=12';

  var XFREE_CUR_TAG = 'lgbt=0|Fucking';   // 当前 (lgbt,tag) 维度组合，用于游标按维度隔离

  // 若日后 JWT 失效，替换下面这一串即可（也可从用户浏览器 xfree.com 的 cookie anonymous=... 重新取）。
  var XFREE_JWT = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyVWlkIjoiMDE5Zjc0YzQtZjdkZS03MjhiLWJhYTAtODRlMWZlNzA1NjA0IiwiaXNzIjoieGZyZWUtc2VydmVyIiwic3ViIjoiYW5vbnltb3VzIn0.WFM9U1mInmeMdvUDP18FVTFjCofQ2qKDoS-w9Qhu6Nr9FCdVb7KKmzcUkbYkAVzGpDebVjO36G4AsT_hDOKT6m0IfTMwdHvVKGtfnWYN8KqidsQui-rUcM4FuJm4toKqUZxDVl9or0jIKdrSgC7Mjp63sBHnpoa7pscTA0_g8cyhYcjbXmS6YkMOc4FJtAOTxUP-mmQEOLOzinN4BZbQ5VaUupyFxjy5D1K-10MbMxH7MbdIxJz86mno3iS2iVdX4OTuLXLr4Wh7mVW0ETY72MznJaiYuwVD_NzDfZl3tyicHktdg7XFFmFZ8nCKSiCGPF2xyVACDBJhd4GabQpVOQ';
  function getNextUrl(baseCurl, cat, tag) {
    XFREE_CUR_TAG = (cat ? cat + '|' : '') + (tag || '');
    var ck = 'cursor_xfree_' + XFREE_CUR_TAG;
    var rid = (window._srcCursor && window._srcCursor[ck]) || '';
    // 有游标 → 切到 /api/rs/next/ 接力续页（recommId 为稳定会话游标，沿用首屏的值）
    if (rid) return XFREE_BASE + 'next/?type=post&recommId=' + encodeURIComponent(rid) + '&limit=12';
    // 首屏（无游标）→ 返回 homepage（{cat}/{tag} 已由框架替换）
    return baseCurl;
  }

  // ========== 源配置 ==========
  window.DEFAULT_SOURCES.push({
    fromFile: true,
    name: "xfree",

    url: XFREE_BASE + 'homepage/?lgbt=0&tag=Fucking&device=desktop&limit=12',
    urlTemplate: XFREE_HOME,
    type: "feed",
    mode: "multi",
    parser: "xfree",
    getNextUrl: getNextUrl,

    catBase: '',
    categoryGroups: [
      // 取向维度（对应网页 lgbt 选择器，由 lgbt_triggers 确认：0=All 1=Straight 2=Gay 3=Trans 4=Lesbian）
      { label: "取向", param: "lgbt", options: [
        { label: "全部", value: "0" },
        { label: "直", value: "1" },
        { label: "男同", value: "2" },
        { label: "跨", value: "3" },
        { label: "女同", value: "4" }
      ]},
      // 分类维度：取自网页 /api/tag/category 真实标签（共 30 个），按 useCount 热度降序，slug 用站点规范 PascalCase
      { label: "分类", param: "tag", path: true, options: [
        { label: "Amateurs", value: "Amateurs" },
        { label: "Teen", value: "Teen" },
        { label: "Beautiful", value: "Beautiful" },
        { label: "Blowjob", value: "Blowjob" },
        { label: "Fucking", value: "Fucking" },
        { label: "Cumshot", value: "Cumshot" },
        { label: "Dildo", value: "Dildo" },
        { label: "MILF", value: "MILF" },
        { label: "FlashingTits", value: "FlashingTits" },
        { label: "Anal", value: "Anal" },
        { label: "BigAss", value: "BigAss" },
        { label: "Facial", value: "Facial" },
        { label: "Deepthroat", value: "Deepthroat" },
        { label: "BBC", value: "BBC" },
        { label: "Ebony", value: "Ebony" },
        { label: "Public", value: "Public" },
        { label: "Photos", value: "Photos" },
        { label: "Squirt", value: "Squirt" },
        { label: "Muscular", value: "Muscular" },
        { label: "Hairy", value: "Hairy" },
        { label: "Pissing", value: "Pissing" },
        { label: "Challenge", value: "Challenge" },
        { label: "Czech", value: "Czech" },
        { label: "Ahegao", value: "Ahegao" },
        { label: "PublicFlashing", value: "PublicFlashing" },
        { label: "Twerking", value: "Twerking" },
        { label: "HairyCock", value: "HairyCock" },
        { label: "Funny", value: "Funny" },
        { label: "FaceMask", value: "FaceMask" },
        { label: "FestivalSluts", value: "FestivalSluts" }
      ]}
    ],
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
        'Referer': 'https://www.xfree.com/',
        'Priority': 'u=1, i',
        'Authorization': 'Bearer ' + XFREE_JWT
      },

      credentials: 'include'
    }
  });

  // ========== 解析器 ==========
  window.FeedParsers['xfree'] = function (data) {
    // 兼容两种形态：{statusCode, body} 或 直出 body
    var root = (data && data.body) ? data.body : data;
    if (!root) { console.warn('[FeedParsers.xfree] 无 body'); return []; }
    var ck = 'cursor_xfree_' + XFREE_CUR_TAG;
    if (!window._srcCursor) window._srcCursor = {};
    if (root.eol) {
      delete window._srcCursor[ck];
    } else if (root.recommId) {
      window._srcCursor[ck] = root.recommId;
    }

    var posts = [];
    if (Array.isArray(root.posts)) posts = root.posts;
    else if (Array.isArray(root.banners)) posts = root.banners;
    else if (Array.isArray(root)) posts = root;
    if (!posts.length) {
      console.warn('[FeedParsers.xfree] posts 为空');
      return [];
    }

    return posts.filter(function (p) {
      // 仅保留带可播放视频的卡片（media.name 存在）
      return p && p.media && p.media.name;
    }).map(function (p) {
      var m = p.media, nm = m.name;
      // 拼装 cdn.xfree.com 直链（公开，无 Referer/签名要求；实测 206）
      var suffix = m.listingSuffix ? ('?' + m.listingSuffix) : '';
      var vurl = XFREE_CDN + nm[0] + '/' + nm[1] + '/' + nm[2] + '/' + nm + '/listing7.mp4' + suffix;
      // 海报缩略图（thumbs.xfree.com，索引 _1 稳定存在，实测 206）
      var poster = 'https://thumbs.xfree.com/listing/medium/' + nm + '_1.webp';
      var user = (p.user && (p.user.displayName || p.user.username)) || '';
      var tags = Array.isArray(p.tags)
        ? p.tags.map(function (t) { return (t && t.tag) || ''; }).filter(Boolean)
        : [];
      return {
        url: vurl,
        sd_url: '',
        fhd_url: '',
        poster: poster,
        user: user,
        text: p.title || p.description || '',   // 真实字段为 title（无 text）
        likes: p.likesCount || 0,
        comments: p.commentsCount || p.comments || 0,
        favorites: p.favoritesCount || p.favorites || 0,
        tags: tags
      };
    });
  };
})();
