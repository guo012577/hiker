/* sourceMarket.js — 获取源（源市场）
 * 功能：
 *   1) 「获取源」按钮 → 从远程 manifest 加载可用源列表（名称 / 版本 / 下载）。
 *   2) 点击「下载」→ 参考 exportSources：用 hiker 文件 API 把 .js 落地到
 *      hiker://files/data/<MY_RULE.title>/sources/<file>（海阔视界环境，作为文件归档）。
 *      同时把完整 JS 文本内联进规则【根目录】的 market-sources.json 清单
 *      （Hiker 对规则根目录文件 request()/writeFile 可靠；子目录下文件 readFile/fetch 均读不到）。
 *   3) 重进时自动恢复：读取 market-sources.json（根目录，request() 可靠）内联的 JS 文本直接注入，
 *      不依赖 sources/ 子目录文件读取。
 *
 * 依赖：window.DEFAULT_SOURCES（由 sources.js 及各 sources/*.js 注册）。
 */
(function () {
  'use strict';

  // 本地文件源（sources/ 下）：由 sourceMarket.js 在解析期同步注入，不在 index_multi.html 硬编码。
  // 说明：Hiker 环境下 sources/ 子目录的 JS API（readFile/fetch）读取不可靠，但 WebView 同源
  // <script src="sources/..."> 加载可靠；故用 document.write 在解析期同步加载（等效于 HTML 写死，
  // 但集中管理、可扩展）。脚本执行后 window.DEFAULT_SOURCES 已含该源，DOMContentLoaded 时 init()
  // 的 loadFolderSources → SVMarket.syncFromDefaults() 会把它并入运行列表 SOURCES。
  var LOCAL_SOURCE_FILES = ['javtrailers.js', 'xfree.js', 'sexladyya_sources.js'];
  try {
    (LOCAL_SOURCE_FILES || []).forEach(function (f) {
      document.write('<script src="sources/' + String(f).replace(/^\/+/, '') + '"><\/script>');
    });
  } catch (e) {}

  /* ============================================================
   * 远程源清单地址：请替换为你自己托管的 manifest.json URL。
   *  - 该地址需允许跨域（CORS），或与部署站点同源。
   *  - 清单 JSON 格式：
   *    {
   *      "sources": [
   *        {
   *          "name": "源显示名",
   *          "version": "1.0.0",
   *          "file": "xxx.js",                       // 建议的文件名
   *          "url": "https://你的域名/sources/xxx.js", // 可下载的 .js 地址
   *          "desc": "可选说明"
   *        }
   *      ]
   *    }
   * ============================================================ */
  var SOURCE_MANIFEST_URL = 'https://gh-proxy.org/https://raw.githubusercontent.com/guo012577/hiker/refs/heads/main/short/manifest.json'; // ← 在这里填入你的远程 manifest.json 地址

  // 市场源清单：写到规则【根目录】 market-sources.json
  var MARKET_MANIFEST_FILE = 'market-sources.json';
  function marketManifestPath() { return 'hiker://files/data/' + getRuleName() + '/' + MARKET_MANIFEST_FILE; }
  var LOCAL_MANIFEST = MARKET_MANIFEST_FILE; // 浏览器预览时 fetch 用的相对根路径

  function $id(s) { return document.getElementById(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // 海阔视界调试日志：优先 fy_bridge_app.log（在 Hiker 日志面板可见），回退 console.log
  function hikerLog(msg) {
    try { if (window.fy_bridge_app && typeof window.fy_bridge_app.log === 'function') { window.fy_bridge_app.log(String(msg)); } } catch (e) {}
    try { console.log(msg); } catch (e) {}
  }

  /* ---------- 获取源密码认证 ---------- */
  var PASSWORD_HASH = 'c2726b3ef039b484e2aff632797f2995967fa50c10c497b0c8485f7157653207';
  function sha256JS(s) {
    function r(x, n) { return (x >>> n) | (x << (32 - n)); }
    var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var msg = unescape(encodeURIComponent(s)); // UTF-8 编码
    var len = msg.length;
    var bitLenLo = len * 8, bitLenHi = 0;
    msg += '\x80';
    while (msg.length % 64 !== 56) msg += '\x00';
    msg += String.fromCharCode((bitLenHi>>>24)&255,(bitLenHi>>>16)&255,(bitLenHi>>>8)&255,bitLenHi&255,(bitLenLo>>>24)&255,(bitLenLo>>>16)&255,(bitLenLo>>>8)&255,bitLenLo&255);
    for (var i = 0; i < msg.length; i += 64) {
      var w = new Array(64);
      for (var t = 0; t < 16; t++) {
        var j = i + t * 4;
        w[t] = (msg.charCodeAt(j) << 24) | (msg.charCodeAt(j+1) << 16) | (msg.charCodeAt(j+2) << 8) | msg.charCodeAt(j+3);
      }
      for (var t = 16; t < 64; t++) {
        var s0 = r(w[t-15],7) ^ r(w[t-15],18) ^ (w[t-15] >>> 3);
        var s1 = r(w[t-2],17) ^ r(w[t-2],19) ^ (w[t-2] >>> 10);
        w[t] = (w[t-16] + s0 + w[t-7] + s1) | 0;
      }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (var t = 0; t < 64; t++) {
        var S1 = r(e,6) ^ r(e,11) ^ r(e,25);
        var ch = (e & f) ^ ((~e) & g);
        var t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = r(a,2) ^ r(a,13) ^ r(a,22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0; H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
    }
    return H.map(function (x) { return (x >>> 0).toString(16).padStart(8, '0'); }).join('');
  }
  async function sha256(message) {
    try {
      if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
        var msgBuffer = new TextEncoder().encode(message);
        var hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      }
    } catch (e) {}
    return sha256JS(message);
  }

  // 验证密码（异步，返回 Promise<boolean>）
  async function verifyPassword(inputPwd) {
    if (!inputPwd) return false;
    var hash = await sha256(inputPwd);
    return hash === PASSWORD_HASH;
  }

  // 会话内是否已通过认证（避免每次点开「获取源」都输密码）
  var _marketUnlocked = false;
  function requireMarketAuth() {
    hikerLog('[requireMarketAuth] 触发获取源密码认证');
    if (_marketUnlocked) { hikerLog('[requireMarketAuth] 已认证，直接打开'); openMarket(); return; }
    var ov = $id('pwdOverlay');
    if (!ov) { hikerLog('[requireMarketAuth] 无密码框，直接打开'); openMarket(); return; } // 兜底：没有密码框直接开
    ov.hidden = false;
    requestAnimationFrame(function () { ov.classList.add('is-visible'); });
    var inp = $id('pwdInput');
    if (inp) { inp.value = ''; setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50); }
    var err = $id('pwdErr'); if (err) err.textContent = '';
  }
  function hidePwdOverlay() {
    var ov = $id('pwdOverlay');
    if (!ov) return;
    ov.classList.remove('is-visible');
    setTimeout(function () { ov.hidden = true; }, 200);
  }
  async function tryUnlock() {
    var inp = $id('pwdInput'); var err = $id('pwdErr');
    var pwd = inp ? inp.value : '';
    if (!pwd) { if (err) err.textContent = '请输入密码'; return; }
    var ok = false;
    try { ok = await verifyPassword(pwd); } catch (e) { ok = false; }
    if (ok) { _marketUnlocked = true; hidePwdOverlay(); openMarket(); }
    else { if (err) err.textContent = '密码错误，请重试'; if (inp) inp.value = ''; }
  }

  /* ---------- 重进时从 market-sources.json（规则根目录）注入已下载的市场源 ---------- */
  function loadFolderSources() {
    // 市场源清单（market-sources.json，规则根目录）只记录源元数据（name/version/file/desc），不再内联完整 JS 文本。
    // 重进时按 file 读取 sources/<file>.js 注入；子目录文件读取不可用时回退到内联 it.js（旧数据兼容）或 localStorage 缓存。
    readManifestData(function (data) {
      var list = (data && data.sources) || [];
      if (!list.length) return;
      list.forEach(function (it) {
        if (!it || !it.file) return;
        var ruleName = getRuleName();
        var fpath = 'hiker://files/data/' + ruleName + '/sources/' + String(it.file).replace(/^\/+/, '');
        var res = readFileSync(fpath);
        var js = (res && res.text) || (it && it.js) || '';
        if (!js) return; // 文件与内联均无，则交由 restoreMarketCache（localStorage 缓存）兜底注入
        try {
          var s = document.createElement('script');
          s.textContent = js;
          document.head.appendChild(s);
        } catch (e) {}
        // 脚本执行（window.DEFAULT_SOURCES.push）后，回填进运行列表 SOURCES 并重渲
        if (window.SVMarket && typeof window.SVMarket.syncFromDefaults === 'function') {
          window.SVMarket.syncFromDefaults();
        }
      });
    }, 'loadFolderSources');
  }

  /* ---------- 下载后同步 market-sources.json（规则根目录），保证重进后自动加载 ---------- */
  function syncLocalManifest(it, fname, jsText) {
    var manifestPath = marketManifestPath();
    // 读-改-写：清单在规则【根目录】 market-sources.json，用 request() 同步读（与 exportSources 读 sources.js 同一可靠机制），
    // 缺失或损坏则当作空清单，追加当前源并 writeFile 写回。
    var res = readFileSync(manifestPath);
    var data; try { data = JSON.parse(res ? res.text : ''); } catch (e) { data = null; }
    if (!data || !Array.isArray(data.sources)) data = { sources: [] };
    var exists = data.sources.some(function (x) { return x.file === fname; });
    if (exists) return;
    // 仅记录源元数据（不内联 js）：重进时由 loadFolderSources 按 file 读取 sources/<file>.js 注入（子目录读取不可用时回退 localStorage 缓存）
    data.sources.push({ name: it.name, version: it.version || '1.0.0', file: fname, desc: it.desc || '' });
    hikerWriteFile(manifestPath, JSON.stringify(data, null, 2));
  }

  /* ---------- 弹窗控制 ---------- */
  var overlayEl, listEl, hintEl;
  function ensureEls() {
    overlayEl = $id('marketOverlay');
    listEl = $id('marketList');
    hintEl = $id('marketHint');
  }
  function openMarket() {
    ensureEls();
    if (!overlayEl) return;
    overlayEl.hidden = false;
    requestAnimationFrame(function () { overlayEl.classList.add('is-visible'); });
    renderDebugLog();
    loadMarketList();
  }
  function closeMarket() {
    if (!overlayEl) return;
    overlayEl.classList.remove('is-visible');
    setTimeout(function () { overlayEl.hidden = true; }, 250);
  }
  function showHint(msg) { if (hintEl) hintEl.textContent = msg; }

  // 诊断日志开关状态（localStorage 持久化，默认关闭）
  function debugLogEnabled() {
    try { var v = localStorage.getItem('_SV_DEBUG_LOG_ON_'); return v == null ? false : (v === '1'); } catch (e) { return false; }
  }
  // 在「通用」页面的诊断日志框（#debugLog）显示 清单 + 内置源 + 导出源 三类诊断，供人工检查路径与内容是否有误
  function renderDebugLog() {
    var box = $id('debugLog');
    if (!box) return; // 通用页未渲染则跳过（仍可经 fy_bridge_app.log / console 查看）
    if (!debugLogEnabled()) { box.style.display = 'none'; return; } // 开关关闭：隐藏且不渲染
    box.style.display = '';
    var diag = window.__manifestDiag;
    var sd = window.__sourcesDiag;
    var ed = window.__exportDiag;
    if (!diag && !sd && !ed) { box.textContent = '（暂无诊断数据，打开本页 / 下载源 / 导出源 后会自动刷新）'; return; }
    var html = '';
    if (diag) {
      var rawStr = diag.raw == null ? 'null（读不到）' : String(diag.raw);
      var preview = rawStr.length > 600 ? rawStr.slice(0, 600) + ' …[已截断, 全文见 console]' : rawStr;
      html +=
        '<b>清单诊断</b><br>' +
        'path: ' + esc(diag.path) + '<br>' +
        'via: ' + esc(diag.via) + ' | raw字长: ' + (diag.raw == null ? 'null' : rawStr.length) + '<br>' +
        'raw预览:<br><pre>' + esc(preview) + '</pre>';
    }
    if (sd) {
      html +=
        '<b>内置源(loadSources)诊断</b><br>' +
        'sources.js 内置源数: ' + sd.defaultLen + '<br>' +
        'localStorage 覆盖: ' + (sd.overrideActive ? ('启用(覆盖数=' + sd.overrideLen + ')') : '未启用') + '<br>' +
        '最终运行源数: ' + sd.finalLen;
    }
    if (ed) {
      html +=
        '<b>导出源(exportSources)诊断</b><br>' +
        'path: ' + esc(ed.path) + '<br>' +
        '采用方法: ' + esc(ed.via) + '<br>' +
        'fullText: ' + esc(ed.fullTextType) + (ed.fullTextType === 'string' ? ' 字长=' + ed.fullTextLen : '') + '<br>' +
        '时间: ' + esc(ed.ts);
    }
    box.innerHTML = html;
  }
  window.SV_renderDebugLog = renderDebugLog; // 暴露给 sv_multi.js 的 exportSources 调用刷新

  function installedNames() {
    // 优先用运行列表（覆盖生效后的 SOURCES），删除后能正确反映「已移除」
    if (window.SVMarket && typeof window.SVMarket.activeNames === 'function') {
      var set = {};
      window.SVMarket.activeNames().forEach(function (n) { if (n) set[n] = true; });
      return set;
    }
    var set2 = {};
    (window.DEFAULT_SOURCES || []).forEach(function (s) { if (s && s.name) set2[s.name] = true; });
    return set2;
  }

  // 远程清单读取：优先 Hiker 原生 request()（专为 http(s) 设计，绕开 WebView fetch 跨域/CORS 限制），
  // 失败回退标准 fetch（浏览器预览）。返回 Promise<string>。
  function readRemoteText(url) {
    return new Promise(function (resolve, reject) {
      try {
        if (typeof request === 'function') {
          var t = request(url);
          if (t != null && String(t).length) { hikerLog('[manifest] 经 request() 读到 ' + String(t).length + ' 字节'); resolve(String(t)); return; }
        }
      } catch (e) { hikerLog('[manifest] request() 失败: ' + (e && e.message)); }
      fetch(url, { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(resolve)
        .catch(reject);
    });
  }

  /* ---------- 加载远程清单并渲染列表 ---------- */
  function loadMarketList() {
    if (!listEl) return;
    if (!SOURCE_MANIFEST_URL) {
      listEl.innerHTML = '<div class="sv-market-err">未配置远程清单地址。<br>请在 sourceMarket.js 顶部设置 SOURCE_MANIFEST_URL。</div>';
      return;
    }
    listEl.innerHTML = '<div class="sv-market-loading">加载中…</div>';
    hikerLog('[loadMarketList] 读取远程清单: ' + SOURCE_MANIFEST_URL);
    readRemoteText(SOURCE_MANIFEST_URL)
      .then(function (text) {
        var data; try { data = JSON.parse(text); } catch (e) { throw new Error('清单 JSON 解析失败: ' + (e && e.message)); }
        var arr = (data && data.sources) || [];
        if (!arr.length) { listEl.innerHTML = '<div class="sv-market-err">清单为空。</div>'; return; }
        var installed = installedNames();
        listEl.innerHTML = '';
        arr.forEach(function (it) {
          if (!it || !it.name) return;
          var row = document.createElement('div');
          row.className = 'sv-market-row' + (installed[it.name] ? ' is-installed' : '');
          var meta = '<span class="sv-market-tag">v' + esc(it.version || '?') + '</span>' + esc(it.desc || '');
          row.innerHTML =
            '<div class="sv-market-info">' +
              '<div class="sv-market-name">' + esc(it.name) + '</div>' +
              '<div class="sv-market-meta">' + meta + '</div>' +
            '</div>';
          var dl = document.createElement('button');
          dl.className = 'sv-market-dl';
          dl.type = 'button';
          if (installed[it.name]) {
            // 已安装：显示「已安装」标签 + 删除按钮（动态加载的源不允许编辑，仅支持删除）
            var tag = document.createElement('span');
            tag.className = 'sv-market-installed';
            tag.textContent = '已安装';
            row.appendChild(tag);
            var del = document.createElement('button');
            del.className = 'sv-market-del';
            del.type = 'button';
            del.textContent = '删除';
            del.addEventListener('click', function () { removeInstalledSource(it, del); });
            row.appendChild(del);
          } else {
            dl.textContent = '下载';
            dl.addEventListener('click', function () { downloadSource(it, dl); });
            row.appendChild(dl);
          }
          listEl.appendChild(row);
        });
      })
      .catch(function (e) {
        listEl.innerHTML = '<div class="sv-market-err">加载失败：' + esc(e && e.message || e) +
          '<br>请检查 SOURCE_MANIFEST_URL 是否正确、且地址允许跨域(CORS)。</div>';
      });
  }

  /* ---------- Hiker 文件 API 兼容层（参考 exportSources） ---------- */
  function getRuleName() {
    var n = '';
    // 与 exportSources 用同一目录：优先 fba/fy_bridge_app.getVar('小程序名')（已实测该目录名能读到 sources.js）
    try { if (typeof fba !== 'undefined' && fba && typeof fba.getVar === 'function') n = fba.getVar('小程序名') || ''; } catch (e) {}
    try { if (!n && typeof fy_bridge_app !== 'undefined' && fy_bridge_app && typeof fy_bridge_app.getVar === 'function') n = fy_bridge_app.getVar('小程序名') || ''; } catch (e) {}
    // 回退：网页目录即 hiker://files/data/<MY_RULE.title>/
    try { if (!n && typeof MY_RULE !== 'undefined' && MY_RULE && MY_RULE.title) n = MY_RULE.title; } catch (e) {}
    if (!n) n = 'short-video-feed';
    return n;
  }
  function hikerWriteFile(path, content) {
    if (window.fy_bridge_app && typeof window.fy_bridge_app.writeFile === 'function') { window.fy_bridge_app.writeFile(path, content); return true; }
    if (window.fba && typeof window.fba.writeFile === 'function') { window.fba.writeFile(path, content); return true; }
    return false;
  }
  function hikerDeleteFile(path) {
    if (window.fy_bridge_app && typeof window.fy_bridge_app.deleteFile === 'function') { window.fy_bridge_app.deleteFile(path); return true; }
    if (window.fba && typeof window.fba.deleteFile === 'function') { window.fba.deleteFile(path); return true; }
    return false;
  }
  // 实测：本环境 fy_bridge_app.readFile 为【同步】返回字符串，统一用其同步读取规则根目录文件。
  function hikerReadFile(path) {
    try { if (window.fy_bridge_app && typeof window.fy_bridge_app.readFile === 'function') { var r = window.fy_bridge_app.readFile(path); if (r != null) return r; } } catch (e) {}
    try { if (window.fba && typeof window.fba.readFile === 'function') { var r2 = window.fba.readFile(path); if (r2 != null) return r2; } } catch (e) {}
    return null;
  }
  // 同步读取规则根目录文件：fy_bridge_app.readFile 优先（已实测同步返回字符串，与 exportSources 读 sources.js 同一可靠机制），
  // 回退 fba.readFile、request()、fetch（仅浏览器预览）。返回 { text, via } 或 null。
  function readFileSync(path) {
    try { if (window.fy_bridge_app && typeof window.fy_bridge_app.readFile === 'function') { var r = window.fy_bridge_app.readFile(path); if (r != null && String(r).length) return { text: String(r), via: 'readFile(fy_bridge_app)' }; } } catch (e) {}
    try { if (window.fba && typeof window.fba.readFile === 'function') { var r2 = window.fba.readFile(path); if (r2 != null && String(r2).length) return { text: String(r2), via: 'readFile(fba)' }; } } catch (e) {}
    try { if (typeof request === 'function') { var t = request(path); if (t != null && String(t).length) return { text: String(t), via: 'request' }; } } catch (e) {}
    return null;
  }
  // 统一读取「本地清单」：readFileSync（readFile 优先，与 exportSources 读 sources.js 同一机制）为主路径，
  // 失败则降级 fetch（仅浏览器预览/无桥时）。始终输出诊断：{ path, via, raw, parsed }。
  function readManifestData(cb, debugLabel) {
    var path = marketManifestPath();
    function emit(via, raw, parsed) {
      var diag = { path: path, via: via, raw: raw, parsed: parsed, label: debugLabel || '' };
      window.__manifestDiag = diag;
      
      cb(parsed);
    }
    // 主路径：readFileSync 同步读（readFile 优先，可靠）
    var res = readFileSync(path);
    if (res && res.text != null) {
      var sd; try { sd = JSON.parse(res.text); } catch (e) { sd = null; }
      emit(res.via, res.text, sd);
      return;
    }
    // 次路径：文件 API readFile（仅当其为同步字符串；异步 Promise 会被下述 typeof 判定跳过）
    var apiRaw = hikerReadFile(path);
    if (apiRaw != null && typeof apiRaw === 'string' && apiRaw.length) {
      var ad; try { ad = JSON.parse(apiRaw); } catch (e) { ad = null; }
      emit('fileApi', apiRaw, ad);
      return;
    }
    // 兜底：浏览器预览时 fetch 根目录相对路径
    fetchText(LOCAL_MANIFEST)
      .then(function (t) { var dd; try { dd = JSON.parse(t); } catch (e) { dd = null; } emit('fetch', t, dd); })
      .catch(function () { emit('none', null, null); });
  }
  // 从本地（hiker 规则目录）manifest 移除某项，避免刷新后被 loadFolderSources 重新加载
  function removeFromLocalManifest(file) {
    try {
      var manifestPath = marketManifestPath();
      var res = readFileSync(manifestPath); // readFile 优先同步读
      if (!res || !res.text) return;
      var data; try { data = JSON.parse(res.text); } catch (e) { return; }
      if (!data || !Array.isArray(data.sources)) return;
      var before = data.sources.length;
      data.sources = data.sources.filter(function (x) { return x.file !== file; });
      if (data.sources.length !== before) hikerWriteFile(manifestPath, JSON.stringify(data, null, 2));
    } catch (e) {}
  }
  /* ---------- 下载源 localStorage 缓存（冗余兜底：文件读取异常时仍能恢复） ---------- */
  var MARKET_CACHE_KEY = '_SV_MARKET_CACHE_';
  function loadMarketCache() {
    try { var raw = localStorage.getItem(MARKET_CACHE_KEY); if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr)) return arr; } } catch (e) {}
    return [];
  }
  function saveMarketCache(list) {
    try { localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function cacheMarketSource(it, jsText) {
    var list = loadMarketCache().filter(function (x) { return x.name !== it.name; }); // 按 name 去重
    list.push({ name: it.name, file: it.file, url: it.url, version: it.version || '1.0.0', desc: it.desc || '', js: jsText });
    saveMarketCache(list);
  }
  function uncacheMarketSource(name) {
    saveMarketCache(loadMarketCache().filter(function (x) { return x.name !== name; }));
  }
  // 冗余兜底：若 hiker 文件读取异常（如根目录清单读不到），用缓存的 .js 文本直接注入恢复
  function restoreMarketCache() {
    loadMarketCache().forEach(function (it) {
      if (!it || !it.js || installedNames()[it.name]) return;
      try { var s = document.createElement('script'); s.textContent = it.js; document.head.appendChild(s); } catch (e) {}
      if (window.SVMarket && typeof window.SVMarket.syncFromDefaults === 'function') window.SVMarket.syncFromDefaults();
    });
  }

  function fetchText(url) {
    // 先试 Hiker 原生 request()（专为 http(s)，绕开 WebView fetch 跨域限制）；返回空则回退 fetch
    if (typeof request === 'function') {
      try {
        var t = request(url);
        if (t != null && String(t).length) { hikerLog('[fetchText] 经 request() 读到 ' + String(t).length + ' 字节'); return Promise.resolve(String(t)); }
      } catch (e) { hikerLog('[fetchText] request() 失败: ' + (e && e.message)); }
    }
    if (typeof fetch === 'function') {
      return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
    }
    return Promise.reject(new Error('无可用网络 API'));
  }
  function fallbackBlobDownload(text, fname, btn) {
    try {
      var blob = new Blob([text], { type: 'text/javascript' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      btn.textContent = '已下载';
      btn.classList.add('is-done');
      showHint('已下载 ' + fname + '：请将其放入 sources/ 文件夹，并在 sources/manifest.json 添加对应项，刷新后自动加载。');
    } catch (e) {
      btn.disabled = false; btn.textContent = '下载';
      showHint('无法写入 hiker 文件且浏览器下载失败：' + String(e && e.message || e));
    }
  }

  /* ---------- 下载源并写入 hiker 规则目录 ---------- */
  function downloadSource(it, btn) {
    var url = it.url;
    if (!url) { showHint('该源缺少下载地址（url）。'); return; }
    btn.disabled = true;
    btn.textContent = '下载中…';
    fetchText(url)
      .then(function (text) {
        var fname = it.file || (String(it.name || 'source').replace(/\s+/g, '_') + '.js');
        var ruleName = getRuleName();
        // 源 .js 落盘到 sources/ 子目录（Hiker 自动创建），deleteFile 可真实删除
        var target = 'hiker://files/data/' + ruleName + '/sources/' + String(fname).replace(/^\/+/, '');
        var ok = hikerWriteFile(target, text);
        if (ok) {
          // 清单仅记录源元数据（不内联 js）；重进后由 loadFolderSources 按 file 读取 sources/<file>.js 注入
          syncLocalManifest(it, fname, text);
          cacheMarketSource(it, text);  // 冗余兜底：文件读取异常时仍能恢复
          // 动态加载：仅当尚未安装时注入脚本，使当前会话立即生效（不重复注册）
          if (!installedNames()[it.name]) {
            try { var s = document.createElement('script'); s.textContent = text; document.head.appendChild(s); } catch (e) {}
            // 脚本执行（window.DEFAULT_SOURCES.push）后回填进运行列表，立即出现在源选择器
            if (window.SVMarket && typeof window.SVMarket.syncFromDefaults === 'function') {
              window.SVMarket.syncFromDefaults();
            }
          }
          if (installedNames()[it.name]) {
            btn.textContent = '已安装'; btn.disabled = true; btn.classList.remove('is-done');
          } else {
            btn.textContent = '已下载'; btn.classList.add('is-done');
          }
          showHint('✅ 已下载「' + it.name + '」（已写入 sources/，退出重进自动加载）');
          renderDebugLog();
        } else {
          // 无 Hiker 文件 API（如纯浏览器预览）→ 降级为浏览器下载
          fallbackBlobDownload(text, fname, btn);
        }
      })
      .catch(function (e) {
        btn.disabled = false;
        btn.textContent = '下载';
        showHint('下载失败：' + String(e && e.message || e) + '（需同源或允许跨域）');
      });
  }

  /* ---------- 删除已安装（动态加载）的源 ---------- */
  function removeInstalledSource(it, btn) {
    btn.disabled = true;
    btn.textContent = '删除中…';
    var ok = false;
    if (window.SVMarket && typeof window.SVMarket.removeByName === 'function') {
      ok = window.SVMarket.removeByName(it.name);
    }
    if (ok) {
      // 同时删除本地文件 + 本地 manifest 条目，避免刷新后被 loadFolderSources 重新加载
      var fname = it.file || (String(it.name || 'source').replace(/\s+/g, '_') + '.js');
      var filePath = 'hiker://files/data/' + getRuleName() + '/sources/' + String(fname).replace(/^\/+/, '');
      hikerDeleteFile(filePath);
      removeFromLocalManifest(fname);
      uncacheMarketSource(it.name); // 同时清除 localStorage 缓存，退出重进不再恢复
      showHint('已移除「' + it.name + '」（本地文件与清单已删除，刷新不会再次出现）');
      renderDebugLog();
      loadMarketList(); // 重新渲染：该源恢复为「下载」状态
    } else {
      btn.disabled = false;
      btn.textContent = '删除';
      showHint('移除失败：当前运行列表中未找到「' + it.name + '」。');
    }
  }

  /* ---------- 初始化 ---------- */
  function init() {
    loadFolderSources();       // 重进时从 market-sources.json（根目录）注入已下载的市场源（主路径）
    // 兜底：确保经 document.write 注入的本地文件源（sources/*.js）也并入运行列表 SOURCES
    // （market-sources.json 为空时 loadFolderSources 会早退，不会触发 syncFromDefaults）
    if (window.SVMarket && typeof window.SVMarket.syncFromDefaults === 'function') window.SVMarket.syncFromDefaults();
    restoreMarketCache();      // 冗余兜底：文件读取异常时仍可恢复（不依赖文件加载）
    renderDebugLog();          // 初始化后即把清单 + 内置源诊断渲染到通用页日志框
    var btn = $id('marketBtn');
    if (btn) btn.addEventListener('click', requireMarketAuth); // 获取源需先过密码认证
    var close = $id('marketClose');
    if (close) close.addEventListener('click', closeMarket);
    var ref = $id('marketRefresh');
    if (ref) ref.addEventListener('click', loadMarketList);
    if (overlayEl) overlayEl.addEventListener('click', function (e) { if (e.target === overlayEl) closeMarket(); });
    // 密码认证弹窗交互
    var pwdOk = $id('pwdOk'); if (pwdOk) pwdOk.addEventListener('click', tryUnlock);
    var pwdCancel = $id('pwdCancel'); if (pwdCancel) pwdCancel.addEventListener('click', hidePwdOverlay);
    var pwdInput = $id('pwdInput');
    if (pwdInput) pwdInput.addEventListener('keydown', function (e) { if (e && e.key === 'Enter') tryUnlock(); });
    var pwdOv = $id('pwdOverlay');
    if (pwdOv) pwdOv.addEventListener('click', function (e) { if (e.target === pwdOv) hidePwdOverlay(); });
    // 诊断日志开关
    var dbgToggle = $id('debugLogToggle');
    if (dbgToggle) {
      dbgToggle.checked = debugLogEnabled();
      dbgToggle.addEventListener('change', function () {
        try { localStorage.setItem('_SV_DEBUG_LOG_ON_', dbgToggle.checked ? '1' : '0'); } catch (e) {}
        renderDebugLog();
      });
    }
    // 打开「通用」标签页时刷新诊断日志（数据可能在后台已更新）
    var genTab = document.querySelector('.sv-set-tab[data-tab="general"]');
    if (genTab) genTab.addEventListener('click', function () {
      if (dbgToggle) dbgToggle.checked = debugLogEnabled(); // 同步开关状态
      renderDebugLog();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
