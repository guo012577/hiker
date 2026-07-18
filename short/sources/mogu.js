// ============================================================
// 源：蘑菇视频
// 源配置 + 数据解析器（独立文件，复用 vlog 解析器）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true,    name: "蘑菇视频",
    url: "https://8.136.14.184/api/vlog/list?limit=12&page={page}",
    type: "feed", mode: "multi", parser: "vlog",
    fetch: {
      pageKey: 'moguPage',
      randomPage: true,          // 每次请求随机页码
      maxPage: 2149              // 随机范围 1~2149
    }
  });

  // ---- 解析器（Vlog 格式：data.data.list / data.list 嵌套，play_url 字段）----
  window.FeedParsers['vlog'] = function (data) {
    var list = [];
    if (data.data && data.data.list && Array.isArray(data.data.list)) {
      list = data.data.list;
    } else if (data.list && Array.isArray(data.list)) {
      list = data.list;
    }
    return list.filter(function (item) { return item.play_url || item.video_url || item.url || item.src; }).map(function (item) {
      var vurl = item.play_url || item.video_url || item.url || item.src || '';
      return {
        url: vurl,
        sd_url: '',
        fhd_url: '',
        user: (item.user && item.user.name) || item.author || item.user || item.username || '',
        text: item.title || item.desc || item.description || '',
        likes: item.like_count || item.likes || 0,
        comments: item.comments || 0,
        favorites: item.favorites || 0,
        tags: item.tags || (item.category ? [item.category] : [])
      };
    });
  };
})();
