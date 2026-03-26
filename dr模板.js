js:
var d=[];
require(config.模板);//超级牛逼，只要使用自动匹配模板初始化就自动依赖dr模板
putVar('cmsapp.jsRoot','https://raw.githubusercontent.com/guo012577/hiker/refs/heads/main/');
设置(d);
function demo(p){
    let d_url;
    let s_url;
    let detailUrl;
    let system;
    let ua='';
    switch (p){
        case 0:
            d_url='https://hikerfans.com/ys';
            s_url='/ys/index.php/vod/search/page/fypage/wd/**.html';
            detailUrl='vod/detail/';
            system='/ys/index.php/gbook/index.html';
            break;
        case 1:
            d_url='https://hikerfans.com/ys';
            s_url='/ys/index.php/vod/search/page/fypage/wd/**.html';
            detailUrl='vod/detail/';
            system='true';
            break;
        case 2:
            d_url='https://www.i8k.cc/label/hot.html';
            // s_url='/vodsearch/**-/page/fypage.html';
            s_url='/search/page/fypage/wd/**.html';
            detailUrl='/voddetail/';
            system='';
            break;
        case 3:
            d_url = 'http://m.kuhuiv.com/channel/tv.html';
            s_url = '/so/page/fypage/wd/**.html';
            detailUrl='show/';
            system='';
            ua = MOBILE_UA;
            break;
    }
    return $('#noLoading#').lazyRule((d_url,s_url,detailUrl,system,ua)=>{
        putMyVar('url',d_url);
        putMyVar('surl',s_url);
        putMyVar('detailUrl',detailUrl);
        putMyVar('system',system);
        putMyVar('ua',ua);
        refreshPage(false);
        return 'toast://例子已经给你了，别再找我要了！'
    },d_url,s_url,detailUrl,system,ua)
}
d.push({
    title: '““””<span style="color: #1aad19">♻检测升级</span>',
    desc:'清除所有DR模板依赖,等同于长按小程序标题清除缓存',
    col_type: 'scroll_button',
    url: $('#noLoading#').lazyRule(()=>{
        showLoading('升级检测中,请稍等...');
        require('https://raw.githubusercontent.com/guo012577/hiker/refs/heads/main/dr.js');
        config={
            模板:'https://raw.githubusercontent.com/guo012577/hiker/refs/heads/main/dr.js'
        }
        require(config['模板']);
        let requireId = version.requireId;
        let ver = version.ver;
        let update = version.update;
        let localDate = new Date(update);
        try {
            var webLib = fetch(requireId);
            var webVer = (function(webLib) {
                eval(webLib);
                return version;
            })(webLib);
        }catch (e) {
            hideLoading();
            return 'toast://远程服务器通讯错误,本次检测升级失败\n'+e.message;
        }
        let webDate = new Date(webVer.update);
        // $.dateFormat(new Date(parseInt(localDate)),"yyyy-MM-dd HH:mm:ss");
        if(webDate>localDate||webVer.ver!==ver){//网页更新时间大于本地库时间或者版本号不等
            hideLoading();
            let msg = '本地依赖更新时间:'+update+',版本:'+ver+'\n云端依赖更新时间:'+webVer.update+',版本:'+webVer.ver+'\n有升级:['+ver+']=>['+webVer.ver+'],立即升级?';
            return $(msg).confirm((requireId,webLib) => {
                let jsp = 'hiker://files/libs/'+md5(requireId)+'.js';
                log('本地依赖模块路径=> '+jsp);
                deleteCache();
                clearMyVar('是否进入规则');
                writeFile(jsp,webLib)
                refreshPage(false);
                return 'toast://升级成功!模块依赖缓存已清除'
            },requireId,webLib);
        }else{
            hideLoading();
            return 'toast://经检测已经是最新的['+ver+']了!'
        }
    })
});
d.push({
    title:`““””<span style="color: #1aad19">${getItem('mode','WEB')}</span>`,
    col_type: "scroll_button",
    url:$('#noLoading#').lazyRule(()=>{
        let modes = ['WEB','APP','混合'];
        let idex = modes.indexOf(getItem('mode','WEB'));
        let nextIdex = idex < modes.length -1?idex+1:0;
        let nextMode = modes[nextIdex];
        return $(`切换一级匹配模式为${nextMode}?`).confirm((nextMode)=>{
            setItem('mode',nextMode);
            refreshPage(false);
            return 'hiker://empty'
        },nextMode)
    })
});
d.push({  
    col_type: "blank_block"
});
d.push({
    title:  '““””<span style="color: #ff7000">例子</span>' ,
    url: $('#noLoading#').lazyRule(()=>{
        return $('需要例子别点我，点右边的。\n非要点我也不是不行,确认可以帮你清除自动匹配插件的依赖文件').confirm(()=>{
            deleteCache(getVar('cmsapp.jsRoot')+'自动模板匹配.js');
            return 'toast://已经清除,自己检查吧!'
        })
    }),
    col_type: "scroll_button",
    desc: "",
    pic_url: ""
});

