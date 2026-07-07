// ============================================================
// 源：Sky Porn
// 源配置 + 数据解析器（独立文件）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// 维度：分类(niche) × 标签(tag) × 排序(sort)，正交筛选
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    name: "Sky Porn",
    url: "https://sky.porn/api/feed?niche&tag&type=all&sort=trending&limit=12&cursor={cursor}",
    type: "feed", mode: "multi", parser: "skyPorn",
    fetch: {},
    categoryGroups: [
      { label: "分类", param: "niche", options: [
        { label: "全部", value: "" },
        { label: "看剧情", value: "watch-it-for-the-plot" },
        { label: "金发", value: "fair-haired" }
      ]},
      { label: "标签", param: "tag", options: [
        { label: "全部", value: "" }
      ]},
      { label: "排序", param: "sort", options: [
        { label: "热门", value: "trending" },
        { label: "近期", value: "recent" }
      ]}
    ],
    urlTemplate: "https://sky.porn/api/feed?{cat}&limit=12&cursor={cursor}"
  });

  // ---- 解析器（Sky Porn 格式：items 数组，media.url）----
  window.FeedParsers['skyPorn'] = function (data) {
    var items = [];
    if (data && Array.isArray(data.items)) {
      items = data.items;
    }
    if (!items.length) {
      console.warn('[FeedParsers.skyPorn] items 为空');
      return [];
    }
    return items.map(function (item) {
      if (!item || !item.media) return null;
      var vurl = item.media.url || '';
      if (!vurl) return null;
      var record = item.records && item.records[0] || {};
      var author = record.author || {};
      return {
        url: vurl,
        sd_url: '',
        fhd_url: '',
        user: author.handle || '',
        user_avatar: author.avatar || '',
        text: record.text || '',
        likes: item.media.likeCount || 0,
        comments: 0,
        favorites: 0,
        tags: (item.media.niches || []).map(function (n) { return n.name; })
      };
    }).filter(Boolean);
  };
})();
