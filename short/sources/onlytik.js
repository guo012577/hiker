// ============================================================
// 源：onlytik🪜
// 源配置 + 数据解析器（独立文件）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true,    name: "onlytik🪜",
    url: "https://onlytik.com/api/new-videos",
    type: "feed", mode: "multi", parser: "onlytik",
    fetch: {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: 'filter%5B%5D=W6Dk&limit=10'
    }
  });

  // ---- 解析器（onlytik 格式：扁平数组）----
  window.FeedParsers['onlytik'] = function (data) {
    var list = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
    return list.filter(function (item) { return item.video || item.url || item.video_url; }).map(function (item) {
      var vurl = item.video || item.url || item.video_url || '';
      // 清理 tags：从 HTML 字符串中提取纯文本标签名
      var rawTags = item.tags;
      var cleanTags = [];
      if (Array.isArray(rawTags)) {
        for (var i = 0; i < rawTags.length; i++) {
          if (typeof rawTags[i] === 'string') {
            // 从 <span ...>#tagname</span> 中提取 #tagname
            var match = rawTags[i].match(/>(#[^<]+)</);
            cleanTags.push(match ? match[1] : rawTags[i].replace(/<[^>]+>/g, ''));
          } else {
            cleanTags.push(rawTags[i]);
          }
        }
      }
      return {
        url: vurl,
        sd_url: '',
        fhd_url: '',
        user: item.author || item.username || '',
        text: item.title || item.desc || '',
        likes: item.likes || 0,
        comments: 0,
        favorites: 0,
        tags: cleanTags
      };
    });
  };
})();