d.push({
    title:  '蓝莓影视1' ,
    url: demo(0),
    col_type: "scroll_button",
    desc: "",
    pic_url: ""
});
d.push({
    title:  '蓝莓影视2' ,
    url: demo(1),
    col_type: "scroll_button",
    desc: "",
    pic_url: ""
});
d.push({
    title:  '极客影视' ,
    url: demo(2),
    col_type: "scroll_button",
    desc: "",
    pic_url: ""
});
d.push({
    title:  '酷绘' ,
    url: demo(3),
    col_type: "scroll_button",
    desc: "",
    pic_url: ""
});
d.push({  
    col_type: "blank_block"
});
d.push({
    title:  '““””<span style="color: #ff7000">一二级处理</span>' ,
    url: $('hiker://empty#noHistory##noRecordHistory##noRefresh#').rule(()=>{
        setPageTitle('一二级处理函数生成工具');
        let d = [];
        d.push({
            title:'开始生成',
            desc: "输入dr规则的一二级处理对象,开始生成符合模板的一二级处理字符串",
            col_type:'input',
            url:$.toString(()=>{
                let dr_deal_obj = getMyVar('dr_deal_obj','{}');
                try {
                    eval(dr_deal_obj); //只是检验一下这个obj没问题
                    let jdk = `$.toString(()=>{return ${dr_deal_obj}})`;
                    jdk = ''+eval(jdk);
                    jdk = jdk.replace(/"/g,"'");//将双引号替换单引号,防止json引号冲突问题
                    putMyVar('dr_deal_str',jdk);
                    refreshPage(false);
                    return 'hiker://empty'
                }catch (e) {
                    return 'toast://发生了错误:\n'+e.message;
                }
            }),
            extra:{
                titleVisible: true,
                textSize: 13,
                type: "textarea",
                height:5,
                onChange: "putMyVar('dr_deal_obj',input)",
                defaultValue: getMyVar('dr_deal_obj', '{}')||"{}"
            }
        });
        d.push({
            title:'复制',
            desc: "对应上面obj对象的模板字符串结果，可以复制后用于一二级及搜索模板",
            col_type:'input',
            url:$.toString(()=>{
                return 'copy://'+getMyVar('dr_deal_str', '{}')||"{}"
            }),
            extra:{
                titleVisible: true,
                textSize: 13,
                type: "textarea",
                height:8,
                onChange: "putMyVar('dr_deal_str',input)",
                defaultValue: getMyVar('dr_deal_str', '{}')||"{}"
            }
        });
        d.push({
            title:'点此进入网页将复制的结果在线压缩成一行',
            url:$('#noLoading##noHistory##noRecordHistory#').lazyRule(()=>{return 'https://c.runoob.com/front-end/47/'}),
            col_type:'text_1'
        })
        setResult(d);
    }),
    col_type: "scroll_button",
    desc: "",
    pic_url: ""
});

d.push({
    title: '““””<span style="color: #ab2415">清除匹配记录</span>',
    url:$('#noLoading#').lazyRule(()=>{
        return $('执行此操作将清空本模板运行过程中的匹配记录缓存，下次测试重新按模板顺序开始匹配，是否继续?').confirm(()=>{
            clearMyVar('ssmuban');
            clearMyVar('yjmuban');
            clearMyVar('muban');
            return 'toast://全部自动匹配模板的匹配记录已清除!'
        })
    }),
    col_type:'scroll_button'
});
let desc="测试如果能正常进首页即成功，支持常见视频类网页书签地址。测试环境已升级完整的运行沙箱，点击二级进不去的人记得升级模板，出来了一级就说明可用";
d.push({
    title: '道长dr模板说明-点此管理本地模板',
    url: $('hiker://empty').rule(()=>{
        setPageTitle('DR自动匹配模板管理');
        let root = 'hiker://files/rules/dzHouse/json/'; //模板根目录
        let files = ['一级模板','二级模板','搜索模板'];
        let d = [];
        for(let file of files){
            d.push({
                title:file===getMyVar('mubanManage',files[1])?'““””<span style="color: #12b668">'+file+'</span>':file,
                col_type:'scroll_button',
                url:$('#noLoading#').lazyRule((file)=>{
                    putMyVar('mubanManage',file);
                    refreshPage(false);
                    return 'hiker://empty'
                },file),
            });
        }
        let fileName = getMyVar('mubanManage',files[1]);
        let filePath = `${root}${fileName}.json`;
        let code = request(filePath);
        d.push({
            title:'DR模板注意事项',
            col_type:'text_1',
            desc:'三种模板对应的是三个本地文件，手动新增json的时候千万要注意,别把一级模板json新增到搜索模板文件里了,导入功能是有校验的倒是随便导入',
            url:'toast://看懂了吗?如果没懂啥意思，我劝你最好别用新增功能'
        });
        d.push({
            title:'编辑模板',
            col_type:'text_4',
            url:$('#noLoading#').lazyRule((filePath)=>{
                let status = fetch('hiker://home@JSON编辑器');
                let hasJsonEditor = (status && status !== 'null');
                if(!hasJsonEditor){
                    return 'editFile://'+filePath;
                }else{
                    return 'hiker://page/interface#noHistory##noRecordHistory#?rule=JSON编辑器&Json='+base64Encode(filePath);
                }
            },filePath)
        });
        d.push({
            title:'初始化',
            col_type:'text_4',
            url:$('#noLoading#').lazyRule((filePath,fileName)=>{
                return $(`确认初始化本地模板文件:${fileName}?将自动拉仓库道长的公开模板覆盖本地模板文件`).confirm((filePath,fileName)=>{
                    let api = 'https://raw.githubusercontent.com/guo012577/hiker/refs/heads/main';
                    let mubans = {
                        一级模板:api+'一级模板.json',
                        二级模板:api+'二级模板.json',
                        搜索模板:api+'搜索模板.json',
                    };
                    let muban = mubans[fileName];
                    let code = request(muban);
                    if(!/解析/.test(code)){
                        return 'toast://仓库服务器通讯异常，请稍候再试...\n'+code
                    }else{
                        writeFile(filePath,code);
                        refreshPage(false);
                        return 'toast://已初始化重置模板:'+fileName+'=>'+muban
                    }
                },filePath,fileName)
            },filePath,fileName)
        });
        d.push({
            title:'新增',
            col_type:'text_4',
            url:$("{{clipboard}}","自动识别剪切板内容或手动输入JSON文本").input((filePath)=>{
                let obj = {};
                try{
                    obj = JSON.parse(input)
                }catch(e){
                    return 'toast://新增失败,JSON校验不通过:'+e.message
                }
                let localmubans = JSON.parse(fetch(filePath)||'[]');//本地的模板
                let idex = localmubans.findIndex(it=>it.名称===obj.名称);
                if(idex>-1){
                    return 'toast://你的第'+idex+'个跟待新增的冲突了，自己改名新增或者去编辑原来那个模板吧'
                }
                localmubans.push(obj);
                writeFile(filePath, JSON.stringify(localmubans));
                refreshPage(false);
                return 'toast://已成功新增到:'+filePath
            },filePath)
        });
        d.push({
            title:'导入',
            col_type:'text_4',
            url:$("{{clipboard}}","自动识别剪切板内容或手动输入口令").input((filePath,fileName)=>{
                if(!/一级模板|二级模板|搜索模板/.test(input)){
                    return 'toast://无法识别的模板导入口令.必须包含字符串一级模板|二级模板|搜索模板'
                }
                if(!input.includes(fileName)){
                    return 'toast://当前位置仅允许导入:'+fileName+',你的是:'+input.split('：')[0]
                }
                try {
                    input = input.split('\n')[1].trim();
                    let text = parsePaste(input);
                    let obj = JSON.parse(base64Decode(text));
                    // log(obj);
                    let localmubans = JSON.parse(fetch(filePath)||'[]');//本地的模板
                    let titles = localmubans.map(it=>it.名称); // 模板标题

                    //单条导入
                    let idex = titles.indexOf(obj.名称);
                    if (idex < 0) {
                        localmubans.push(obj);
                        writeFile(filePath, JSON.stringify(localmubans));
                        refreshPage(false);
                        return 'toast://成功导入到:'+filePath
                    } else {
                        return $('检测到已有订阅:' + obj.名称 + ',是否覆盖?').confirm((filePath, idex, obj) => {
                            let localmubans = JSON.parse(fetch(filePath) || '[]');
                            localmubans[idex] = obj;
                            writeFile(filePath, JSON.stringify(localmubans));
                            refreshPage(false);
                            return 'toast://覆盖并导入成功'
                        }, filePath, idex, obj)
                    }
                }catch (e) {
                    return 'toast://内容有误啊兄弟:'+input+'\n'+e.message
                }

            },filePath,fileName)
        });
        // d.push({
        //     title:code,
        //     col_type:'rich_text'
        // });
        try {
            let localmubans = JSON.parse(code);
            for(let i in localmubans){
                let muban = localmubans[i];
                d.push({
                    title:i+':'+muban.名称,
                    col_type:'text_1',
                    url:$('hiker://empty#noHistory##noRecordHistory##noRefresh#').rule((muban)=>{
                        setPageTitle('编辑:'+muban.名称);
                        setResult([{title:JSON.stringify(muban),col_type:'rich_text'}]);
                    },muban),
                    extra:{
                        lineVisible:false
                    }
                });
                d.push({
                    title:'编辑',
                    col_type:'text_3',
                    url:$(JSON.stringify(muban),'请输入编辑后的内容').input((localmubans,i,filePath)=>{
                        let ret = {};
                        try {
                            ret = JSON.parse(input)
                        }catch (e) {
                            return 'toast://JSON校验失败，不允许保存'
                        }
                        if(JSON.stringify(localmubans[i])!==input) {
                            localmubans[i] = ret;
                            writeFile(filePath, JSON.stringify(localmubans));
                            refreshPage(false);
                            return 'toast://已修改并保存'
                        }else{
                            return 'toast://原文件无变化'
                        }
                    },localmubans,i,filePath)
                });
                d.push({
                    title:'导出',
                    col_type:'text_3',
                    url:$('#noLoading#').lazyRule((muban,fileName)=>{
                        try {
                            let shareText = base64Encode(JSON.stringify(muban));
                            var pastes = getPastes();
                            var url = sharePaste(shareText, pastes.slice(-1)[0]);
                            let import_rule = fileName + "：" + muban.名称 + '\n' + url;
                            copy(import_rule);
                            return 'toast://已导出并复制到剪切板，快去分享吧';
                        }catch (e) {
                            return 'toast://发生错误:'+e.message
                        }
                    },muban,fileName)
                });
                d.push({
                    title:'删除',
                    col_type:'text_3',
                    url:$(`确认删除${getMyVar('mubanManage',files[1])}:${muban.名称}`).confirm((localmubans,i,filePath,name)=>{
                        localmubans.splice(i,1);//删除
                        writeFile(filePath,JSON.stringify(localmubans));
                        refreshPage(false);
                        return 'toast://已删除'+name
                    },localmubans,i,filePath,muban.名称)
                });
            }
        }catch (e) {log(e.message)}
        setResult(d);
    }),
    // url: 'toast://'+desc,
    col_type: "text_1",
    desc:desc ,
    pic_url: ""
});
d.push({
    title: '详情页标识',
    url: $.toString(()=>{
        return $('清空输入?').confirm(()=>{
            putMyVar('detailUrl','');
            refreshPage(false);
            return 'toast://已清空详情页标识'
        });
    }),
    col_type: "input",
    desc: "输入网站的影片详情页标识或完整链接,必填",
    pic_url: "",
    extra:{
        defaultValue:getMyVar('detailUrl','detail'),
        onChange:"putMyVar('detailUrl',input)",
        titleVisible: true,
        textSize: 13,
        type: "textarea",
        height:1,
    }
});
d.push({
    title: '系统功能',
    url: $.toString(()=>{
        return $('清空输入?').confirm(()=>{
            putMyVar('system','');
            refreshPage(false);
            return 'toast://已清空系统功能链接'
        });
    }),
    col_type: "input",
    desc: "拦截网站的某个可点击链接进行注入模板的设置功能,选填。不拦截填true",
    pic_url: "",
    extra:{
        defaultValue:getMyVar('system','true'),
        onChange:"putMyVar('system',input)",
        titleVisible: true,
        textSize: 13,
        type: "textarea",
        height:2,
    }
});
d.push({
    title: '一二级测试',
    url: $.toString(()=>{
        let url=getMyVar('url','').trim();
        if(!url||!/^http/.test(url)){
            return 'toast://请输入正确的网页地址'
        }
        let homeUrl='hiker://empty##'+url;
        var ua = getMyVar('ua','');
        initConfig({
            指定ua:ua,
            // 模板:'http://hiker.nokia.press/hikerule/rulelist.json?id=2505'
        });
        if(ua) {
            log('一二级测试指定ua:' + ua);
        }
        // log(config.模板);
        // log(config.ua);
        clearMyVar('test_mode');//关闭测试模式
        return $(homeUrl).rule(()=>{
            // addListener('onClose', $.toString(()=>{//监听返回事件
            //     initConfig({}); //清空配置
            // }));
            require(config.自动匹配);
            if(getItem('mode','WEB')==='APP'){
                let cates = 打造动态分类([]);
                // 设置(cates);
                自动一级(null,cates,null,true);
            }else if(getItem('mode','WEB')==='WEB'){
                // require(config['模板']);
                依赖检测();
                一级书签(getMyVar('detailUrl','detail'),getMyVar('system','true'));
            }else{
                if(lsg.getItem('dr_mode','WEB')==='APP'){
                    refreshX5Desc('float&&0');
                    refreshX5WebView('http://127.0.0.1:4848');
                    let cates = 打造动态分类([]);
                    自动一级(null,cates,null,true);
                }else{
                    依赖检测();
                    一级书签(getMyVar('detailUrl','detail'),getMyVar('system','true'));
                }
            }
        })
    }),
    col_type: "input",
    desc: "输入待添加的视频网站地址",
    pic_url: "",
    extra:{
        defaultValue:getMyVar('url',''),
        onChange:"putMyVar('url',input)"
    }
});
d.push({
    title: '搜索关键字:'+'““””<span style="color: #ab2415">'+getMyVar('skey','斗罗')+'</span>',
    col_type:'text_2',
    url:$(getMyVar('skey','斗罗'),'请输入搜索关键字').input(()=>{
        putMyVar('skey',input);
        refreshPage(false);
        return 'hiker://empty'
    })
});

d.push({
    title: '验证字符:'+'““””<span style="color: #ab2415">'+getMyVar('sflag','')+'</span>',
    col_type:'text_2',
    url:$(getMyVar('sflag',''),'若有搜索验证,请输入搜索成功必然出现的字符串,比如 搜索结果|相关的,多个可用|隔开').input(()=>{
        putMyVar('sflag',input);
        refreshPage(false);
        return 'hiker://empty'
    })
});
d.push({
    title: '搜索测试',
    url: $.toString(()=>{
        let key = getMyVar('skey','斗罗');
        let url=getMyVar('surl','').trim();
        let host = getHome(getMyVar('url','').trim());
        if(!url){
            return 'toast://请输入正确的搜索地址'
        }else if(!/^http/.test(url)&&!/^http/.test(host)){
            return 'toast://非完整的搜索地址需求有一个一二级测试地址'
        }
        if(!/^http/.test(url)){
            url = (host+url);
        }
        url = url.replace('**',key);//构造搜索地址
        let homeUrl='hiker://empty##'+url;//搜索链接避免第一次请求
        var ua = getMyVar('ua','');
        initConfig({
            指定ua:ua,
        });
        if(ua) {
            log('搜索测试指定ua:' + ua);
        }
        // log(homeUrl);
        putMyVar('test_mode','true');//设置为测试模式,这样二级才有
        return $(homeUrl).rule((key)=>{
            setPageTitle('搜索测试:'+key);
            // log(MY_URL);
            require(config.自动匹配);
            自动搜索(getMyVar('sflag',''));
        },key)
    }),
    col_type: "input",
    desc: "输入视频网站的搜索接口，搜索词用**表示",
    pic_url: "",
    extra:{
        defaultValue:getMyVar('surl',''),
        onChange:"putMyVar('surl',input)",
        textSize: 13,
        type: "textarea",
        height:2,
    }
});
d.push({
    title: '自定义UA',
    url: $.toString(()=>{
        return $('清空输入?').confirm(()=>{
            putMyVar('ua','');
            refreshPage(false);
            return 'toast://已清空自定义UA'
        });
    }),
    col_type: "input",
    desc: "输入自定义的UA,可不填",
    pic_url: "",
    extra:{
        defaultValue:getMyVar('ua',''),
        onChange:"putMyVar('ua',input)",
        titleVisible: true,
        textSize: 13,
        type: "textarea",
        height:2,
    }
});


d.push({
    title: '🚇快捷UA',
    col_type: "text_3",
    url:$('#noLoading#').lazyRule(()=>{
        let sel_title = ['电脑','手机','Dart/2.13 (dart:io)','Dalvik/2.1.0'];
        return $(sel_title,2,'请选择一个快捷UA').select(()=>{
            switch (input){
                case '电脑':
                    putMyVar('ua',PC_UA);
                    break;
                case '手机':
                    putMyVar('ua',MOBILE_UA);
                    break;
                case 'Dart/2.13 (dart:io)':
                    putMyVar('ua',input);
                    break;
                case 'Dalvik/2.1.0':
                    putMyVar('ua','Dalvik/2.1.0 (Linux; U; Android 9; RVL-AL09 Build/HUAWEIRVL-AL09)');
                    break;
            }
            refreshPage(false);
            return 'hiker://empty'
        });
    })
});

d.push({
    title:  '📲生成规则' ,
    url: $('#noLoading#').lazyRule(()=>{
        let url=getMyVar('url','').trim();
        if(!url||!/^http/.test(url)){
            return 'toast://你没输入正确的地址呢？'
        }
        return $('','确定测试好了并生成小程序吗？取个名字吧').input((url)=>{
            if(!input){
                return 'toast://小程序不起名你想玩蛇皮？'
            }
            const {rule}=$.require('hiker://page/ruleGen');
            let ext = 'DR';
            if(getItem('mode','WEB')==='APP'){
                ext = 'dr';
            }else if(getItem('mode','WEB')==='混合'){
                ext = 'Dr'
            }
            // rule.title=input.includes('.')?input:input+'.DR';
            rule.title=/dr/gi.test(input)?input:input+'.'+ext;//正则匹配dr不区分大小写
            let ourl=rule.url.match(/##(.*)/)[1];
            let opre=rule.preRule;
            let osf=rule.searchFind;
            let ua=getMyVar('ua','');
            let sflag=getMyVar('sflag','');
            rule.url=rule.url.replace(ourl,url);
            // 替换一级解析
            if(getItem('mode','WEB')==='APP'){
                rule.find_rule='js:\n'+$.toString(()=>{
                    require(config.自动匹配);
                    自动一级();
                }).split('{')[1].split('}')[0].replace(/ /g,'').trim();
            }else if(getItem('mode','WEB')==='WEB'){
                rule.find_rule=rule.find_rule.replace(/\$detailUrl/g,getMyVar('detailUrl','detail')).replace(/\$system/g,getMyVar('system','true'));
            }else{
                rule.find_rule=`js:
require(config.自动匹配);
let ui = ()=>{
    //page = MY_PAGE;
    //true_url = getMyVar('header.url', MY_URL);
    //if(page>1){true_url=true_url.replace(/(\\d+)\\.html/,'$1-'+page+'.html')}
    true_url = 获取正确链接();
    //log(true_url);
    /*
    可能用到: 一级分类 子分类 分类标题
    分类链接:{
        二次处理(u){
        return u.replace(/type/,'show')}
    }
    */
    let cates = 打造动态分类([{
    一级分类:'',
    子分类:'',
    }]);
    设置(cates);
    自动一级(null,cates);
}
混合(ui,"${getMyVar('detailUrl','detail')}","${getMyVar('system','true')}");`;
            }
            // 替换搜索链接
            rule.search_url='hiker://empty##'+getMyVar('surl','').trim();
            // 替换二级解析
            rule.detail_find_rule=JSON.parse(request('hiker://home@' + MY_RULE.title)).detail_find_rule;
            // 替换预处理
            rule.preRule=opre.replace('$ua',ua);
            // 替换搜索成功标识
            rule.searchFind=osf.replace('$sflag',sflag);
            //替换图标
            rule.icon='https://api.xinac.net/icon/?url='+getMyVar('url',input);
            //log(rule);
            let path='hiker://files/ruleCache/dr/'+input+'.json';
            writeFile(path,JSON.stringify(rule));
            putMyVar('genRule',JSON.stringify({
                title:input,
                url:path,
                ua:ua
            }));
            return 'toast://已生成小程序:'+input+'=>地址:'+url
        },url);

    }),
    col_type: "text_3",
    desc: "",
    pic_url: ""
});
d.push({
    title:  '📥导入' ,
    url: $('#noLoading#').lazyRule(()=>{
        var rule=getMyVar('genRule','');
        if(!rule){
            return 'toast://没生成过规则，无法导入，请先测试好并生成一个规则吧'
        }
        try{
            rule=JSON.parse(rule);
        }catch(e){
            log(e.message);
            return 'toast://生成的规则有误，请重试吧'
        }
        log(rule);
        /*
        let ruleCode = "海阔视界规则分享，当前分享的是：小程序，无根树，花正清，不断荤腥不戒淫￥home_rule_v2￥base64://@测试CMS@" + base64Encode(fetch(rule.url));
        importUrl = "rule://" + base64Encode(ruleCode);
        */
        let ruleCode = "海阔视界首页频道规则【"+rule.title + "】￥home_rule_url￥" + rule.url;
        log(ruleCode);
        let importUrl = "rule://" + base64Encode(ruleCode)
        return importUrl
    }),
    col_type: "text_3",
    desc: "",
    pic_url: ""
});
setResult(d);
