// ============================================================
// 源：Sky Porn
// 源配置 + 数据解析器（独立文件）
// 由 index_multi.html 在 sources.js 之后、sv_multi.js 之前引入
// 维度：分类(niche) × 标签(tag) × 排序(sort)，正交筛选
// ============================================================
(function () {
  if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
  if (!window.FeedParsers) window.FeedParsers = {};

  // ---- 源配置 ----
  window.DEFAULT_SOURCES.push({
    fromFile: true,    name: "Sky Porn",
    url: "https://sky.porn/api/feed?niche&tag&type=video&sort=trending&limit=12&cursor={cursor}",
    type: "feed", mode: "multi", parser: "skyPorn",
    fetch: {},
    categoryGroups: [
      { label: "分类", param: "niche", options: [
        { label: "全部", value: "" },
        {label: "🏀弹跳的胸部",value: "bouncing-boobs"},{label: "📖为了剧情而看",value: "watch-it-for-the-plot"},{label: "🧟边缘控制 / Goon", value: "goon"},
{label: "🤑OnlyFans创作者",value: "onlyfans-creators"},{ label: "🍒只有胸部", value: "just-boobs"},{ label: "😮口交", value: "blowjobs"},{ label: "🍸骚浪熟女", value: "slutty-milfs"},
{ label: "🍷30岁以上熟女", value: "milfs-over-30"},{ label: "🥤精液荡妇", value: "cumslut"},{ label: "💃拉丁女郎", value: "latinas"},{ label: "🎯颜射高潮", value: "money-shots"},
{ label: "🧴颜射", value: "facials"},{ label: "🍉大胸部", value: "big-tits"},{ label: "🧚娇小女孩", value: "petite-chicks"},{ label: "⛓️真实BDSM", value: "real-bdsm"},
{ label: "🥧中出", value: "creampies"},{ label: "👙性感内衣", value: "sexy-lingerie"},{ label: "🏠伪乱伦", value: "fauxcest"},{ label: "💦女孩完成工作", value: "girls-finishing-the-job"},
{ label: "📹业余女孩", value: "amateur-girls"},{ label: "🦍大黑屌", value: "big-black-dicks"},{ label: "♠️黑化 / Blacked", value: "blacked"},{ label: "👱‍♀️金发女郎", value: "fair-haired"},
{ label: "🔛开关 / On/Off", value: "on-off"},{ label: "⭐色情明星", value: "pornstars"},{ label: "🔓自由使用幻想", value: "freeuse-fantasy"},{ label: "🤠女上男", value: "she-fucks-him"},
{ label: "🤠骑乘位", value: "riding-dick"},{ label: "💅金发荡妇 / 傻白甜", value: "bimbos"},{ label: "🥥大胸金发荡妇", value: "big-titty-bimbos"},{ label: "🎆群交派对", value: "group-sex-parties"},
{ label: "💍热妻生活方式", value: "hotwife-lifestyle"},{ label: "🔥红发女郎", value: "redheads"},{ label: "🥢瘦女孩", value: "skinny-girls"},{ label: "3️⃣3P", value: "3somes"},
{ label: "💎坚硬鸡巴", value: "hard-cocks"},{ label: "✂️女同", value: "girl-on-girl"},{ label: "🔄男人被 pegging", value: "guys-getting-pegged"},{ label: "🏠自制 / 家庭自拍", value: "homemade"},
{ label: "👣足控", value: "feet"},{ label: "🐉纹身辣妹", value: "hot-girls-with-tattoos"},{ label: "🍦大白鸡巴 (BWC)", value: "bwc-big-white-cock"},{ label: "🛋️大屁股", value: "big-asses"},
{ label: "🦹‍♀️NSFW Cosplay", value: "nsfw-cosplay"},{ label: "👤独奏 / Solo", value: "solo"},{ label: "⚰️哥特女孩", value: "goth-girls"},{ label: "🌶️辣味内容", value: "spicy-content"},
{ label: "🥄口爆", value: "cumshot-in-mouth"},{ label: "😋精液爱好者", value: "cum-lovers"},{ label: "🌍多种族", value: "multiracial"},{ label: "😈真实挑逗", value: "real-tease"},
{ label: "⌛曲线女孩", value: "curvy-chicks"},{ label: "👋手交", value: "handjobs"},{ label: "🧣深喉", value: "throated"},{ label: "🎎韩漫", value: "hanime"},{ label: "🦒喉咙性交", value: "throat-fucking"},
{ label: "🥴真实高潮", value: "real-orgasms"},{ label: "🤰繁殖 / 播种", value: "breeding"},{ label: "🎧女主播", value: "streamer-girls"},{ label: "👙比基尼", value: "bikinis"},
{ label: "👾电子女孩 / E-Girls", value: "e-girls"},{ label: "🦵穿丝袜", value: "wearing-stockings"},{ label: "🐆饥渴熟女", value: "horny-cougars"},{ label: "🐱只有小穴", value: "just-pussy"},
{ label: "⚡强制高潮", value: "forced-orgasms"},{ label: "🥒自慰", value: "masturbation"},{ label: "🚿女孩洗澡", value: "girls-showering"},{ label: "🍛印度美女", value: "indian-babes"},
{ label: "💆‍♀️女性自慰", value: "jilling"},{ label: "🏞️公共暴露", value: "exposed-in-public"},{ label: "🌺大阴唇", value: "big-pussy-lips"},{ label: "🕳️张开的屁股", value: "gaping-ass"},
{ label: "🍫黑人女孩", value: "ebony-girls"},{ label: "⛲潮吹", value: "squirters"},{ label: "🛐乞求", value: "begging"},{ label: "🥛白人肥臀女孩", value: "phat-ass-white-girls"},
{ label: "🐕四肢着地", value: "on-all-fours"},{ label: "💢粗暴性爱", value: "rough-sex"},{ label: "🎸另类女孩", value: "alt-girls"},{ label: "🎮女孩玩耍", value: "girls-playing"},
{ label: "💼工作中", value: "at-work"},{ label: "🤓戴眼镜女孩", value: "girls-with-glasses"},{ label: "💔出轨", value: "cheating"},{ label: "🍑厚臀", value: "thick-booty"},
{ label: "🛑边缘控制", value: "edging"},{ label: "🤳自拍", value: "selfies"},{ label: "👯‍♀️群交", value: "group-fucking"},{ label: "🪒剃毛阴部", value: "shaved-pussies"},
{ label: "👫真实情侣", value: "real-couples"},{ label: "🤐面部性交", value: "face-fucking"},{ label: "💪健身女孩", value: "fit-girls"},{ label: "📹摄像头女孩", value: "cam-girls"},
{ label: "🧸俏皮", value: "playful"},{ label: "🧵丁字裤", value: "thongs"},{ label: "🎬色情预告", value: "porn-previews"},{ label: "🐃被绿", value: "cucked"},
{ label: "🤘绿帽玩法", value: "cuckolding"},{ label: "🍆巨屌", value: "massive-cock"},{ label: "🐌阴部爱液", value: "pussy-grool"},{ label: "🧴涂油", value: "oiled"},
{ label: "🍑从后面看小穴", value: "pussy-from-behind"},{ label: "🚿全身精液", value: "covered-in-cum"},{ label: "👗更衣室", value: "changing-rooms"},{ label: "🔋性玩具", value: "sex-toys"},
{ label: "🌮紧致阴唇", value: "lips-that-grip"},{ label: "🧎BDSM羞辱", value: "bdsm-humiliation"},{ label: "🚽放尿", value: "peeing"},{ label: "💇‍♀️短发女孩", value: "short-hair-chicks"},
{ label: "🌍欧洲美女", value: "european-babes"},{ label: "⏳丰满瘦女孩", value: "slim-thick-baddies"},{ label: "🎱泡泡臀", value: "bubble-butt"},{ label: "🧸微胖女孩", value: "chubby-girls"},
{ label: "🏺丰满BBW", value: "voluptuous-bbw"},{ label: "💸金钱支配", value: "findom"},{ label: "🐻多毛", value: "hairy"},{ label: "🏡邻家女孩", value: "girls-next-door"},
{ label: "👗服装秀！", value: "outfits"},{ label: "💄女性化/娘炮字幕", value: "sissy-captions"},{ label: "🌳多毛女孩", value: "hairy-girls"},{ label: "👻白皙女孩", value: "pale-girls"},
{ label: "🍩肛交", value: "anal-sex"},{ label: "🥺可爱色情", value: "adorable-porn"},{ label: "🍋小胸部", value: "tiny-tits"},{ label: "🖤乳胶", value: "latex"},
{ label: "🚨闪胸", value: "flashing-boobs"},{ label: "🔌肛塞", value: "plugged"},{ label: "🤰孕妇色情", value: "pregnant-porn"},{ label: "📢尖叫宝贝", value: "squealing-babes"},
{ label: "🎬名人", value: "celebs"},{ label: "🤖性爱机器", value: "fucking-machines"},{ label: "🥪双屌一女", value: "2dicks1chick"},{ label: "👏拍臀", value: "ass-clap"},
{ label: "🥞大乳晕", value: "big-areolas"},{ label: "📱TikTok", value: "tik-tok"},{ label: "👠跨性别/娘炮色情", value: "trans-sissy-porn"},{ label: "🚿水上运动爱好者", value: "watersports-lovers"},
{ label: "🍑抖臀", value: "twerk"},{ label: "💃跳舞", value: "dancing"},{ label: "🤪面部表情", value: "facial-expressions"},{ label: "🍮抖动性交", value: "jigglefuck"},
{ label: "🥒肛门假阳具", value: "anal-dildo"},{ label: "🌈同性恋骚货", value: "gay-slut"},{ label: "🌊巨大射精", value: "huge-cumshots"},{ label: "👅舔屁股", value: "ass-licking"},
{ label: "👗掀裙挑逗", value: "upskirt-tease"},{ label: "🎀伪娘", value: "femboys"},{ label: "🙏臀部崇拜", value: "ass-worship"},{ label: "🧁小乳头", value: "puffies"},
{ label: "🏾有色人种女性", value: "women-of-color"},{ label: "👑肛交女王", value: "anal-queens"},{ label: "🔍特写", value: "close-up"},{ label: "🦸‍♀️西方同人H", value: "western-hentai"},
{ label: "🧥透明服装", value: "transparent-clothing"},{ label: "👠致命女人", value: "femme-fatales"},{ label: "🙇女性支配羞辱", value: "femdom-humiliation"},{ label: "🗣️你好大", value: "youre-so-big"},
{ label: "📼复古色情", value: "vintage-porn"},{ label: "👠高跟鞋", value: "high-heels"},{ label: "🐾毛绒/服装", value: "furry-costume"},{ label: "💬字幕", value: "captions"},
{ label: "🍷四十五五十五", value: "forty-five-fifty-five"},{ label: "🍡可爱屁股", value: "cute-butts"},{ label: "🏳️‍⚧️跨性别女性", value: "trans-women"},{ label: "⏱️60秒色情", value: "porn-in-60-seconds"},
{ label: "👏拍胸", value: "clapping-boobs"},{ label: "🤸‍♀️双腿张开", value: "legs-spread"},{ label: "🦶足部天堂", value: "feet-heaven"},{ label: "🛡️贞操锁", value: "chastity"},
{ label: "🪑面骑", value: "face-riding"},{ label: "💍业余妻子", value: "amateur-wives"},{ label: "🎈假胸", value: "fake-boobs"},{ label: "🇯🇵日本NSFW", value: "japanese-nsfw"},
{ label: "🩲内裤", value: "undies"},{ label: "🌈霓虹发女孩", value: "girls-with-neon-hair"},{ label: "♠️BBC骚货", value: "bbc-slut"},{ label: "🧘‍♀️穿瑜伽裤女孩", value: "girls-in-yoga-pants"},
{ label: "🥥天然胸部", value: "natural-tits"},{ label: "🐆成熟且调皮", value: "mature-and-naughty"},{ label: "🥞性感橘皮", value: "sexy-cellulite"},{ label: "🔞合法少女", value: "legal-teens"},
{ label: "🧘‍♀️女性自慰", value: "female-masturbation"},{ label: "🍌真实鸡巴", value: "real-cock"},{ label: "🍼哺乳", value: "lactation"},{ label: "💣巨乳娇小", value: "busty-petite"},
{ label: "⭕紧致菊花", value: "tight-assholes"},{ label: "🚛大量射精", value: "big-loads"},{ label: "💎美丽女人与美丽小穴", value: "beautiful-pussy"},{ label: "🍈天然大胸", value: "natural-big-tits"},
{ label: "📸业余模特", value: "amateur-models"},{ label: "😶素颜", value: "bare-face"},{ label: "🌭脚与鸡巴", value: "feet-and-cock"},{ label: "🚀巨型假阳具", value: "giant-dildos"},
{ label: "🩷双性恋", value: "bisexual"},{ label: "🛌俯卧后入", value: "prone-boning"},{ label: "👚胸部掉落", value: "tittydrop"},{ label: "🇮🇳印度人", value: "desi"},
{ label: "🌮墨西哥女孩", value: "mexican-girls"},{ label: "💋女孩接吻", value: "girls-kissing"},{ label: "🤤让人流口水的鸡巴", value: "mouth-watering-cocks"},{ label: "😖插入瞬间", value: "when-it-goes-in"},
{ label: "🍆扶她", value: "futa"},{ label: "🚜犁式性交", value: "plow-fucking"},{ label: "👐掰开小穴", value: "pussy-spreading"},{ label: "⏳年龄差", value: "age-gap"},
{ label: "🎌JAV（日本成人视频）", value: "jav"},{ label: "🏳️‍⚧️美丽跨性别女性", value: "beautiful-transwomen"},{ label: "🍄大阴蒂", value: "big-clits"},{ label: "🥢娇小亚洲人", value: "petite-asians"},
{ label: "🎓大学骚货", value: "college-sluts"},{ label: "🏆完美身材", value: "perfect-body"},{ label: "🥺乞求射精", value: "begging-for-cum"},{ label: "🏋️健身女孩", value: "fitness-girls"},
{ label: "🔄X-Change", value: "x-change"},{ label: "☠️自杀女孩", value: "suicide-girls"},{ label: "🐤小金发", value: "small-blondes"},{ label: "🌸亚洲小穴", value: "asian-pussy"},
{ label: "😮口交骚货", value: "blowjob-sluts"},{ label: "🌺美丽色情", value: "beautiful-porn"},{ label: "💄人妖", value: "ladyboys"},{ label: "🏕️真实户外爱好者", value: "real-outdoor-enjoyers"},
{ label: "☁️BBC天堂", value: "bbc-heaven"},{ label: "🍭双性恋男孩 / Twinks", value: "twinks"},{ label: "😲比你想象的大", value: "bigger-than-you-thought"},{ label: "🍩黑人屁股", value: "ebony-ass"},
{ label: "🎀女性支配娘炮训练", value: "femdom-sissy-training"},{ label: "🐲Bad Dragon玩具爱好者", value: "bad-dragon-toy-lovers"},{ label: "🧘健身熟女", value: "fitmilfs"},
{ label: "🦒长腿性感", value: "long-sexy-legs"},{ label: "🇰🇷韩国NSFW", value: "korean-nsfw"},{ label: "🥪内阴", value: "innie"},{ label: "🖌️动画性爱", value: "animated-sex"},
{ label: "👓3D色情", value: "3d-porn"},{ label: "🧚エッチ动漫", value: "ecchi-anime"},{ label: "👾Rule 34", value: "rule-34"},{ label: "🔇忍住呻吟", value: "hold-the-moan"},
{ label: "🦄美丽跨性别鸡巴", value: "beautiful-trans-dick"},{ label: "🕯️肛交射精", value: "cum-from-anal"},{ label: "🏋️‍♀️丰满健身", value: "thick-fit"},
{ label: "💍出轨妻子", value: "cheating-wife"},{ label: "👗变装者", value: "crossdresser"}
      ]},
      { label: "标签", param: "tag", options: [
        { label: "全部", value: "" }
      ]},
      { label: "排序", param: "sort", options: [
        { label: "热门", value: "trending" },
        { label: "近期", value: "recent" }
      ]}
    ],
    urlTemplate: "https://sky.porn/api/feed?{cat}&limit=12&cursor={cursor}"
  });

  // ---- 解析器（Sky Porn 格式：items 数组，media.url）----
  window.FeedParsers['skyPorn'] = function (data) {
    var items = [];
    if (data && Array.isArray(data.items)) {
      items = data.items;
    }
    if (!items.length) {
      console.warn('[FeedParsers.skyPorn] items 为空');
      return [];
    }
    return items.map(function (item) {
      if (!item || !item.media) return null;
      var vurl = item.media.url || '';
      if (!vurl) return null;
      var record = item.records && item.records[0] || {};
      var author = record.author || {};
      return {
        url: vurl,
        sd_url: '',
        fhd_url: '',
        user: author.handle || '',
        user_avatar: author.avatar || '',
        text: record.text || '',
        likes: item.media.likeCount || 0,
        comments: 0,
        favorites: 0,
        tags: (item.media.niches || []).map(function (n) { return n.name; })
      };
    }).filter(Boolean);
  };
})();
