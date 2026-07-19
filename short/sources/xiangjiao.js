// ============================================================
// sexladyya（性恋）源
// 列表接口仅返回元数据 + 缩略图，真实可播放视频地址需二次请求 ?id=<id> 详情。
// 为此本源把卡片 url 设为「详情接口地址」作为懒解析标记，
// 真正取直链的逻辑放在 engine.js 的 resolveVideoUrl（sexladyya 分支），播放前才请求，避免一次性 N 次拉取。
// 注册：把本文件名追加到 sourceMarket.js 的 LOCAL_SOURCE_FILES。
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  var SEX_BASE = 'http://randomapi06.sexladyya.top/shortv/xiangjiaonew.php';

  // ========== 源配置 ==========
  // GET + 页码分页；该 API 为 0 索引（page=0 才是首页），故 startPage:0
  window.DEFAULT_SOURCES.push({
    fromFile: true,
    name: "xiangjiao",
    url: SEX_BASE + '?sort=reqlist&page=0',
    type: "feed",
    mode: "multi",
    parser: "xiangjiao",
    startPage: 0,
    catBase: '',
    categoryGroups: [
      { label: "分类", param: "sort", flat: true, options: [
        { label: "推荐", value: "reqlist" },
        { label: "最新榜单", value: "topnew" },
        { label: "最近", value: "latest" },
        { label: "共享收藏夹", value: "favorite" },
        { label: "点赞", value: "topzan" },
        { label: "播放", value: "topplay" },
        { label: "评论", value: "topcomment" },
        { label: "金币", value: "topcoin" }
      ]}
    ],
    fetch: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'http://randomapi06.sexladyya.top/'
      }
    },
    urlTemplate: SEX_BASE + '?sort={cat}&page={page}'
  });

  // ========== 解析器 ==========
  // 入参 data 结构：{ videos: [ { id, vid, title, image, nickname, username, upnum, commentcount, playcount, ... } ] }
  // 仅做字段映射；视频直链交给 resolveVideoUrl 二次请求 ?id= 详情。
  window.FeedParsers['xiangjiao'] = function (data) {
    var root = (data && data.videos) ? data.videos : (Array.isArray(data) ? data : []);
    if (!root.length) {
      console.warn('[FeedParsers.xiangjiao] videos 为空');
      return [];
    }
    return root.map(function (v) {
      var id = v.id || v.vid || '';
      // url 填「详情接口」作为懒解析标记；engine.resolveVideoUrl 会二次请求取真实 .video 直链
      var detailUrl = SEX_BASE + '?id=' + encodeURIComponent(id);
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
})();
