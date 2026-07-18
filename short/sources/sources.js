// =============================================
// sources.js —— 内置源配置 + 内置源专属解析器
// 只放「与单一内置源相关」的内容；通用引擎（请求构造/播放/预缓存/通用解析）在 engine.js
// 删除本文件后，市场源仍可正常工作（市场源自带 parser 并注册到 window.FeedParsers）
// =============================================

// 容器预初始化（engine.js 已建，这里二次保险；不可覆盖已有 FeedParsers，否则清空 generic）
if (!window.DEFAULT_SOURCES) window.DEFAULT_SOURCES = [];
if (!window.FeedParsers) window.FeedParsers = {};

window.DEFAULT_SOURCES = [
	// ---- yujn（默认）----
	// ---- 直接URL类型（type: "direct"）----	
	{ name: "yujn", url: "http://api.yujn.cn/api/zzxjj.php",
		type: "yujn", mode: "single",
		categoryGroups: [
			{ label: "分类", param: "cat", flat: true, options: [
			{ label: "zz小姐姐", value: "zzxjj" }, { label: "小姐姐", value: "xjj" },
			{ label: "女大学生", value: "nvda" }, { label: "黑丝", value: "heisi" },
			{ label: "cos", value: "manzhan" }, { label: "白丝", value: "baisi" },
			{ label: "身材", value: "wmsc" }, { label: "蛇姐", value: "shejie" },
			{ label: "吊带", value: "diaodai" }, { label: "玉足", value: "jpmt" },
			{ label: "清纯", value: "qingchun" }, { label: "汉服", value: "hanfu" },
			{ label: "萝莉", value: "luoli" }
		
			] }
		],		urlTemplate: "http://api.yujn.cn/api/{cat}.php"
	},
	{ name: "抖一抖", url: "https://www.douyidou.com/get/get1.php",
		type: "douyidou", mode: "single",
		categoryGroups: [
			{ label: "分类", param: "cat", flat: true, options: [
			{ label: "混合1", value: "get1" }, { label: "混合2", value: "get2" },
			{ label: "JK制服", value: "get3" }, { label: "欲梦", value: "get4" },
			{ label: "女大", value: "get5" }, { label: "女高", value: "get6" },
			{ label: "热舞", value: "get7" }, { label: "清纯", value: "get8" },
			{ label: "蛇姐", value: "get9" }, { label: "穿搭", value: "get10" },
			{ label: "高质量", value: "get11" }, { label: "汉服", value: "get12" },
			{ label: "黑丝", value: "get13" }, { label: "变装", value: "get14" },
			{ label: "萝莉", value: "get15" }, { label: "甜妹", value: "get16" },
			{ label: "白丝", value: "get17" }
		
			] }
		],		urlTemplate: "https://www.douyidou.com/get/{cat}.php"
	},
	{ name: "秀抖", url: "https://api.xudu.org/vos/vc?_t=0.10247156996766538", type: "direct", mode: "single" },
    { name: "抖抖", url: "http://dou.plus/get/get1.php", type: "direct", mode: "single" },
	{ name: "内涵小姐姐", url: "https://v.nrzj.vip/video.php?_t=0", type: "direct", mode: "single" },
	{ name: "xjj2", url: "http://xjj2.716888.xyz/fenlei/djxjj/dj1.php?_t=0", type: "direct", mode: "single" },
	{ name: "wudada", url: "http://www.wudada.online/Api/ScSp", type: "wudada", mode: "single" },
	{ name: "188sp", url: "https://188sp.711888.xyz/188/video.php?_t=0", type: "direct", mode: "single" },
	{ name: "远梦API", url: "https://api.qzqi.com/api/v1/DyRandomVideo", type: "direct", mode: "single" },
	{ name: "dwoAPI", url: "https://openapi.dwo.cc/api/ksvideo", type: "direct", mode: "single" },
	{ name: "蓝莓API", url: "https://api.xiaotuo.net/api.php?act=Api_send&id=86&apikey=987bbfa9-aa4f-2406-631d-a2d384ae4e44d45bd690",
		type: "feed", mode: "single", parser: "lanmei"
	},
	{ name: "小职API", url: "http://api.4qb.cn/api/suiji-sp?msg=热舞&type=json",
		type: "feed", mode: "single", parser: "xiaoZhi"
	},
	{ name: "小众API", url: "https://api.xzdx.top/xjj",
		type: "feed", mode: "single", parser: "xzdx"
	},
	{ name: "TuWei", url: "https://www.tuwei.space/api/girl",
		type: "feed", mode: "single", parser: "tuwei",
		fetch: {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Client-Device': '64fddbe1-776e-44b0-90fb-0c3606ba94cd',
				'X-Client-Token': 'QORLIX2XE3F1T554K0YBHTCANQ7FAH7F'
			},
			dynamicHeaders: true,
			body: JSON.stringify({id:1,status:0,type:1})
		},
		// 源专属认证：注册接口 / 请求体 / token 解析 / 注入的请求头 / UI 选择器
		// 具体逻辑全部在本描述符内，sv_multi.js 只提供通用接线与持久化
		auth: {
			ui: { user: 'tuweiUser', pwd: 'tuweiPwd', btn: 'tuweiTokenBtn', hint: 'tuweiHint' },
			register: {
				url: 'https://www.tuwei.space/api/client/register',
				method: 'POST',
				contentType: 'application/json',
				body: function (u, p) { return { username: u, password: p }; }
			},
			extract: function (d) {
				return {
					token: d.token || (d.data && (d.data.token || d.data.access_token)) || d.access_token,
					device: d.device || (d.data && d.data.device)
				};
			},
			headers: function (token, device) {
				var h = { 'X-Client-Token': token };
				if (device) h['X-Client-Device'] = device;
				return h;
			}
		}
	},	
	// ---- TXT文件类型（type: "txt"）----
	{ name: "591meta", url: "https://v.591meta.com/ks.txt", type: "txt", mode: "multi" },

	// ---- JSON Feed流类型（type: "feed"）----
	{ name: "抖妹", url: "https://www.doumei.cc/api/v1/recommend", type: "feed", mode: "multi", parser: "doumei",
		fetch: { useProxy: true }
	},
	{ name: "美女极致", url: "https://p.txqq.pro/api/girls?limit=20", type: "feed", mode: "multi", parser: "meinv" },

];

