// ============================================================
// 源：xxxfollow🪜
// 源配置 + 数据解析器（独立文件）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// 维度：分类(genders) × 标签(path 维度)；无标签走 user/public，带标签走 post/tag
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true,    name: "xxxfollow🪜",
    url: "https://www.xxxfollow.com/api/v1/user/public?{cat}&tags=1&force_variant=&route_prefix=&limit=25&page={page}&start_time={startTime}",
    type: "feed", mode: "multi", parser: "xxxfollow",
    fetch: {
      pageKey: 'xxxfollowPage'
    },
    categoryGroups: [
      { label: "分类", param: "genders", options: [
        { label: "情侣和女性", value: "cf" },
        { label: "跨性别", value: "tg" },
        { label: "男性", value: "m" }
      ]},
      { label: "标签", param: "tag", path: true, options: [
        { label: "无标签", value: "" },
        { label: "性感", value: "sexy" },{ label: "内射", value: "creampie" },{ label: "亚洲热血", value: "asianhotties" },
		{ label: "x小女孩", value: "xsmallgirls" },{ label: "湿猫咪", value: "wetpussy" },{ label: "紧握的嘴唇", value: "lipsthatgrip" },
		{ label: "OnlyFans", value: "onlyfans" },{ label: "anal", value: "anal" },{ label: "18岁", value: "18yearsold" },
		{ label: "快速手淫", value: "fastfap" },{ label: "teen18+", value: "teen-18" },{ label: "狂野", value: "gonewild" },
		{ label: "抖音", value: "tiktok" },{ label: "真实女孩", value: "realgirls" },{ label: "阴部", value: "pussy" },
		{ label: "精液", value: "cumsluts" },{ label: "手淫", value: "masturbation" },{ label: "色情", value: "porn" },
		{ label: "大学", value: "collegesluts" },{ label: "女孩们完成任务", value: "girlsfinishingthejob" },{ label: "大胸", value: "bigtits" },
		{ label: "熟女", value: "milf" },{ label: "小野岛", value: "petitegonewild" },{ label: "女学生", value: "schoolgirl" },
		{ label: "orgasm", value: "高潮" },{ label: "荡妇", value: "slut" },{ label: "女同", value: "lesbian" },
		{ label: "onlyfans", value: "onlyfans" },{ label: "贪求的荡妇", value: "needysluts" },{ label: "阴道", value: "pussyplay" },
		{ label: "可爱色情", value: "adorableporn" },{ label: "口交", value: "blowjob" },{ label: "紧咬的嘴唇", value: "lipsthatgrip" }
      ] }
    ],
    catBase: "",
    urlTemplate: "https://www.xxxfollow.com/api/v1/post/tag/{tag}?{cat}&period=featured&limit=24&page={page}&start_time={startTime}"
  });

  // ---- 解析器（xxxfollow 格式：list 数组，post.media 嵌套）----
  window.FeedParsers['xxxfollow'] = function (data) {
    var list = [];
    if (data.list && Array.isArray(data.list)) list = data.list;
    else if (data.posts && Array.isArray(data.posts)) list = data.posts;
    else if (data.data && Array.isArray(data.data)) list = data.data;
    else if (Array.isArray(data)) list = data;
    return list.filter(function (item) {
      var post = item.post || item;
      return post && post.media && post.media[0] && post.media[0].url;
    }).map(function (item) {
      var post = item.post || item;
      var media = post.media[0];
      var vurl = media.fhd_url || media.url || media.sd_url || '';
      // 提取标签：从 [{tag: "milf"}, {tag: "curvy"}] 中提取
      var tags = [];
      if (post.tags && Array.isArray(post.tags)) {
        for (var i = 0; i < post.tags.length; i++) {
          if (post.tags[i].tag) tags.push(post.tags[i].tag);
        }
      }
      var author = post.user || item.user || {};
      return {
        url: vurl,
        sd_url: media.sd_url || '',
        fhd_url: media.fhd_url || '',
        user: (author.display_name || author.username) || '',
        text: post.text || item.text || '',
        likes: item.like_count || post.like_count || 0,
        comments: item.comment_count || post.comment_count || 0,
        favorites: item.favorite_count || post.favorite_count || 0,
        tags: tags
      };
    });
  };
})();
