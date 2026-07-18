// ============================================================
// 源：PornTok🪜
// 源配置 + 数据解析器（独立文件）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true,    name: "PornTok🪜",
    url: "https://porntok.io/api/videos?content_rating=all",
    type: "feed", mode: "multi", parser: "porntok",
    categoryGroups: [
      { label: "分类", param: "cat", flat: true, options: [
        { label: "小个子", value: "petite" }, { label: "业余", value: "amateur" },
        { label: "熟女", value: "milf" }, { label: "女同", value: "lesbian" },
        { label: "BDSM", value: "bdsm" }, { label: "大胸", value: "big-tits" },
        { label: "肛交", value: "anal" }, { label: "青少年", value: "teen-18plus" },
        { label: "亚洲", value: "asian" }, { label: "黑色", value: "ebony" },
        { label: "Cosplay", value: "cosplay" }, { label: "涩情动画", value: "hentai-animated" },
        { label: "高潮", value: "cumshots" }, { label: "丰满", value: "bbw" },
        { label: "男同", value: "gay" }, { label: "恋物癖", value: "fetish" },
        { label: "红发", value: "redhead" }, { label: "户外", value: "public-outdoor" },
        { label: "情侣", value: "couples" }, { label: "变性", value: "trans" },
        { label: "印度", value: "indian" }, { label: "受欢迎", value: "creators" },
        { label: "女性涩情", value: "porn-for-women" }, { label: "健康色清", value: "ethical-porn" },
        { label: "拉丁裔女性", value: "latina" }
      ] }
    ],
    urlTemplate: "https://porntok.io/api/videos?category={cat}"
  });

  // ---- 解析器（PornTok 格式）----
  window.FeedParsers['porntok'] = function (data) {
    if (!data.videos || !Array.isArray(data.videos)) return [];
    return data.videos.filter(function (v) { return v.path; }).map(function (item) {
      return {
        url: item.hls_url || item.path,
        sd_url: '',
        fhd_url: '',
        user: item.author || '',
        text: item.title || '',
        likes: item.saved_count || 0,
        comments: 0,
        favorites: item.saved_count || 0,
        tags: item.subreddit ? [item.subreddit] : (item.category ? [item.category] : [])
      };
    });
  };
})();