/* =============================================
 * 内置源专属解析器（注册到 window.FeedParsers）
 * 仅绑定 DEFAULT_SOURCES 中引用的 parser 字段；引擎兜底 generic 在 engine.js
 * ============================================= */

/* 抖妹 格式（data 数组，content 字段） */
window.FeedParsers.doumei = function(data) {
    var list = data.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    return list.filter(function(item) { return item.content; }).map(function(item) {
        return {
            url: item.content,
            sd_url: '',
            fhd_url: '',
            user: item.author || item.user || '',
            text: item.desc || item.title || '',
            likes: item.like || item.likes || 0,
            comments: item.comment || item.comments || 0,
            favorites: item.favorite || item.favorites || 0,
            tags: item.tags || []
        };
    });
};

/* 美女极致 格式（list 数组，video_url 字段） */
window.FeedParsers.meinv = function(data) {
    var list = data.list && Array.isArray(data.list) ? data.list : [];
    return list.filter(function(item) { return item.video_url; }).map(function(item) {
        return {
            url: item.video_url,
            sd_url: '',
            fhd_url: '',
            user: item.author || '',
            text: item.title || '',
            likes: item.like_count || 0,
            comments: 0,
            favorites: 0,
            tags: []
        };
    });
};

/* TuWei 格式（单次返回一个视频，支持新旧API结构） */
window.FeedParsers.tuwei = function(data) {
    // 提取额度信息
    var _used, _limit, _balance;
    if (data && data.data) {
        // 新版：data.data.limit 包含额度
        if (data.data.limit) {
            var lim = data.data.limit;
            if (lim.user) {
                _used = lim.user.used_count;
                _limit = lim.user.free_limit;
                _balance = lim.user.balance;
            } else {
                _used = lim.anon_count;
                _limit = lim.anon_limit;
            }
        }
        // 旧版：data.data 直接有 anon_count
        if (_used === undefined && data.data.anon_count !== undefined) {
            _used = data.data.anon_count;
            _limit = data.data.anon_limit || 100;
        }
        if (_used !== undefined) {
            var _remaining = Math.max(0, _limit - _used);
            if (_balance !== undefined) _remaining = _balance;
            window._tuweiQuota = { used: _used, limit: _limit, remaining: _remaining, balance: _balance };
            hikerLog('[TuWei 额度] 已用 ' + _used + '/' + _limit + '，剩余 ' + _remaining + (_balance !== undefined ? ' (余额 ' + _balance + ')' : ''));
        }
    }
    if (!data || data.code !== 200 || !data.data || !data.data.video) {
        if (data && data.code === 402) {
            var _q = window._tuweiQuota || { used: '?', limit: 100, remaining: 0 };
            console.warn('[FeedParsers.tuwei] 额度已用完 (' + _q.used + '/' + _q.limit + ')，' + (data.msg || ''));
            window._tuwei402 = true;
            window._tuwei402Msg = data.msg || '额度已用完';
        } else {
            console.warn('[FeedParsers.tuwei] 数据异常:', data);
        }
        return [];
    }
    var v = data.data.video;
    var videoUrl = v.Path || '';
    // Path 是相对路径，需要补全域名
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('/')) {
        videoUrl = 'https://www.tuwei.space' + videoUrl;
    }
    hikerLog('[tuwei parser] 视频URL:', videoUrl, '| id:', v.Id || 'unknown');
    return [{
        url: videoUrl,
        sd_url: '',
        fhd_url: '',
        user: v.User || '',
        text: v.Name || '',
        likes: 0,
        comments: 0,
        favorites: 0,
        tags: []
    }];
};

