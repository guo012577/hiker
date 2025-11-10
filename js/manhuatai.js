function getChapter() {
  let res = {}; // 最终结果对象
  let d = []; // 数据数组，用于存储展示项
  
  // 解析接口返回的JSON字符串（getResCode()获取原始数据）
  var oRH1 = JSON.parse(getResCode());
  
  // 向d中添加3个基础信息项
  d.push(
    // 第一项：漫画基本信息（图片卡片类型）
    {
      desc: oRH1.comic_name, // 描述：漫画名称
      title: "最新：" + oRH1.last_chapter_name, // 标题：最新章节名称
      pic_url: oRH1.cover_list[1], // 封面图URL（取封面列表中第2张图）
      url: oRH1.cover_list[0], // 链接（取封面列表中第1项，推测为漫画首页链接）
      col_type: "pic_1_card" // 类型：图片卡片
    },
    // 第二项：漫画简介（富文本类型）
    {
      title: '<span style="color:#003472">&&nbsp;&nbsp;简介：' + oRH1.comic_desc + '</span>', // 带样式的简介文本（comic_desc为漫画描述）
      col_type: "rich_text" // 类型：富文本
    },
    // 第三项：分隔线（用于视觉分隔）
    {
      col_type: "line" // 类型：分隔线
    }
  );
  
  // 遍历漫画章节数组（从最后一章倒序遍历，即从最新到最早）
  for (let i = oRH1.comic_chapter.length - 1; i >= 0; i--) {
    let chapter = oRH1.comic_chapter[i]; // 当前章节
    let comic_id = oRH1.comic_id;
	let chapter_newid = chapter.chapter_id
    // 向d中添加章节项（文本类型）
    d.push({
      title: chapter.chapter_name, // 标题：章节名称
      url: "https://www.kanman.com/api/getchapterinfov2?product_id=1&productname=kmh&platformname=pc&comic_id="+comic_id+"&chapter_newid="+chapter_newid+"&isWebp=1&quality=middle"+ '#' + i + '@lazyRule=.js:let jsons = JSON.parse(fetch(input,{}));let page = input.split("#")[1];let list = jsons.data.current_chapter.chapter_img_list;let pics = [];for (let k=1;k < list.length;k++){pics.push(list[k])};"pics://"+pics.join("&&")', // 章节详情链接（包含动态加载图片的逻辑，通过章节索引i构建）
      col_type: "text_1" // 类型：文本项
    });
  }
  // 构建最终结果并传递给页面渲染
  res.data = d;
  setHomeResult(res); // 将结果用于页面展示
}