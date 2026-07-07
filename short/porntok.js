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
        { label: "Petite", value: "petite" }, { label: "Amateur", value: "amateur" },
        { label: "MILF", value: "milf" }, { label: "Lesbian", value: "lesbian" },
        { label: "BDSM", value: "bdsm" }, { label: "Big_Tits", value: "big-tits" },
        { label: "Anal", value: "anal" }, { label: "Teen_18+", value: "teen-18plus" },
        { label: "Asian", value: "asian" }, { label: "Ebony", value: "ebony" },
        { label: "Cosplay", value: "cosplay" }, { label: "Hentai_Animated", value: "hentai-animated" },
        { label: "Cumshots", value: "cumshots" }, { label: "BBW", value: "bbw" },
        { label: "Gay", value: "gay" }, { label: "Fetish", value: "fetish" },
        { label: "Redhead", value: "redhead" }, { label: "Public_Outdoor", value: "public-outdoor" },
        { label: "Couples", value: "couples" }, { label: "Trans", value: "trans" },
        { label: "Indian", value: "indian" }, { label: "Creators", value: "creators" },
        { label: "Porn_For_Women", value: "porn-for-women" }, { label: "Ethical_Porn", value: "ethical-porn" },
        { label: "Latina", value: "latina" }
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