/* 小职API 格式（单次返回一个随机视频） */
window.FeedParsers.xiaoZhi = function(data) {
    hikerLog('[xiaoZhi parser] 原始数据:', JSON.stringify(data).substring(0,300));
    if (!data || data.code !== 1 || !data.data || !data.data.url) {
        // 兼容: data.cover 或 data.url 在根级
        if (data && data.data && typeof data.data === 'string' && data.data.length > 10) {
            return [{url: data.data.replace(/\\?\//g,'/'), sd_url:'', fhd_url:'', user:'', text:'', likes:0, comments:0, favorites:0, tags:[]}];
        }
        if (data && data.url && typeof data.url === 'string') {
            var vu = data.url.startsWith('//') ? 'https:'+data.url : data.url;
            return [{url: vu, sd_url:'', fhd_url:'', user:'', text:data.text||data.title||'', likes:0, comments:0, favorites:0, tags:[]}];
        }
        console.warn('[FeedParsers.xiao职] 数据异常:', data);
        return [];
    }
    var d = data.data;
    var videoUrl = d.url || '';
    // 补全协议（如果是 // 开头）
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('//')) {
        videoUrl = 'http:' + videoUrl;
    }
    return [{
        url: videoUrl,
        sd_url: '',
        fhd_url: '',
        user: '',
        text: d.mold || '',
        likes: 0,
        comments: 0,
        favorites: 0,
        tags: d.mold ? [d.mold] : []
    }];
};

/* 蓝莓API 格式（单次返回一个视频 URL） */
window.FeedParsers.lanmei = function(data) {
    hikerLog('[lanmei parser] 原始数据:', JSON.stringify(data).substring(0,300));
    // 频率限制：code 201，优雅处理，不报错误，返回空数组让上层跳过
    if (data && data.code === 201) {
        hikerLog('[FeedParsers.lan梅] 频率限制，暂停请求（' + (data.msg || '') + '）');
        return [];
    }
    if (!data || data.code !== 200 || !data.data) {
        console.warn('[FeedParsers.lan梅] 数据异常:', data);
        return [];
    }
    var videoUrl = '';
    if (typeof data.data === 'string') {
        videoUrl = data.data;
        videoUrl = videoUrl.replace(/\\?\//g, '/');
    } else if (typeof data.data === 'object') {
        videoUrl = data.data.url || data.data.video || data.data.src || data.data.path || data.data.cover || '';
        if (typeof videoUrl === 'string') videoUrl = videoUrl.replace(/\\?\//g, '/');
    }
    return [{
        url: videoUrl,
        sd_url: '',
        fhd_url: '',
        user: '',
        text: data.msg || '',
        likes: 0,
        comments: 0,
        favorites: 0,
        tags: []
    }];
};

/* 小众API 格式（单次返回一个视频 URL） */
window.FeedParsers.xzdx = function(data) {
    if (!data || data.code !== 0 || !data.data || !data.data.url) {
        console.warn('[FeedParsers.xzdx] 数据异常:', data);
        return [];
    }
    return [{
        url: data.data.url,
        sd_url: '',
        fhd_url: '',
        user: '',
        text: data.ym || '',
        likes: 0,
        comments: 0,
        favorites: 0,
        tags: []
    }];
};
