// ============================================================
// 源：屋里社
// 源配置 + 数据解析器（独立文件）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true,    name: "屋里社",
    url: "https://wulishe.site/wp-json/b2/v1/getTopicList",
    type: "feed", mode: "multi", parser: "wulishe",
    fetch: {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: 'paged={page}&circle_id=2&type={catType}&order_by={catOrderBy}&role=all&file=video&status=&author=0',
      pageKey: 'wulishePage',
      randomPage: true,          // 每次请求都随机页码
      maxPage: 903                // 随机范围 1~903
    },
    categoryGroups: [
      { label: "分类", param: "cat", flat: true, options: [
        { label: "随机推荐", value: "all-random" },
        { label: "最新话题", value: "all-date" },
        { label: "最多点赞", value: "all-up" }
      ] }
    ],
    urlTemplate: "https://wulishe.site/wp-json/b2/v1/getTopicList?cat={cat}"
  });

  // ---- 解析器 ----
  window.FeedParsers['wulishe'] = function (data) {
    var list = [];
    // 防御：确保 data 存在且是对象
    if (!data || typeof data !== 'object') {
      console.warn('[FeedParsers.wulishe] 数据异常:', typeof data);
      return [];
    }
    if (data.data && Array.isArray(data.data)) {
      list = data.data;
    } else if (Array.isArray(data)) {
      list = data;
    }
    if (list.length === 0) {
      console.warn('[FeedParsers.wulishe] 解析结果为空');
      return [];
    }
    return list.filter(function (item) {
      return item && item.attachment && item.attachment.video;
    }).map(function (item) {
      var att = item.attachment;
      // attachment.video 可能是字符串、数组或对象，确保转成字符串
      var videoUrl = '';
      if (att && att.video) {
        if (typeof att.video === 'string') {
          videoUrl = att.video;
        } else if (Array.isArray(att.video) && att.video.length > 0 && att.video[0].link) {
          videoUrl = att.video[0].link;   // B2 主题格式：数组 [{link, poster, mime_type, ...}]
        } else if (typeof att.video === 'object' && att.video.url) {
          videoUrl = att.video.url;
        } else if (Array.isArray(att.video) && att.video.length > 0 && typeof att.video[0] === 'string') {
          videoUrl = att.video[0];          // 纯字符串数组
        } else {
          try { videoUrl = String(att.video); } catch (e) {}
        }
      }
      if (typeof videoUrl === 'string' && videoUrl && !videoUrl.startsWith('http')) {
        videoUrl = 'https://wulishe.site' + videoUrl;
      }
      return {
        url: videoUrl,
        sd_url: '',
        fhd_url: '',
        user: item.user && item.user.display_name ? item.user.display_name : '',
        text: item.title || item.post_title || '',
        likes: (item.count && item.count.like) || 0,
        comments: (item.count && item.count.comment) || 0,
        favorites: 0,
        tags: item.tags || []
      };
    });
  };
})();
