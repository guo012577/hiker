// ============================================================
// 源：ReddClips🪜
// 源配置 + 数据解析器（独立文件）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true,    name: "ReddClips🪜",
    url: "https://api.reddclips.com/categories/16/posts?sort=hot&limit=25",
    type: "feed", mode: "multi", parser: "reddclips",
    categoryGroups: [
      { label: "分类", param: "cat", flat: true, options: [
        { label: "Asian", value: "16" }, { label: "Hetero", value: "6" }, { label: "NSFW Transgender", value: "9" },
        { label: "Hentai & Anime", value: "13" }, { label: "BDSM & Fetish", value: "14" },
        { label: "Lesbian", value: "15" }, { label: "Latina & Ebony", value: "17" },
        { label: "MILF & Mature", value: "18" }, { label: "Public & Exhibitionism", value: "19" },
        { label: "Cosplay & Alt/Goth", value: "20" }, { label: "Anal", value: "21" },
        { label: "Feet", value: "22" },
        { label: "Threesome\\Group", value: "23" }, { label: "Amateur\\Homemade", value: "24" },
        { label: "Petite\\Tiny", value: "25" }, { label: "Curvy\\Thick", value: "26" },
        { label: "Redheads", value: "27" }, { label: "Oral\\Blowjobs", value: "28" }
      ] }
    ],
    urlTemplate: "https://api.reddclips.com/categories/{cat}/posts?sort=hot&limit=25"
  });

  // ---- 解析器（ReddClips 格式：posts 数组，mediaUrl 拼接）----
  window.FeedParsers['reddclips'] = function (data) {
    var list = data.posts && Array.isArray(data.posts) ? data.posts : [];
    return list.filter(function (item) { return item.mediaUrl; }).map(function (item) {
      var vurl = item.mediaUrl;
      if (vurl) {
        if (vurl.startsWith('http')) {
          // 已经是完整 URL，直接使用
        } else if (vurl.indexOf('/') > -1) {
          // 包含路径，补全域名
          vurl = 'https://api.reddclips.com' + (vurl.startsWith('/') ? '' : '/') + vurl;
        } else {
          // 只是 ID，构造完整 URL：https://api.reddclips.com/video/{id}.mp4
          vurl = 'https://api.reddclips.com/video/' + vurl + '.mp4';
        }
      }
      return {
        url: vurl,
        sd_url: '',
        fhd_url: '',
        user: item.author || item.username || '',
        text: item.title || '',
        likes: item.score || 0,
        comments: item.numComments || 0,
        favorites: 0,
        tags: item.subreddit ? [item.subreddit] : []
      };
    });
  };
})();
