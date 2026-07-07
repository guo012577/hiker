// ============================================================
// 源：xxxtik
// 源配置 + 数据解析器（独立文件）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true,    name: "xxxtik",
    url: "https://xxxtik-api-iw98m.ondigitalocean.app/post/new?limit=21&cursor={cursor}",
    type: "feed", mode: "multi", parser: "xxxtik",
    fetch: {},
    categoryGroups: [
      { label: "分类", param: "cat", flat: true, options: [
        { label: "最新", value: "new" },
        { label: "年度排行", value: "top/year" },
        { label: "棕发", value: "tag/brunette" }
      ]}
    ],
    urlTemplate: "https://xxxtik-api-iw98m.ondigitalocean.app/post/{cat}?limit=21&cursor={cursor}"
  });

  // ---- 解析器（xxxtik 格式：posts 数组，优先用 uid 构造 p5rn CDN 链接）----
  window.FeedParsers['xxxtik'] = function (data) {
    var posts = [];
    if (Array.isArray(data)) {
      posts = data;
    } else if (data && data.data && Array.isArray(data.data.posts)) {
      posts = data.data.posts;
    }
    if (!posts.length) {
      console.warn('[FeedParsers.xxxtik] posts 为空');
      return [];
    }
    return posts.map(function (item) {
      if (!item) return null;
      // 优先用 uid 构造视频链接
      var vurl = '';
      if (item.uid) {
        vurl = 'https://p5rn.com/cdn/production/media/0312/' + item.uid + '/master.m3u8';
      } else {
        vurl = item.redGifsVideoUrl || item.source || '';
      }
      if (!vurl) return null;
      return {
        url: vurl,
        sd_url: '',
        fhd_url: '',
        user: (item.author && item.author.name) || '',
        text: item.description || '',
        likes: item.likes || 0,
        comments: 0,
        favorites: 0,
        tags: (item.tags || []).map(function (t) { return t.name; }),
        _rawId: item.id
      };
    }).filter(Boolean);
  };
})();
