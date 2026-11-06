(() => {
  'use strict';

  const ID = 'mobileconsole-devtools';
  const existing = document.getElementById(ID);
  if (existing) {
    existing.host.style.display = 'block';
    existing.host.querySelector('.mc-panel').style.display = 'flex';
    return;
  }

  const host = document.createElement('div');
  host.id = ID;
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; color-scheme: dark; }
    * { box-sizing: border-box; }
    .mc-panel {
      position: fixed; z-index: 2147483647; top: 8px; left: 3vw;
      width: 94vw; height: min(78vh, 680px); min-height: 280px;
      display: flex; flex-direction: column; overflow: hidden;
      background: #17191f; color: #e7eaf0; border: 1px solid #454b57;
      border-radius: 12px; box-shadow: 0 12px 42px #0009;
      font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      touch-action: none;
    }
    button, input, textarea { font: inherit; }
    button { color: inherit; background: #292d36; border: 1px solid #454b57; border-radius: 6px; padding: 6px 9px; }
    button:active { background: #3a4150; }
    .mc-head { display:flex; align-items:center; gap:8px; padding:9px 10px; background:#222630; border-bottom:1px solid #3b414c; touch-action:pan-y; }
    .mc-brand { font-weight:700; color:#8ab4f8; flex:1; user-select:none; }
    .mc-tabs { display:flex; gap:6px; padding:8px; border-bottom:1px solid #353b46; }
    .mc-tabs button.active { background:#34445f; border-color:#7198d2; color:#fff; }
    .mc-body { display:flex; flex:1; min-height:0; }
    .mc-console { display:flex; flex-direction:column; flex:1; min-width:0; min-height:0; }
    .mc-output { flex:1; overflow:auto; padding:7px; overscroll-behavior:contain; touch-action:pan-y; }
    .mc-line { padding:5px 6px; border-bottom:1px solid #2b3039; white-space:pre-wrap; overflow-wrap:anywhere; }
    .mc-line.error { color:#ff8b8b; } .mc-line.warn { color:#ffd479; } .mc-line.info { color:#8ab4f8; }
    .mc-input { border-top:1px solid #3b414c; padding:8px; display:flex; gap:6px; }
    .mc-input textarea { flex:1; min-width:0; min-height:58px; resize:vertical; color:#e7eaf0; background:#101216; border:1px solid #454b57; border-radius:6px; padding:8px; outline:none; }
    .mc-sources { display:flex; flex:1; min-height:0; }
    .mc-files { width:40%; max-width:190px; overflow:auto; border-right:1px solid #3b414c; touch-action:pan-y; }
    .mc-file { display:block; width:100%; text-align:left; border:0; border-radius:0; border-bottom:1px solid #2d323b; background:transparent; overflow-wrap:anywhere; }
    .mc-file.selected { background:#34445f; }
    .mc-source-view { flex:1; min-width:0; overflow:auto; padding:8px; touch-action:pan-y; }
    pre { margin:0; white-space:pre; font:12px/1.5 ui-monospace,monospace; }
    .mc-muted { color:#aab2c0; padding:10px; }
    .mc-hidden { display:none !important; }
    .mc-reopen { position:fixed; z-index:2147483647; right:12px; bottom:18px; border-radius:22px; background:#26364f; border:1px solid #7198d2; padding:10px 14px; box-shadow:0 4px 16px #0008; }
    @media (min-width:700px) { .mc-panel { width: min(720px, 92vw); left: max(4vw, calc((100vw - 720px)/2)); } }
  `;
  shadow.append(style);

  const panel = document.createElement('section');
  panel.className = 'mc-panel';
  panel.innerHTML = `
    <div class="mc-head"><span class="mc-brand">◈ MobileConsole</span><button class="mc-min" aria-label="Minimize">—</button><button class="mc-close" aria-label="Close">×</button></div>
    <div class="mc-tabs"><button class="active" data-tab="console">Console</button><button data-tab="sources">Sources</button><span style="flex:1"></span><button class="mc-clear">Clear</button></div>
    <div class="mc-body">
      <div class="mc-console">
        <div class="mc-output" aria-live="polite"><div class="mc-muted">Console ready. Enter JavaScript below.</div></div>
        <div class="mc-input"><textarea spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="JavaScript…"></textarea><button class="mc-run">Run</button></div>
      </div>
      <div class="mc-sources mc-hidden">
        <div class="mc-files"><div class="mc-muted">Loading files…</div></div>
        <div class="mc-source-view"><div class="mc-muted">Choose a source file.</div></div>
      </div>
    </div>`;
  shadow.append(panel);
  const reopen = document.createElement('button');
  reopen.className = 'mc-reopen mc-hidden';
  reopen.textContent = '◈ DevTools';
  shadow.append(reopen);
  const q = s => shadow.querySelector(s);
  const output = q('.mc-output');
  const input = q('textarea');
  const filesBox = q('.mc-files');
  const sourceView = q('.mc-source-view');
  let activeTab = 'console';
  const originals = {};
  let selectedFile = null;

  function format(value) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.stack || value.message;
    if (value === undefined) return 'undefined';
    try { return JSON.stringify(value, (k, v) => typeof v === 'bigint' ? String(v) + 'n' : v, 2) ?? String(value); }
    catch (_) { return Object.prototype.toString.call(value); }
  }
  function log(text, type) {
    const line = document.createElement('div');
    line.className = 'mc-line ' + (type || 'log');
    line.textContent = text;
    output.append(line);
    output.scrollTop = output.scrollHeight;
  }
  ['log', 'info', 'warn', 'error', 'debug'].forEach(method => {
    originals[method] = window.console[method];
    window.console[method] = function (...args) {
      try { log(args.map(format).join(' '), method === 'debug' ? 'info' : method); } catch (_) {}
      return originals[method].apply(window.console, args);
    };
  });
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  function onError(e) { log('Uncaught: ' + (e.message || 'Script error') + (e.filename ? '\\n' + e.filename + ':' + e.lineno : ''), 'error'); }
  function onRejection(e) { log('Unhandled promise rejection: ' + format(e.reason), 'error'); }

  function run() {
    const code = input.value.trim();
    if (!code) return;
    log('› ' + code, 'info');
    try {
      const result = window.eval(code);
      if (result && typeof result.then === 'function') result.then(v => { if (v !== undefined) log(format(v)); }).catch(e => log(format(e), 'error'));
      else if (result !== undefined) log(format(result));
    } catch (e) { log(format(e), 'error'); }
  }
  q('.mc-run').addEventListener('click', run);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); }
  });
  q('.mc-clear').addEventListener('click', () => { output.replaceChildren(); });
  q('.mc-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    activeTab = tab.dataset.tab;
    q('.mc-console').classList.toggle('mc-hidden', activeTab !== 'console');
    q('.mc-sources').classList.toggle('mc-hidden', activeTab !== 'sources');
    shadow.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === tab));
    q('.mc-clear').classList.toggle('mc-hidden', activeTab !== 'console');
    if (activeTab === 'sources' && !filesBox.dataset.loaded) loadSources();
  });

  async function loadSources() {
    filesBox.dataset.loaded = '1';
    filesBox.replaceChildren();
    const entries = [];
    document.querySelectorAll('script').forEach((el, i) => entries.push({
      label: el.src || '[inline script ' + (i + 1) + ']',
      kind: 'JavaScript',
      url: el.src,
      text: el.src ? null : el.textContent
    }));
    document.querySelectorAll('link[rel~="stylesheet"], style').forEach((el, i) => entries.push({
      label: el.href || '[inline style ' + (i + 1) + ']',
      kind: 'CSS',
      url: el.href || null,
      text: el.href ? null : el.textContent
    }));
    if (!entries.length) filesBox.innerHTML = '<div class="mc-muted">No script or stylesheet elements found.</div>';
    entries.forEach((entry, i) => {
      const b = document.createElement('button');
      b.className = 'mc-file';
      b.textContent = (entry.kind === 'CSS' ? '🎨 ' : 'JS ') + entry.label;
      b.addEventListener('click', () => showSource(entry, b));
      filesBox.append(b);
      if (i === 0) showSource(entry, b);
    });
  }
  async function showSource(entry, button) {
    selectedFile = entry;
    filesBox.querySelectorAll('.mc-file').forEach(b => b.classList.toggle('selected', b === button));
    sourceView.replaceChildren();
    const status = document.createElement('div');
    status.className = 'mc-muted';
    status.textContent = entry.url ? 'Loading source…' : entry.kind + ' · inline';
    sourceView.append(status);
    let text = entry.text || '';
    if (entry.url) {
      try {
        const response = await fetch(entry.url, { credentials: 'same-origin' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        text = await response.text();
      } catch (e) {
        status.textContent = 'Could not fetch this file (often blocked by cross-origin restrictions). Open source: ' + entry.url;
        const link = document.createElement('a');
        link.href = entry.url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Open source in new tab';
        link.style.color = '#8ab4f8'; sourceView.append(link);
        return;
      }
    }
    status.textContent = entry.kind + ' · ' + text.length.toLocaleString() + ' characters';
    const pre = document.createElement('pre');
    pre.textContent = text || '(empty source)';
    sourceView.replaceChildren(status, pre);
  }

  function close() {
    ['log','info','warn','error','debug'].forEach(m => { if (originals[m]) window.console[m] = originals[m]; });
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
    host.remove();
  }
  q('.mc-close').addEventListener('click', close);
  q('.mc-min').addEventListener('click', () => { panel.classList.add('mc-hidden'); reopen.classList.remove('mc-hidden'); });
  reopen.addEventListener('click', () => { panel.classList.remove('mc-hidden'); reopen.classList.add('mc-hidden'); });

  const head = q('.mc-head');
  let drag = null;
  head.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const rect = panel.getBoundingClientRect();
    drag = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
    head.setPointerCapture(e.pointerId);
  });
  head.addEventListener('pointermove', e => {
    if (!drag) return;
    panel.style.left = Math.max(0, Math.min(innerWidth - panel.offsetWidth, drag.left + e.clientX - drag.x)) + 'px';
    panel.style.top = Math.max(0, Math.min(innerHeight - 100, drag.top + e.clientY - drag.y)) + 'px';
  });
  head.addEventListener('pointerup', () => { drag = null; });
  head.addEventListener('pointercancel', () => { drag = null; });

  host.host = host;
  document.documentElement.append(host);
  log('MobileConsole loaded on ' + location.host, 'info');
})();