// ============================================================
// sexladyya 平台短时频源合集
// 列表接口仅返回元数据+缩略图，真实可播放视频地址需二次请求 ?id=<id> 详情。
// 卡片 url 设为「详情接口地址」作为懒解析标记，engine.js 的 resolveVideoUrl
// 在播放前按 id 二次请求取真实 .video 直链。
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  var COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'http://randomapi06.sexladyya.top/'
  };

  /** 注册一个 sexladyya 平台的源
   *  @param name      - parser 键名（FeedParsers[name]），也用于日志标记
   *  @param label     - 源列表显示名（name 字段）
   *  @param baseUrl   - 完整 SEX_BASE（含 .php，不含 query）
   *  @param cats      - categoryGroups options 数组 [{label, value}, ...]
   */
  function registerSource(name, label, baseUrl, cats) {
    var defaultCat = cats[0] ? cats[0].value : '';

    window.DEFAULT_SOURCES.push({
      fromFile: true,
      name: label,
      url: baseUrl + '?sort=' + defaultCat + '&page=0',
      type: "feed",
      mode: "multi",
      parser: name,
      startPage: 0,
      catBase: '',
      categoryGroups: [
        { label: "分类", param: "sort", flat: true, options: cats }
      ],
      fetch: { headers: COMMON_HEADERS },
      urlTemplate: baseUrl + '?sort={cat}&page={page}'
    });

    window.FeedParsers[name] = function (data) {
      var root = (data && data.videos) ? data.videos : (Array.isArray(data) ? data : []);
      if (!root.length) {
        console.warn('[FeedParsers.' + name + '] videos 为空');
        return [];
      }
      return root.map(function (v) {
        var id = v.id || v.vid || '';
        var detailUrl = baseUrl + '?id=' + encodeURIComponent(id);
        return {
          url: detailUrl,
          sd_url: '',
          fhd_url: '',
          poster: v.image || '',
          user: v.nickname || v.username || '',
          text: v.title || '',
          likes: Number(v.upnum) || 0,
          comments: Number(v.commentcount) || 0,
          favorites: 0,
          tags: []
        };
      });
    };
  }

  // ========== 源注册 ==========

  registerSource('xiangjiao', 'sexladyya',
    'http://randomapi06.sexladyya.top/shortv/xiangjiaonew.php',
    [
      { label: "推荐", value: "reqlist" },
      { label: "最新榜单", value: "topnew" },
      { label: "最近", value: "latest" },
      { label: "共享收藏夹", value: "favorite" },
      { label: "点赞", value: "topzan" },
      { label: "播放", value: "topplay" },
      { label: "评论", value: "topcomment" },
      { label: "金币", value: "topcoin" }
    ]
  );

  registerSource('ogfapnew', '海外[短视频]',
    'http://randomapi06.sexladyya.top/shortv/ogfap/ogfapnew.php',
    [
      { label: "热门", value: "feed-by-key" },
      { label: "最新", value: "new" },
      { label: "排行", value: "top" },
      { label: "共享收藏夹", value: "likes" },
      { label: "tiktok", value: "tiktokporn" },
      { label: "onlyfans", value: "onlyfans" },
      { label: "amateur", value: "amateur" },
      { label: "big-ass", value: "big-ass" },
      { label: "teen", value: "teen" },
      { label: "blowjob", value: "blowjob" },
      { label: "sexy", value: "sexy" },
      { label: "riding", value: "riding" },
      { label: "masturbation", value: "masturbation" },
      { label: "deepthroat", value: "deepthroat" },
      { label: "nonnude", value: "nonnude" }
    ]
  );

  registerSource('tiktok18new', 'Tiktok[短视频]',
    'http://randomapi06.sexladyya.top/shortv/tiktok18new.php',
    [
      { label: "热门", value: "hot" },
      { label: "首页", value: "home" },
      { label: "最新", value: "new" },
      { label: "共享收藏夹", value: "favorite" },
      { label: "推荐", value: "recommend" },
      { label: "周热", value: "hot_week" },
      { label: "精品", value: "best" },
      { label: "热搜", value: "search" },
      { label: "畅销", value: "sale" },
      { label: "随机", value: "rand" }
    ]
  );

})();
