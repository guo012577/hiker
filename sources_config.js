// 视频源配置 - 内嵌在 HTML 中作为主数据源
// 如需外部化，可通过 loadSourceConfig() 从 sources.json 加载
const EMBEDDED_SOURCES = [
    // ---- 模板源（支持分类切换）----
    { name: "抖一抖", url: "https://www.douyidou.com/get/get1.php",
      categories: [
        {label: "混合1", key: "get1"}, {label: "混合2", key: "get2"},
        {label: "JK制服", key: "get3"}, {label: "欲梦", key: "get4"},
        {label: "女大", key: "get5"}, {label: "女高", key: "get6"},
        {label: "热舞", key: "get7"}, {label: "清纯", key: "get8"},
        {label: "蛇姐", key: "get9"}, {label: "穿搭", key: "get10"},
        {label: "高质量", key: "get11"}, {label: "汉服", key: "get12"},
        {label: "黑丝", key: "get13"}, {label: "变装", key: "get14"},
        {label: "萝莉", key: "get15"}, {label: "甜妹", key: "get16"},
        {label: "白丝", key: "get17"}
      ],
      urlTemplate: "https://www.douyidou.com/get/{cat}.php"
    },
    // ---- yujn 类型 ----
    { name: "yujn", url: "http://api.yujn.cn/api/zzxjj.php",
      categories: [
        {label: "zz小姐姐", key: "zzxjj"}, {label: "小姐姐", key: "xjj"},
        {label: "女大学生", key: "nvda"}, {label: "黑丝", key: "heisis"},
        {label: "cos", key: "manzhan"}, {label: "白丝", key: "baisis"},
        {label: "身材", key: "wmsc"}, {label: "蛇姐", key: "shejie"},
        {label: "吊带", key: "diaodai"}, {label: "玉足", key: "jpmt"},
        {label: "清纯", key: "qingchun"}, {label: "汉服", key: "hanfu"},
        {label: "萝莉", key: "luoli"}
      ],
      urlTemplate: "http://api.yujn.cn/api/{cat}.php"
    },
    // ---- 直接URL类型 ----
    { name: "nrzj", url: "https://v.nrzj.vip/video.php?_t=0" },
    { name: "wudada", url: "http://www.wudada.online/Api/ScSp" },
    { name: "188sp", url: "https://188sp.711888.xyz/188/video.php?_t=0" },
    { name: "xjj2", url: "http://xjj2.716888.xyz/fenlei/djxjj/dj1.php?_t=0" },
    { name: "姐姐", url: "https://jiejie.uk/xjj/get/video.php?_t=0" },
    { name: "抖抖", url: "http://dou.plus/get/get1.php" },
    { name: "极致", url: "https://p.txqq.pro/api/girls?limit=1" },
    { name: "DJ秀", url: "http://djshare.kuaiyuhudong.cn/api/web/share/djvideo.php" },
    // ---- Feed流类型 ----
    { name: "美女极致", url: "https://p.txqq.pro/api/girls?limit=20" },
    { name: "内涵小姐姐", url: "http://v.nrzj.vip/video.php?_t=0" },
    { name: "抖妹", url: "https://www.doumei.cc/api/v1/recommend" },
    { name: "xxxtik Feed", url: "https://xxxtik-apix-s2l6l.ondigitalocean.app/post/feed/by-key?cursor=0" },
    { name: "Feed源", url: "https://www.xxxfollow.com/api/v1/user/public?genders=cf" },
    { name: "onlytik", url: "https://onlytik.com/api/new-videos" },
    { name: "ReddClips", url: "https://api.reddclips.com/categories/16/posts?sort=hot&limit=25",
      categories: [
        {label: "Asian", key: "16"}, {label: "Hetero", key: "6"}, {label: "NSFW Transgender", key: "9"},
        {label: "Hentai & Anime", key: "13"}, {label: "BDSM & Fetish", key: "14"},
        {label: "Lesbian", key: "15"}, {label: "Latina & Ebony", key: "17"},
        {label: "MILF & Mature", key: "18"}, {label: "Public & Exhibitionism", key: "19"},
        {label: "Cosplay & Alt/Goth", key: "20"}, {label: "Anal", key: "21"},
        {label: "Feet", key: "21"}, {label: "Threesome/Group", key: "23"},
        {label: "Amateur/Homemade", key: "24"}, {label: "Petite/Tiny", key: "25"},
        {label: "Curvy/Thick", key: "26"}, {label: "Redheads", key: "27"},
        {label: "Oral/Blowjobs", key: "28"}
      ],
      urlTemplate: "https://api.reddclips.com/categories/{cat}/posts?sort=hot&limit=25"
    }
];

const EMBEDDED_SOURCE_GROUPS = [
    { key: 'all', name: '全部' },
    { key: 'douyidou', name: '抖一抖', match: url => /douyidou\.com/.test(url) },
    { key: 'yujn', name: 'Yujn', match: url => /api\.yujn\.cn/.test(url) },
    { key: 'other', name: '其他', match: url => /wudada|711888|716888|jiejie\.uk|dou\.plus|nrzj\.vip\/video|djshare|txqq\.pro.*limit=1\b|188sp/.test(url) },
    { key: 'feed', name: 'Feed流', match: url => /xxxfollow|xxxtik|onlytik|reddclips|doumei|txqq\.pro.*limit=20/.test(url) }
];

const EMBEDDED_LOCKED_SOURCES = ['xxxtik Feed', 'Feed源', 'ReddClips', 'onlytik'];

const EMBEDDED_PASSWORD_HASH = 'c2726b3ef039b484e2aff632797f2995967fa50c10c497b0c8485f7157653207';
