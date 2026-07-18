// ============================================================
// 视频源模板（Template）
// 复制本文件、改文件名与下方占位内容即可新增一个源。
// 新增本地源只需把文件名追加到 sourceMarket.js 的 LOCAL_SOURCE_FILES 数组，由其在解析期注入（无需改 HTML）。
//
// ★ 架构分层
//   engine.js  = 共享引擎层（与单一源无关）：buildSourceRequest / resolveVideoUrl /
//                fetchWithProxyFallback / FeedParsers.generic / SourceHandlers / PrefetchStrategies。
//                本模板/各源文件无需关心其内部，只用它们暴露的全局即可。
//   sources/   = 各独立源文件（内置源在 sources.js，市场源在各自 .js）。单源逻辑都放各自文件，
//                sv_multi.js / engine.js 不含任何写死的具体源处理。
//
// ★ 字段速查（源配置对象 window.DEFAULT_SOURCES.push({...})）
//   fromFile : true            // 独立源文件必须带，源管理页不可编辑（仅可删除）
//   name     : "源显示名"      // 必填，唯一（游标键、日志都依赖它）
//   url      : "..."           // 初始请求地址（会被 urlTemplate 覆盖）
//   type     : "feed"          // 列表型源固定用 "feed"
//   mode     : "multi" | "single"
//   parser   : "mySource"      // 对应 FeedParsers['mySource'] 的 key
//   fetch    : { ... }         // 请求细节（见下）
//   categoryGroups: [ ... ]    // 可选，分类筛选
//   urlTemplate: "..."         // 基准地址（含 {cat}/{tag}），框架先替换分类再交给 getNextUrl
//   startPage   : 0             // 可选，{page} 首页页码（默认 1；0 索引 API 如 javtrailers 设 0，否则会跳过首页）
//   getNextUrl: function(baseCurl, cat, tag) { ... }  // 可选，翻页钩子（推荐用于游标/换端点分页）
//
// ★ fetch 常用子项
//   method      : 'GET' | 'POST'          // 默认 GET
//   headers     : { 'Key': 'Val' }        // 自定义请求头（UA/Referer/Authorization/业务校验头等）
//   body        : 'a={catType}&b={catOrderBy}&page={page}'  // POST 时必填（表单串）
//   pageKey     : 'mySrcPage'             // 顺序翻页的页码缓存 key（避免与其它源冲突）
//   randomPage  : true                    // 每次随机页码（防重复内容，无需 getNextUrl）
//   maxPage     : 903                      // 随机页码上限
//
// ★ urlTemplate / body 可用占位符
//   {page}      顺序/随机分页（引擎内置，见变体 A/B；首页由 startPage 决定，默认 1）
//   {cat}       {tag}   分类系统注入（flat 分类直接替换值；非 flat 替换为 "param=value"）
//   {cursor}    引擎仍识别：从 window._srcCursor 取值；空则移除该参数。
//               ★ 但自动捕获已移除，必须自己（解析器）写 window._srcCursor，否则永远为空。
//                 推荐改用语义更清晰的 getNextUrl() 钩子（见变体 C），不再用 {cursor} 占位符。
//   {startTime} 当前秒级时间戳（xxxfollow 等需要时间戳的 API）
//   {catType}/{catOrderBy}  POST 复合分类（屋里社）：category value 用 "type-orderby"，引擎按 '-' 拆开
//
// ★ categoryGroups 维度控制
//   flat:true     → {cat} 直接替换为 option.value（裸值）
//   bare:true     → 空值发裸 param、有值发 param=value（如 Sky Porn 的 tag 维度）
//   path:true     → 取值注入 URL 路径中的 {tag} 占位符（不进入 query 串）
//
// ★ 解析器输出（FeedParsers[key]）必须是统一卡片字段，否则卡片空白：
//   { url, sd_url, fhd_url, user, text, likes, comments, favorites, tags }
//   - url  : 视频直链（必填，可 .m3u8）
//   - user : 作者名
//   - text : 标题/描述
//   - tags : 数组
//   翻页游标：在解析器内把响应里的游标写入
//             window._srcCursor['cursor_' + <源name> + '_' + (window.__feedCat || '')]
//             （__feedCat 由框架在请求前写入，保证切分类不串游标）
// ============================================================
(function () {
  // 注意：保留此守卫，不要写成 window.FeedParsers = {} —— 否则会清空 engine.js 注册的 generic
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---------- 可选：绕防盗链（公网 m3u8 代理）----------
  // 若源站 HLS 校验 Referer/Origin 等防盗链头，不要在本页注入头（Hiker WebView 禁止头被静默忽略，
  // 原生 ;{...} 头后缀仅原生播放器生效，内联 hls.js 拿不到），而是把视频链接包一层公网代理：
  //   return window.__M3U8_PROXY__ + '?url=' + encodeURIComponent(原始m3u8);
  // 代理地址见 javtrailers.js 的 _proxy / window.__M3U8_PROXY__。

  // ========== 源配置 ==========
  // —— 变体 A：GET + 页码分页 + flat 分类（最常见，见 reddclips / p91 / javtrailers）——
  window.DEFAULT_SOURCES.push({
    fromFile: true, name: "我的源",
    url: "https://api.example.com/list?page=1&cat=for-you",
    type: "feed", mode: "multi", parser: "mySource",
    fetch: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://example.com/',
        'Accept': 'application/json, text/plain, */*'
        // 'Authorization': 'Bearer xxxx'   // 需要鉴权时加
      }
      // pageKey: 'mySrcPage', randomPage: true, maxPage: 500   // 需要随机翻页时启用
    },
    categoryGroups: [
      { label: "分类", param: "cat", flat: true, options: [
        { label: "推荐", value: "for-you" },   // 首项为默认
        { label: "最新", value: "new" },
        { label: "预告", value: "trailer" }
      ] }
    ],
    urlTemplate: "https://api.example.com/list?page={page}&cat={cat}"
  });

  // —— 变体 B：POST + 复合分类（屋里社风格，category value 用 "type-orderby"，引擎拆成 {catType}/{catOrderBy}）——
  // window.DEFAULT_SOURCES.push({
  //   fromFile: true, name: "我的源(POST)",
  //   url: "https://api.example.com/list",
  //   type: "feed", mode: "multi", parser: "mySource",
  //   fetch: {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
  //     body: 'paged={page}&type={catType}&order_by={catOrderBy}&role=all',
  //     pageKey: 'myPostSrcPage', randomPage: true, maxPage: 903
  //   },
  //   categoryGroups: [
  //     { label: "分类", param: "cat", flat: true, options: [
  //       { label: "随机推荐", value: "all-random" },
  //       { label: "最新话题", value: "all-date" },
  //       { label: "最多点赞", value: "all-up" }
  //     ] }
  //   ],
  //   urlTemplate: "https://api.example.com/list?cat={cat}"
  // });

  // —— 变体 C：响应游标分页（skyPorn / xxxtik / xfree 风格，推荐 getNextUrl 钩子）——
  // 解析器把响应游标写入 window._srcCursor，getNextUrl 读它拼出下一页完整 URL（源自管，不依赖框架兜底）。
  // 换端点分页（如 xfree 的 xbn→next）也可在此钩子里切换基础 URL，而非追加参数。
  // window.DEFAULT_SOURCES.push({
  //   fromFile: true, name: "我的源(cursor)",
  //   url: "https://api.example.com/feed?limit=12",
  //   type: "feed", mode: "multi", parser: "mySourceCursor",
  //   fetch: {},
  //   // 基准地址：框架先替换 {cat}/{tag}；游标由下方钩子追加
  //   urlTemplate: "https://api.example.com/feed?limit=12&cat={cat}",
  //   // ★ 翻页钩子：返回下一页完整 URL（无游标即首屏）
  //   //   baseCurl 已含分类；游标键须与解析器写入的键一致（'cursor_' + 源name + '_' + 分类）
  //   getNextUrl: function (baseCurl, cat, tag) {
  //     if (!window._srcCursor) window._srcCursor = {};
  //     var cur = window._srcCursor['cursor_mySource_' + (cat || '')];
  //     return cur ? baseCurl + '&cursor=' + encodeURIComponent(cur) : baseCurl;
  //   },
  //   categoryGroups: [ ... ]   // 可选
  // });

  // —— 变体 D：single 模式（单视频解析，如蓝莓/TuWei，type 多为 "feed" 或 "direct"）——
  // window.DEFAULT_SOURCES.push({
  //   fromFile: true, name: "我的源(单)",
  //   url: "https://api.example.com/video?id=123",
  //   type: "feed", mode: "single", parser: "mySourceSingle"
  // });

  // ========== 解析器（multi，变体 A/B 通用）==========
  window.FeedParsers['mySource'] = function (data) {
    var list = [];
    // 防御：兼容多种嵌套结构，按需增删分支
    if (data && data.data && Array.isArray(data.data.list)) {
      list = data.data.list;
    } else if (data && data.list && Array.isArray(data.list)) {
      list = data.list;
    } else if (Array.isArray(data)) {
      list = data;
    }
    if (!list.length) {
      console.warn('[FeedParsers.mySource] 解析结果为空');
      return [];
    }
    return list.filter(function (item) {
      return item && (item.video_url || item.url || item.play_url || item.src);  // 过滤无视频项
    }).map(function (item) {
      var vurl = item.video_url || item.url || item.play_url || item.src || '';
      // 相对路径补域名
      if (typeof vurl === 'string' && vurl && !vurl.startsWith('http')) {
        vurl = 'https://api.example.com' + vurl;
      }
      return {
        url: vurl,
        sd_url: item.sd_url || '',
        fhd_url: item.fhd_url || '',
        user: (item.creator && item.creator.username) || item.author || item.user || '',
        text: item.title || item.desc || item.description || '',
        likes: item.likes || item.like_num || 0,
        comments: item.comments || item.comment_num || 0,
        favorites: item.favorites || item.collect_num || 0,
        tags: item.tags || []
      };
    });
  };

  // ========== 解析器（变体 C：多页游标分页）==========
  // 与变体 A 解析逻辑相同，额外在解析时把响应游标写入 window._srcCursor（键与 getNextUrl 一致）
  // window.FeedParsers['mySourceCursor'] = function (data) {
  //   // 1) 捕获游标（按分类隔离，避免切分类串游标；__feedCat 由框架在请求前写入）
  //   if (data && data.cursor) {
  //     if (!window._srcCursor) window._srcCursor = {};
  //     window._srcCursor['cursor_mySource_' + (window.__feedCat || '')] = data.cursor;
  //   }
  //   // 2) 解析列表（同变体 A 的解析逻辑，按需适配字段）
  //   var list = [];
  //   if (data && data.data && Array.isArray(data.data.list)) list = data.data.list;
  //   else if (data && Array.isArray(data.list)) list = data.list;
  //   else if (Array.isArray(data)) list = data;
  //   if (!list.length) { console.warn('[FeedParsers.mySourceCursor] 解析为空'); return []; }
  //   return list.filter(function (item) {
  //     return item && (item.video_url || item.url || item.play_url || item.src);
  //   }).map(function (item) {
  //     var vurl = item.video_url || item.url || item.play_url || item.src || '';
  //     if (typeof vurl === 'string' && vurl && !vurl.startsWith('http')) vurl = 'https://api.example.com' + vurl;
  //     return { url: vurl, user: item.author || '', text: item.title || '', tags: item.tags || [] };
  //   });
  // };

  // ========== 解析器（single，仅变体 D 启用）==========
  // window.FeedParsers['mySourceSingle'] = function (data) {
  //   // 单视频源：返回单个卡片对象（统一字段）或 [{...}]
  //   var item = (data && data.data) ? data.data : data;
  //   var vurl = item.video_url || item.url || item.play_url || '';
  //   if (typeof vurl === 'string' && vurl && !vurl.startsWith('http')) {
  //     vurl = 'https://api.example.com' + vurl;
  //   }
  //   return [{
  //     url: vurl,
  //     sd_url: '', fhd_url: '',
  //     user: item.author || '',
  //     text: item.title || '',
  //     likes: 0, comments: 0, favorites: 0, tags: []
  //   }];
  // };
})();
