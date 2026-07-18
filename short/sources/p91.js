// ============================================================
// 源：91短视频
// 源配置 + 数据解析器（独立文件）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true,    name: "91短视频",
    url: "https://book.zedcsvynk.com/melonshort/list?page={page}&cate_id=0",
    type: "feed", mode: "multi", parser: "p91",
    fetch: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://book.zedcsvynk.com/melonshort',
        'Origin': 'https://book.zedcsvynk.com',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    },
    categoryGroups: [
      { label: "分类", param: "cat", flat: true, options: [
        { label: "推荐", value: "0" },
        { label: "高燃混剪", value: "18" },
        { label: "素人自拍", value: "19" },
        { label: "原创自拍", value: "14" },
        { label: "反差系列", value: "17" },
        { label: "网红达人", value: "16" },
        { label: "明星大瓜", value: "15" }
      ] }
    ],
    urlTemplate: "https://book.zedcsvynk.com/melonshort/list?page={page}&cate_id={cat}"
  });

  // ---- 解析器（91短视频 / p91 格式）----
  window.FeedParsers['p91'] = function (data) {
    var list = [];
    if (data && data.data && Array.isArray(data.data.list)) {
      list = data.data.list;
    } else if (data && data.list && Array.isArray(data.list)) {
      list = data.list;
    }
    if (!list.length) {
      console.warn('[FeedParsers.p91] list 为空');
      return [];
    }
    return list.map(function (item) {
      if (!item || !item.video_url) return null;
      return {
        url: item.video_url,
        sd_url: item.sd_url || '',
        fhd_url: item.fhd_url || '',
        user: item.user_name || '',
        text: item.title || item.desc || '',
        likes: item.like_num || 0,
        comments: item.comment_num || 0,
        favorites: item.collect_num || 0,
        tags: item.tags || []
      };
    }).filter(Boolean);
  };
})();
