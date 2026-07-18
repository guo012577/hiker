// ============================================================
// 源：xxxtik
// 源配置 + 数据解析器（独立文件）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true,    name: "xxxtik",
    url: "https://xxxtik-api-iw98m.ondigitalocean.app/post/new?limit=21&cursor={cursor}",
    type: "feed", mode: "multi", parser: "xxxtik",
    fetch: {},
    categoryGroups: [
      { label: "分类", param: "cat", flat: true, options: [
        { label: "最新", value: "new" },
        { label: "年度排行", value: "top/year" },
        {label: "#18岁",value: "tag/18-years-old"},
  {
    label: "#阿贝拉·丹格",
    value: "tag/abella-danger"
  },
  {
    label: "#另类",
    value: "tag/alt"
  },
  {
    label: "#业余",
    value: "tag/amateur"
  },
  {
    label: "#肛交",
    value: "tag/anal"
  },
  {
    label: "#肛门内射",
    value: "tag/anal-creampie"
  },
  {
    label: "#肛玩",
    value: "tag/anal-play"
  },
  {
    label: "#安吉拉·怀特",
    value: "tag/angela-white"
  },
  {
    label: "#动画",
    value: "tag/animation"
  },
  {
    label: "#亚洲",
    value: "tag/asian"
  },
  {
    label: "#屁股",
    value: "tag/ass"
  },
  {
    label: "#拍臀",
    value: "tag/ass-clapping"
  },
  {
    label: "#掰臀",
    value: "tag/ass-spread"
  },
  {
    label: "#屁眼",
    value: "tag/asshole"
  },
  {
    label: "#宝贝",
    value: "tag/babe"
  },
  {
    label: "#后入",
    value: "tag/backshots"
  },
  {
    label: "#深插",
    value: "tag/balls-deep"
  },
  {
    label: "#大黑屌",
    value: "tag/bbc"
  },
  {
    label: "#大黑屌荡妇",
    value: "tag/bbc-slut"
  },
  {
    label: "#胖美女",
    value: "tag/bbw"
  },
  {
    label: "#大屁股",
    value: "tag/big-ass"
  },
  {
    label: "#大鸡巴",
    value: "tag/big-dick"
  },
  {
    label: "#大奶",
    value: "tag/big-tits"
  },
  {
    label: "#黑人",
    value: "tag/black"
  },
  {
    label: "#黑女白屌",
    value: "tag/blackchickswhitedicks"
  },
  {
    label: "#黑人内射",
    value: "tag/blacked"
  },
  {
    label: "#金发",
    value: "tag/blonde"
  },
  {
    label: "#口交",
    value: "tag/blowjob"
  },
  {
    label: "#口交女",
    value: "tag/blowjobgirls"
  },
  {
    label: "#奶子",
    value: "tag/boobs"
  },
  {
    label: "#翘臀",
    value: "tag/booty"
  },
  {
    label: "#弹跳",
    value: "tag/bouncing"
  },
  {
    label: "#弹跳巨乳",
    value: "tag/bouncing-tits"
  },
  {
    label: "#播种",
    value: "tag/breeding"
  },
  {
    label: "#棕发",
    value: "tag/brunette"
  },
  {
    label: "#蜜桃臀",
    value: "tag/bubble-butt"
  },
  {
    label: "#巨乳",
    value: "tag/busty"
  },
  {
    label: "#大白屌",
    value: "tag/bwc"
  },
  {
    label: "#配文",
    value: "tag/caption"
  },
  {
    label: "#车",
    value: "tag/car"
  },
  {
    label: "#车震",
    value: "tag/car-sex"
  },
  {
    label: "#名人",
    value: "tag/celebrity"
  },
  {
    label: "#出轨",
    value: "tag/cheat"
  },
  {
    label: "#出轨",
    value: "tag/cheating"
  },
  {
    label: "#出轨配文",
    value: "tag/cheatingcaptions"
  },
  {
    label: "#掐脖",
    value: "tag/choking"
  },
  {
    label: "#拍屁股",
    value: "tag/clappingdemcheeks"
  },
  {
    label: "#鸡巴",
    value: "tag/cock"
  },
  {
    label: "#鸡巴崇拜",
    value: "tag/cock-worship"
  },
  {
    label: "#大学",
    value: "tag/college"
  },
  {
    label: "#角色扮演",
    value: "tag/cosplay"
  },
  {
    label: "#情侣",
    value: "tag/couple"
  },
  {
    label: "#女上位",
    value: "tag/cowgirl"
  },
  {
    label: "#内射",
    value: "tag/creampie"
  },
  {
    label: "#奶油",
    value: "tag/creamy"
  },
  {
    label: "#绿帽",
    value: "tag/cuckold"
  },
  {
    label: "#精液",
    value: "tag/cum"
  },
  {
    label: "#口爆",
    value: "tag/cum-in-mouth"
  },
  {
    label: "#射在屁股上",
    value: "tag/cum-on-ass"
  },
  {
    label: "#射在奶上",
    value: "tag/cum-on-tits"
  },
  {
    label: "#吞精",
    value: "tag/cum-swallow"
  },
  {
    label: "#射精",
    value: "tag/cumshot"
  },
  {
    label: "#精液荡妇",
    value: "tag/cumslut"
  },
  {
    label: "#曲线身材",
    value: "tag/curvy"
  },
  {
    label: "#可爱",
    value: "tag/cute"
  },
  {
    label: "#深插",
    value: "tag/deep-penetration"
  },
  {
    label: "#深肛",
    value: "tag/deepanal"
  },
  {
    label: "#深喉",
    value: "tag/deepthroat"
  },
  {
    label: "#假阳具",
    value: "tag/dildo"
  },
  {
    label: "#脏话",
    value: "tag/dirty-talk"
  },
  {
    label: "#dlhoodninja",
    value: "tag/dlhoodninja"
  },
  {
    label: "#狗爬式",
    value: "tag/doggy-style"
  },
  {
    label: "#后入式",
    value: "tag/doggystyle"
  },
  {
    label: "#双重口交",
    value: "tag/double-blowjob"
  },
  {
    label: "#双重插入",
    value: "tag/double-penetration"
  },
  {
    label: "#黑妹",
    value: "tag/ebony"
  },
  {
    label: "#黑妹翘臀",
    value: "tag/ebony-butts"
  },
  {
    label: "#黑人情侣",
    value: "tag/ebony-couple"
  },
  {
    label: "#眼神交流",
    value: "tag/eye-contact"
  },
  {
    label: "#扇脸",
    value: "tag/face-fuck"
  },
  {
    label: "#颜射",
    value: "tag/facial"
  },
  {
    label: "#伪娘少年",
    value: "tag/femboy"
  },
  {
    label: "#女尊",
    value: "tag/femdom"
  },
  {
    label: "#两女一男",
    value: "tag/ffm"
  },
  {
    label: "#指交",
    value: "tag/fingering"
  },
  {
    label: "#强迫",
    value: "tag/forced"
  },
  {
    label: "#随意享用",
    value: "tag/freeuse"
  },
  {
    label: "#法式热吻",
    value: "tag/french-kissing"
  },
  {
    label: "#盖比·卡特",
    value: "tag/gabbie-carter"
  },
  {
    label: "#群交",
    value: "tag/gangbang"
  },
  {
    label: "#女友",
    value: "tag/girlfriend"
  },
  {
    label: "#眼镜",
    value: "tag/glasses"
  },
  {
    label: "#哥特",
    value: "tag/goth"
  },
  {
    label: "#扯发",
    value: "tag/hair-pulling"
  },
  {
    label: "#手交",
    value: "tag/handjob"
  },
  {
    label: "#重口",
    value: "tag/hardcore"
  },
  {
    label: "#本子视频",
    value: "tag/hentaivideos"
  },
  {
    label: "#自拍",
    value: "tag/homemade"
  },
  {
    label: "#共享妻",
    value: "tag/hotwife"
  },
  {
    label: "#巨臀",
    value: "tag/huge-ass"
  },
  {
    label: "#巨型假阳具",
    value: "tag/huge-dildo"
  },
  {
    label: "#大量射精",
    value: "tag/huge-load"
  },
  {
    label: "#巨乳",
    value: "tag/huge-tits"
  },
  {
    label: "#跨种族",
    value: "tag/interracial"
  },
  {
    label: "#日本",
    value: "tag/japanese"
  },
  {
    label: "#日本AV",
    value: "tag/jav"
  },
  {
    label: "#晃动",
    value: "tag/jiggle"
  },
  {
    label: "#晃操",
    value: "tag/jigglefuck"
  },
  {
    label: "#被晃操",
    value: "tag/jigglefucked"
  },
  {
    label: "#抖动",
    value: "tag/jiggling"
  },
  {
    label: "#射精到此",
    value: "tag/jizzedtothis"
  },
  {
    label: "#亲吻",
    value: "tag/kiss"
  },
  {
    label: "#接吻",
    value: "tag/kissing"
  },
  {
    label: "#拉丁",
    value: "tag/latina"
  },
  {
    label: "#莉娜·保罗",
    value: "tag/lena-paul"
  },
  {
    label: "#女同",
    value: "tag/lesbian"
  },
  {
    label: "#女同性恋",
    value: "tag/lesbians"
  },
  {
    label: "#内衣",
    value: "tag/lingerie"
  },
  {
    label: "#长片",
    value: "tag/longporn"
  },
  {
    label: "#自慰",
    value: "tag/masturbating"
  },
  {
    label: "#熟女",
    value: "tag/milf"
  },
  {
    label: "#传教士式",
    value: "tag/missionary"
  },
  {
    label: "#呻吟",
    value: "tag/moaning"
  },
  {
    label: "#巨屌",
    value: "tag/monster-cock"
  },
  {
    label: "#天然奶",
    value: "tag/natural-tits"
  },
  {
    label: "#限制级",
    value: "tag/nsfw"
  },
  {
    label: "#涂油",
    value: "tag/oiled"
  },
  {
    label: "#OnlyFans",
    value: "tag/onlyfans"
  },
  {
    label: "#口交",
    value: "tag/oral"
  },
  {
    label: "#高潮",
    value: "tag/orgasm"
  },
  {
    label: "#户外",
    value: "tag/outdoor"
  },
  {
    label: "#翘臀白妹",
    value: "tag/pawg"
  },
  {
    label: "#娇小",
    value: "tag/petite"
  },
  {
    label: "#肥臀",
    value: "tag/phat-ass"
  },
  {
    label: "#猛干镜头",
    value: "tag/plowcam"
  },
  {
    label: "#色情",
    value: "tag/porn"
  },
  {
    label: "#色情明星",
    value: "tag/pornstar"
  },
  {
    label: "#猛操",
    value: "tag/pounding"
  },
  {
    label: "#第一视角",
    value: "tag/pov"
  },
  {
    label: "#俯卧操",
    value: "tag/pronebone"
  },
  {
    label: "#公共",
    value: "tag/public"
  },
  {
    label: "#小穴",
    value: "tag/pussy"
  },
  {
    label: "#舔穴",
    value: "tag/pussy-eating"
  },
  {
    label: "#舔逼",
    value: "tag/pussy-licking"
  },
  {
    label: "#阴唇",
    value: "tag/pussy-lips"
  },
  {
    label: "#掰穴",
    value: "tag/pussy-spread"
  },
  {
    label: "#亚裔狂野",
    value: "tag/rasiansgonewild"
  },
  {
    label: "#真实情侣",
    value: "tag/real-couple"
  },
  {
    label: "#红发",
    value: "tag/redhead"
  },
  {
    label: "#红发动图",
    value: "tag/redheadgifs"
  },
  {
    label: "#反女上位",
    value: "tag/reverse-cowgirl"
  },
  {
    label: "#骑乘",
    value: "tag/riding"
  },
  {
    label: "#紧夹阴唇",
    value: "tag/rlipsthatgrip"
  },
  {
    label: "#粗暴",
    value: "tag/rough"
  },
  {
    label: "#R34",
    value: "tag/rule34"
  },
  {
    label: "#性爱",
    value: "tag/sex"
  },
  {
    label: "#性感",
    value: "tag/sexy"
  },
  {
    label: "#剃毛穴",
    value: "tag/shaved-pussy"
  },
  {
    label: "#她操他",
    value: "tag/shefuckshim"
  },
  {
    label: "#淋浴",
    value: "tag/shower"
  },
  {
    label: "#伪娘",
    value: "tag/sissy"
  },
  {
    label: "#骨感",
    value: "tag/skinny"
  },
  {
    label: "#纤细丰腴",
    value: "tag/slimthick"
  },
  {
    label: "#混乱口交",
    value: "tag/sloppy"
  },
  {
    label: "#荡妇",
    value: "tag/slut"
  },
  {
    label: "#小奶",
    value: "tag/small-tits"
  },
  {
    label: "#单人",
    value: "tag/solo"
  },
  {
    label: "#唾液",
    value: "tag/spit"
  },
  {
    label: "#潮吹",
    value: "tag/squirt"
  },
  {
    label: "#喷潮",
    value: "tag/squirting"
  },
  {
    label: "#站立后入",
    value: "tag/standing-doggy"
  },
  {
    label: "#继妹",
    value: "tag/step-sister"
  },
  {
    label: "#吮吸",
    value: "tag/sucking"
  },
  {
    label: "#换妻",
    value: "tag/swingers"
  },
  {
    label: "#纹身",
    value: "tag/tattoo"
  },
  {
    label: "#挑逗",
    value: "tag/tease"
  },
  {
    label: "#少女",
    value: "tag/teen"
  },
  {
    label: "#少女们",
    value: "tag/teens"
  },
  {
    label: "#丰满",
    value: "tag/thick"
  },
  {
    label: "#粗屌",
    value: "tag/thick-cock"
  },
  {
    label: "#三人行",
    value: "tag/threesome"
  },
  {
    label: "#喉咙",
    value: "tag/throat"
  },
  {
    label: "#插喉",
    value: "tag/throat-fuck"
  },
  {
    label: "#深喉",
    value: "tag/throated"
  },
  {
    label: "#紧穴",
    value: "tag/tight-pussy"
  },
  {
    label: "#抖音",
    value: "tag/tiktok"
  },
  {
    label: "#乳交",
    value: "tag/tit-fuck"
  },
  {
    label: "#乳交",
    value: "tag/titfuck"
  },
  {
    label: "#奶子",
    value: "tag/tits"
  },
  {
    label: "#抖奶",
    value: "tag/titty-drop"
  },
  {
    label: "#乳交",
    value: "tag/titty-fuck"
  },
  {
    label: "#跨性别",
    value: "tag/trans"
  },
  {
    label: "#跨性别女孩",
    value: "tag/trans-girls"
  },
  {
    label: "#跨性别女",
    value: "tag/trans-woman"
  },
  {
    label: "#跨性别",
    value: "tag/transgender"
  },
  {
    label: "#电臀舞",
    value: "tag/twerking"
  },
  {
    label: "#湿穴",
    value: "tag/wet-pussy"
  },
  {
    label: "#白妹",
    value: "tag/white-girl"
  },
  {
    label: "#妻子",
    value: "tag/wife"
  },
  {
    label: "#白男亚女",
    value: "tag/wmaf"
  }
      ]}
    ],
    urlTemplate: "https://xxxtik-api-iw98m.ondigitalocean.app/post/{cat}?limit=21&cursor={cursor}"
  });

  // ---- 解析器（xxxtik 格式：posts 数组，优先用 uid 构造 p5rn CDN 链接）----
  window.FeedParsers['xxxtik'] = function (data) {
    var posts = [];
    if (Array.isArray(data)) {
      posts = data;
    } else if (data && data.data && Array.isArray(data.data.posts)) {
      posts = data.data.posts;
    }
    if (!posts.length) {
      console.warn('[FeedParsers.xxxtik] posts 为空');
      return [];
    }
    return posts.map(function (item) {
      if (!item) return null;
      // 优先用 uid 构造视频链接
      var vurl = '';
      if (item.uid) {
        vurl = 'https://p5rn.com/cdn/production/media/0312/' + item.uid + '/master.m3u8';
      } else {
        vurl = item.redGifsVideoUrl || item.source || '';
      }
      if (!vurl) return null;
      return {
        url: vurl,
        sd_url: '',
        fhd_url: '',
        user: (item.author && item.author.name) || '',
        text: item.description || '',
        likes: item.likes || 0,
        comments: 0,
        favorites: 0,
        tags: (item.tags || []).map(function (t) { return t.name; }),
        _rawId: item.id
      };
    }).filter(Boolean);
  };
})();
