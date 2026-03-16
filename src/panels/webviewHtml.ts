export function getWebviewHtml(): string {
  const nonce = getNonce();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src data:;">
  <title>Infinite Terminal</title>
  <style>${CSS_CONTENT}</style>
</head>
<body>
  <div id="canvas-container">
    <div id="canvas"></div>
  </div>

  <!-- Toolbar -->
  <div id="toolbar">
    <button class="toolbar-btn" id="btn-new-terminal" title="New Terminal (Ctrl+Shift+N)">⬛ New</button>
    <button class="toolbar-btn" id="btn-new-worktree" title="Git Worktree">🌿 Worktree</button>
    <button class="toolbar-btn" id="btn-worktree-list" title="Manage Worktrees">📋 Trees</button>
    <div class="toolbar-sep"></div>
    <button class="toolbar-btn" id="btn-search" title="Search Terminals (Ctrl+P)">🔍 Search</button>
    <button class="toolbar-btn" id="btn-fit-all" title="Fit All">⊞ Fit</button>
    <button class="toolbar-btn" id="btn-reset-zoom">🔍 100%</button>
    <div class="toolbar-sep"></div>
    <button class="toolbar-btn" id="btn-preset-mgr" title="Manage Presets">⚙️ Presets</button>
    <button class="toolbar-btn" id="btn-office-view" title="Pixel Office View">🏢 Office</button>
  </div>

  <!-- Preset Dock -->
  <div id="preset-dock"></div>

  <!-- Minimap -->
  <div id="minimap"><canvas id="minimap-canvas"></canvas></div>

  <!-- Zoom Indicator -->
  <div id="zoom-indicator">100%</div>

  <!-- Search Modal -->
  <div id="search-modal" class="modal">
    <div class="modal-content search-modal-content">
      <input id="search-input" type="text" placeholder="Search terminals by name..." autofocus />
      <div id="search-results"></div>
    </div>
  </div>

  <!-- Preset Manager Modal -->
  <div id="preset-modal" class="modal">
    <div class="modal-content">
      <h3>Manage Presets</h3>
      <div id="preset-list"></div>
      <div class="modal-form">
        <input id="preset-name-input" type="text" placeholder="Name" />
        <input id="preset-cmd-input" type="text" placeholder="Command (empty = shell)" />
        <select id="preset-icon-input">
          <option value="terminal">⬛ Terminal</option>
          <option value="code">📝 Code</option>
          <option value="edit">✏️ Edit</option>
          <option value="server">🖥️ Server</option>
          <option value="database">🗄️ Database</option>
        </select>
        <button class="modal-btn" id="preset-add-btn">Add Preset</button>
      </div>
      <div class="modal-actions">
        <button class="modal-btn" id="preset-save-btn">Save & Close</button>
        <button class="modal-btn modal-btn-secondary" id="preset-cancel-btn">Cancel</button>
      </div>
    </div>
  </div>

  <!-- Worktree Manager Modal -->
  <div id="worktree-modal" class="modal">
    <div class="modal-content">
      <h3>Git Worktrees</h3>
      <div id="worktree-list"></div>
      <div class="modal-actions">
        <button class="modal-btn" id="worktree-new-btn">🌿 New Worktree</button>
        <button class="modal-btn modal-btn-secondary" id="worktree-close-btn">Close</button>
      </div>
    </div>
  </div>

  <!-- Office View Overlay -->
  <div id="office-view">
    <canvas id="office-canvas"></canvas>
    <div id="office-toolbar">
      <button class="toolbar-btn" id="btn-close-office">← Canvas</button>
      <button class="toolbar-btn" id="btn-new-terminal-office">⬛ New Terminal</button>
    </div>
  </div>

  <!-- Connection lines SVG layer -->
  <svg id="connection-svg"></svg>

  <script nonce="${nonce}">${JS_CONTENT}</script>
</body>
</html>`;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// ============================================================
// CSS
// ============================================================
const CSS_CONTENT = /*css*/ `
:root {
  --bg: #1e1e1e; --surface: #252526; --border: #3c3c3c;
  --text: #cccccc; --accent: #007acc; --accent2: #1a8ad4;
  --term-bg: #0e0e0e; --header-bg: #2d2d2d;
  --danger: #f44747; --success: #4ec9b0; --warning: #dcdcaa;
  --grid: rgba(255,255,255,0.03);
}
* { margin:0; padding:0; box-sizing:border-box; }
body {
  background: var(--bg); color: var(--text);
  font-family: 'Segoe UI', system-ui, sans-serif;
  overflow: hidden; width: 100vw; height: 100vh; user-select: none;
}

/* Canvas */
#canvas-container { width:100%; height:100%; position:relative; overflow:hidden; cursor:grab; }
#canvas-container.dragging-canvas { cursor:grabbing; }
#canvas-container.dragging-terminal { cursor:move; }
#canvas { position:absolute; top:0; left:0; transform-origin:0 0; }

/* Connection SVG */
#connection-svg {
  position:absolute; top:0; left:0; width:100%; height:100%;
  pointer-events:none; z-index:0; overflow:visible;
}
#connection-svg line {
  stroke: var(--accent); stroke-width: 2; stroke-dasharray: 6 4;
  opacity: 0.5;
}

/* Toolbar */
#toolbar {
  position:fixed; top:10px; left:50%; transform:translateX(-50%);
  display:flex; gap:4px; background:var(--surface); border:1px solid var(--border);
  border-radius:8px; padding:5px 8px; z-index:1000;
  box-shadow:0 4px 16px rgba(0,0,0,0.4);
}
.toolbar-btn {
  background:transparent; border:1px solid transparent; color:var(--text);
  padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;
  display:flex; align-items:center; gap:3px; transition:all 0.15s; white-space:nowrap;
}
.toolbar-btn:hover { background:var(--border); border-color:var(--accent); }
.toolbar-sep { width:1px; background:var(--border); margin:2px 3px; }

/* Terminal Card */
.terminal-card {
  position:absolute; min-width:350px; min-height:220px;
  background:var(--surface); border:1px solid var(--border); border-radius:8px;
  overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.5);
  display:flex; flex-direction:column; transition:box-shadow 0.2s;
}
.terminal-card:hover { box-shadow:0 6px 28px rgba(0,0,0,0.6); }
.terminal-card.focused { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent),0 6px 28px rgba(0,0,0,0.6); }

.terminal-header {
  display:flex; align-items:center; padding:5px 8px;
  background:var(--header-bg); cursor:move; gap:6px; flex-shrink:0;
}
.terminal-status {
  width:9px; height:9px; border-radius:50%; background:var(--success); flex-shrink:0;
  transition: background 0.3s;
}
.terminal-status.idle { background:var(--warning); }
.terminal-status.dead { background:var(--danger); }

.terminal-title {
  flex:1; font-size:12px; font-weight:500; overflow:hidden;
  text-overflow:ellipsis; white-space:nowrap; cursor:text;
}
.terminal-title:hover { text-decoration: underline dotted; }
.terminal-title-input {
  flex:1; font-size:12px; font-weight:500; background:var(--term-bg);
  border:1px solid var(--accent); color:var(--text); padding:1px 4px;
  border-radius:3px; outline:none;
}
.terminal-cwd {
  font-size:10px; color:#888; max-width:180px; overflow:hidden;
  text-overflow:ellipsis; white-space:nowrap;
}
.terminal-close {
  background:transparent; border:none; color:#888; cursor:pointer;
  font-size:14px; padding:2px 4px; border-radius:3px; line-height:1;
}
.terminal-close:hover { background:var(--danger); color:white; }

/* Terminal Body - ANSI renderer */
.terminal-body {
  flex:1; background:var(--term-bg); padding:4px 6px;
  font-family:'Cascadia Code','Fira Code','Consolas','Courier New',monospace;
  font-size:13px; line-height:1.35; overflow-y:auto; overflow-x:hidden;
  white-space:pre-wrap; word-break:break-all; color:#d4d4d4;
  position:relative; cursor:text;
}
.terminal-body:focus { outline:none; }
.terminal-body .cursor-block {
  display:inline-block; width:7px; height:14px; background:var(--text);
  animation:blink 1s step-end infinite; vertical-align:text-bottom;
}
@keyframes blink { 50%{opacity:0;} }

/* Resize handle */
.terminal-resize {
  position:absolute; bottom:0; right:0; width:16px; height:16px;
  cursor:nwse-resize; opacity:0; transition:opacity 0.2s;
}
.terminal-card:hover .terminal-resize { opacity:1; }
.terminal-resize::after {
  content:''; position:absolute; right:3px; bottom:3px;
  width:8px; height:8px; border-right:2px solid #666; border-bottom:2px solid #666;
}

/* Minimap */
#minimap {
  position:fixed; bottom:16px; right:16px; width:200px; height:150px;
  background:rgba(30,30,30,0.92); border:1px solid var(--border); border-radius:6px;
  z-index:999; overflow:hidden; opacity:0; transform:scale(0.9) translateY(10px);
  transition:opacity 0.25s,transform 0.25s; pointer-events:none;
}
#minimap.visible { opacity:1; transform:scale(1) translateY(0); }
#minimap canvas { width:100%; height:100%; }

/* Preset Dock */
#preset-dock {
  position:fixed; bottom:16px; left:50%; transform:translateX(-50%);
  display:flex; gap:6px; background:var(--surface); border:1px solid var(--border);
  border-radius:12px; padding:6px 12px; z-index:1000;
  box-shadow:0 4px 16px rgba(0,0,0,0.4);
}
.preset-btn {
  display:flex; flex-direction:column; align-items:center; gap:2px;
  background:transparent; border:1px solid transparent; color:var(--text);
  padding:6px 12px; border-radius:8px; cursor:pointer; font-size:11px;
  transition:all 0.15s;
}
.preset-btn:hover { background:var(--border); border-color:var(--accent); transform:translateY(-2px); }
.preset-icon { font-size:18px; }

/* Zoom Indicator */
#zoom-indicator {
  position:fixed; bottom:16px; left:16px; background:var(--surface);
  border:1px solid var(--border); border-radius:6px; padding:3px 8px;
  font-size:11px; z-index:999; opacity:0.6;
}

/* Modals */
.modal {
  position:fixed; top:0; left:0; width:100%; height:100%;
  background:rgba(0,0,0,0.6); z-index:3000; display:none;
  justify-content:center; align-items:flex-start; padding-top:80px;
}
.modal.visible { display:flex; }
.modal-content {
  background:var(--surface); border:1px solid var(--border); border-radius:10px;
  padding:16px 20px; min-width:400px; max-width:550px; max-height:70vh;
  overflow-y:auto; box-shadow:0 8px 32px rgba(0,0,0,0.6);
}
.modal-content h3 { margin-bottom:12px; font-size:15px; }
.search-modal-content { padding:8px; min-width:450px; }
#search-input, .modal-content input, .modal-content select {
  width:100%; padding:8px 12px; background:var(--term-bg);
  border:1px solid var(--border); color:var(--text); border-radius:6px;
  font-size:14px; outline:none; margin-bottom:6px;
}
#search-input:focus, .modal-content input:focus { border-color:var(--accent); }
#search-results { max-height:300px; overflow-y:auto; }
.search-result {
  padding:8px 12px; cursor:pointer; border-radius:4px; display:flex;
  align-items:center; gap:8px; font-size:13px;
}
.search-result:hover, .search-result.selected { background:var(--border); }
.search-result .sr-name { flex:1; font-weight:500; }
.search-result .sr-cwd { font-size:11px; color:#888; }
.search-result .sr-status { width:8px; height:8px; border-radius:50%; }

.modal-form { display:flex; flex-direction:column; gap:6px; margin:10px 0; }
.modal-actions { display:flex; gap:8px; margin-top:12px; justify-content:flex-end; }
.modal-btn {
  padding:6px 16px; border-radius:4px; border:none; cursor:pointer;
  font-size:13px; background:var(--accent); color:white;
}
.modal-btn:hover { background:var(--accent2); }
.modal-btn-secondary { background:var(--border); color:var(--text); }
.modal-btn-secondary:hover { background:#555; }
.modal-btn-danger { background:var(--danger); }

.preset-item, .worktree-item {
  display:flex; align-items:center; gap:8px; padding:6px 8px;
  border-radius:4px; margin-bottom:4px; background:rgba(255,255,255,0.03);
}
.preset-item .pi-name { flex:1; font-size:13px; }
.preset-item .pi-cmd { font-size:11px; color:#888; }
.preset-item .pi-del, .worktree-item .wt-del {
  background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:14px;
}
.worktree-item .wt-branch { flex:1; font-size:13px; font-weight:500; }
.worktree-item .wt-path { font-size:11px; color:#888; max-width:250px; overflow:hidden; text-overflow:ellipsis; }
.worktree-item .wt-open {
  background:transparent; border:none; color:var(--accent); cursor:pointer; font-size:12px;
}

/* Office View */
#office-view {
  position:fixed; top:0; left:0; width:100%; height:100%;
  z-index:2000; display:none; background:#2a1f3d;
}
#office-view.visible { display:block; }
#office-canvas { width:100%; height:100%; image-rendering:pixelated; }
#office-toolbar {
  position:fixed; top:10px; left:50%; transform:translateX(-50%);
  display:flex; gap:6px; background:rgba(40,30,60,0.9);
  border:1px solid rgba(100,80,140,0.5); border-radius:8px; padding:6px 10px; z-index:2001;
}

/* ANSI color classes */
.ansi-bold { font-weight:bold; }
.ansi-dim { opacity:0.7; }
.ansi-italic { font-style:italic; }
.ansi-underline { text-decoration:underline; }
.ansi-fg-black { color:#555; } .ansi-fg-red { color:#f44747; }
.ansi-fg-green { color:#4ec9b0; } .ansi-fg-yellow { color:#dcdcaa; }
.ansi-fg-blue { color:#569cd6; } .ansi-fg-magenta { color:#c586c0; }
.ansi-fg-cyan { color:#9cdcfe; } .ansi-fg-white { color:#d4d4d4; }
.ansi-fg-bright-black { color:#888; } .ansi-fg-bright-red { color:#f77; }
.ansi-fg-bright-green { color:#6fdfb0; } .ansi-fg-bright-yellow { color:#ffe680; }
.ansi-fg-bright-blue { color:#7bbbf0; } .ansi-fg-bright-magenta { color:#e0a0e0; }
.ansi-fg-bright-cyan { color:#b0efff; } .ansi-fg-bright-white { color:#ffffff; }
.ansi-bg-black { background:#555; } .ansi-bg-red { background:#f44747; }
.ansi-bg-green { background:#4ec9b0; } .ansi-bg-yellow { background:#dcdcaa; }
.ansi-bg-blue { background:#569cd6; } .ansi-bg-magenta { background:#c586c0; }
.ansi-bg-cyan { background:#9cdcfe; } .ansi-bg-white { background:#d4d4d4; }
`;

// ============================================================
// JS
// ============================================================
const JS_CONTENT = /*js*/ `
const vscode = acquireVsCodeApi();

// ==================== STATE ====================
const S = {
  terminals: new Map(),
  canvasX: 0, canvasY: 0, zoom: 1,
  isDraggingCanvas: false, isDraggingTerminal: false,
  dragTarget: null, dragOffsetX: 0, dragOffsetY: 0,
  lastMouseX: 0, lastMouseY: 0,
  nextTermX: 50, nextTermY: 50,
  officeViewActive: false, focusedTerminal: null,
  isResizing: false, resizeTarget: null,
  resizeStartW: 0, resizeStartH: 0, resizeStartX: 0, resizeStartY: 0,
  zCounter: 10,
  presets: [],
  searchIdx: 0,
};

const $ = id => document.getElementById(id);
const canvasContainer = $('canvas-container');
const canvasEl = $('canvas');
const minimapEl = $('minimap');
const minimapCanvas = $('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');
const zoomIndicator = $('zoom-indicator');
const connectionSvg = $('connection-svg');

// ==================== ANSI PARSER ====================
const ANSI_COLORS = ['black','red','green','yellow','blue','magenta','cyan','white'];

function parseAnsi(text) {
  // Returns array of {text, classes} segments
  const segments = [];
  let current = { fg: null, bg: null, bold: false, dim: false, italic: false, underline: false };
  let i = 0;
  let buf = '';

  function flushBuf() {
    if (buf.length > 0) {
      const cls = [];
      if (current.bold) cls.push('ansi-bold');
      if (current.dim) cls.push('ansi-dim');
      if (current.italic) cls.push('ansi-italic');
      if (current.underline) cls.push('ansi-underline');
      if (current.fg !== null) cls.push(current.fg);
      if (current.bg !== null) cls.push(current.bg);
      segments.push({ text: buf, classes: cls.join(' ') });
      buf = '';
    }
  }

  while (i < text.length) {
    if (text[i] === '\\x1b' || text[i] === '\\u001b' || text.charCodeAt(i) === 27) {
      flushBuf();
      if (text[i+1] === '[') {
        let j = i + 2;
        while (j < text.length && text[j] !== 'm' && text[j] !== 'A' && text[j] !== 'B' &&
               text[j] !== 'C' && text[j] !== 'D' && text[j] !== 'H' && text[j] !== 'J' &&
               text[j] !== 'K' && text[j] !== 'h' && text[j] !== 'l' && j - i < 20) j++;
        if (text[j] === 'm') {
          const codes = text.substring(i+2, j).split(';').map(Number);
          for (let ci = 0; ci < codes.length; ci++) {
            const c = codes[ci];
            if (c === 0) { current = { fg:null,bg:null,bold:false,dim:false,italic:false,underline:false }; }
            else if (c === 1) current.bold = true;
            else if (c === 2) current.dim = true;
            else if (c === 3) current.italic = true;
            else if (c === 4) current.underline = true;
            else if (c >= 30 && c <= 37) current.fg = 'ansi-fg-' + ANSI_COLORS[c-30];
            else if (c >= 40 && c <= 47) current.bg = 'ansi-bg-' + ANSI_COLORS[c-40];
            else if (c >= 90 && c <= 97) current.fg = 'ansi-fg-bright-' + ANSI_COLORS[c-90];
            else if (c >= 100 && c <= 107) current.bg = 'ansi-bg-bright-' + ANSI_COLORS[c-100];
            else if (c === 39) current.fg = null;
            else if (c === 49) current.bg = null;
          }
          i = j + 1;
          continue;
        }
        // Other escape sequences - skip
        i = j + 1;
        continue;
      }
      i++;
      continue;
    }
    // Filter carriage return for line handling
    if (text[i] === '\\r') { i++; continue; }
    buf += text[i];
    i++;
  }
  flushBuf();
  return segments;
}

function renderAnsiToHtml(text) {
  const segs = parseAnsi(text);
  let html = '';
  for (const s of segs) {
    const escaped = s.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (s.classes) {
      html += '<span class="' + s.classes + '">' + escaped + '</span>';
    } else {
      html += escaped;
    }
  }
  return html;
}

// ==================== CANVAS TRANSFORM ====================
function updateTransform() {
  canvasEl.style.transform = 'translate(' + S.canvasX + 'px,' + S.canvasY + 'px) scale(' + S.zoom + ')';
  zoomIndicator.textContent = Math.round(S.zoom*100) + '%';
  $('btn-reset-zoom').textContent = '🔍 ' + Math.round(S.zoom*100) + '%';
  drawGrid();
  updateConnectionLines();
}

function drawGrid() {
  const gs = 40 * S.zoom;
  const ox = S.canvasX % gs;
  const oy = S.canvasY % gs;
  canvasContainer.style.backgroundImage =
    'linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px)';
  canvasContainer.style.backgroundSize = gs + 'px ' + gs + 'px';
  canvasContainer.style.backgroundPosition = ox + 'px ' + oy + 'px';
}

// ==================== CONNECTION LINES ====================
function updateConnectionLines() {
  let svg = '';
  for (const [id, t] of S.terminals) {
    if (t.parentId && S.terminals.has(t.parentId)) {
      const p = S.terminals.get(t.parentId);
      const x1 = (p.x + p.w/2) * S.zoom + S.canvasX;
      const y1 = (p.y + p.h/2) * S.zoom + S.canvasY;
      const x2 = (t.x + t.w/2) * S.zoom + S.canvasX;
      const y2 = (t.y + t.h/2) * S.zoom + S.canvasY;
      svg += '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>';
    }
  }
  connectionSvg.innerHTML = svg;
}

// ==================== MINIMAP ====================
function updateMinimap() {
  const W = minimapCanvas.width = 200;
  const H = minimapCanvas.height = 150;
  minimapCtx.clearRect(0,0,W,H);
  const terms = [...S.terminals.values()];
  if (!terms.length) return;

  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for (const t of terms) {
    minX=Math.min(minX,t.x); minY=Math.min(minY,t.y);
    maxX=Math.max(maxX,t.x+t.w); maxY=Math.max(maxY,t.y+t.h);
  }
  const pad=100; minX-=pad; minY-=pad; maxX+=pad; maxY+=pad;
  const sc = Math.min(W/(maxX-minX), H/(maxY-minY));

  for (const t of terms) {
    const rx=(t.x-minX)*sc, ry=(t.y-minY)*sc, rw=t.w*sc, rh=t.h*sc;
    minimapCtx.fillStyle = t.id===S.focusedTerminal ? '#007acc' : '#4a4a4a';
    minimapCtx.fillRect(rx,ry,Math.max(rw,2),Math.max(rh,2));
    minimapCtx.strokeStyle='#666';
    minimapCtx.strokeRect(rx,ry,Math.max(rw,2),Math.max(rh,2));
  }
  const vw=canvasContainer.clientWidth, vh=canvasContainer.clientHeight;
  const vpX=(-S.canvasX/S.zoom-minX)*sc, vpY=(-S.canvasY/S.zoom-minY)*sc;
  const vpW=(vw/S.zoom)*sc, vpH=(vh/S.zoom)*sc;
  minimapCtx.strokeStyle='#007acc'; minimapCtx.lineWidth=2;
  minimapCtx.strokeRect(vpX,vpY,vpW,vpH);
  minimapCtx.fillStyle='rgba(0,122,204,0.1)';
  minimapCtx.fillRect(vpX,vpY,vpW,vpH);
}

// ==================== TERMINAL CREATION ====================
function createTerminalCard(id, name, cwd, hasPty, parentId) {
  const w=600, h=400;
  const x=S.nextTermX, y=S.nextTermY;
  S.nextTermX += 40; S.nextTermY += 40;
  if (S.nextTermY > 500) { S.nextTermY = 50; S.nextTermX += 300; }

  const t = { id, name, cwd, x, y, w, h, status:'active', outputBuf:'', hasPty, parentId: parentId||null };
  S.terminals.set(id, t);

  const card = document.createElement('div');
  card.className = 'terminal-card';
  card.id = 'term-' + id;
  card.style.cssText = 'left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px';

  const esc = s => { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; };

  card.innerHTML =
    '<div class="terminal-header" data-id="'+id+'">' +
      '<div class="terminal-status active"></div>' +
      '<span class="terminal-title" data-id="'+id+'" title="Double-click to rename">'+esc(name)+'</span>' +
      '<span class="terminal-cwd">'+esc(cwd||'')+'</span>' +
      '<button class="terminal-close" data-id="'+id+'">✕</button>' +
    '</div>' +
    '<div class="terminal-body" tabindex="0" data-id="'+id+'"></div>' +
    '<div class="terminal-resize" data-id="'+id+'"></div>';

  canvasEl.appendChild(card);

  const header = card.querySelector('.terminal-header');
  const body = card.querySelector('.terminal-body');
  const closeBtn = card.querySelector('.terminal-close');
  const titleEl = card.querySelector('.terminal-title');
  const resizeHandle = card.querySelector('.terminal-resize');

  // Drag header
  header.addEventListener('mousedown', e => { if(e.target===closeBtn) return; startDragTerminal(e,id); });
  closeBtn.addEventListener('click', () => closeTerminal(id));
  card.addEventListener('mousedown', () => focusTerminal(id));

  // Keyboard input for real PTY
  body.addEventListener('keydown', e => {
    e.preventDefault(); e.stopPropagation();
    let data = '';
    if (e.key === 'Enter') data = '\\r';
    else if (e.key === 'Backspace') data = '\\x7f';
    else if (e.key === 'Tab') data = '\\t';
    else if (e.key === 'Escape') data = '\\x1b';
    else if (e.key === 'ArrowUp') data = '\\x1b[A';
    else if (e.key === 'ArrowDown') data = '\\x1b[B';
    else if (e.key === 'ArrowRight') data = '\\x1b[C';
    else if (e.key === 'ArrowLeft') data = '\\x1b[D';
    else if (e.key === 'Home') data = '\\x1b[H';
    else if (e.key === 'End') data = '\\x1b[F';
    else if (e.key === 'Delete') data = '\\x1b[3~';
    else if (e.ctrlKey && e.key === 'c') data = '\\x03';
    else if (e.ctrlKey && e.key === 'd') data = '\\x04';
    else if (e.ctrlKey && e.key === 'z') data = '\\x1a';
    else if (e.ctrlKey && e.key === 'l') data = '\\x0c';
    else if (e.ctrlKey && e.key === 'a') data = '\\x01';
    else if (e.ctrlKey && e.key === 'e') data = '\\x05';
    else if (e.ctrlKey && e.key === 'u') data = '\\x15';
    else if (e.ctrlKey && e.key === 'k') data = '\\x0b';
    else if (e.ctrlKey && e.key === 'w') data = '\\x17';
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) data = e.key;
    if (data) vscode.postMessage({ type:'terminalInput', id, data });
  });

  // Double-click title to rename
  titleEl.addEventListener('dblclick', e => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.className = 'terminal-title-input';
    input.value = t.name;
    titleEl.replaceWith(input);
    input.focus();
    input.select();
    const finish = () => {
      const newName = input.value.trim() || t.name;
      t.name = newName;
      const newTitle = document.createElement('span');
      newTitle.className = 'terminal-title';
      newTitle.dataset.id = id;
      newTitle.title = 'Double-click to rename';
      newTitle.textContent = newName;
      newTitle.addEventListener('dblclick', e2 => {
        e2.stopPropagation();
        titleEl.dispatchEvent(new Event('dblclick'));
      });
      input.replaceWith(newTitle);
      vscode.postMessage({ type:'renameTerminal', id, name:newName });
      // Update office worker name
      if (OFFICE.workers.has(id)) OFFICE.workers.get(id).name = newName;
    };
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', e2 => { if(e2.key==='Enter') input.blur(); if(e2.key==='Escape'){input.value=t.name;input.blur();} });
  });

  // Resize
  resizeHandle.addEventListener('mousedown', e => startResize(e,id));

  focusTerminal(id);
  updateMinimap();
  updateConnectionLines();

  // Auto-create office worker
  if (!OFFICE.workers.has(id)) officeAddWorker(id, name);

  return card;
}

function appendTerminalOutput(id, data) {
  const t = S.terminals.get(id);
  if (!t) return;
  t.outputBuf += data;
  // Keep buffer bounded
  if (t.outputBuf.length > 200000) t.outputBuf = t.outputBuf.slice(-150000);

  const card = document.getElementById('term-'+id);
  if (!card) return;
  const body = card.querySelector('.terminal-body');
  // Re-render (for simplicity; a real impl would do incremental)
  body.innerHTML = renderAnsiToHtml(t.outputBuf) + '<span class="cursor-block"></span>';
  body.scrollTop = body.scrollHeight;
}

function focusTerminal(id) {
  document.querySelectorAll('.terminal-card.focused').forEach(c => c.classList.remove('focused'));
  const card = document.getElementById('term-'+id);
  if (card) {
    card.classList.add('focused');
    card.style.zIndex = ++S.zCounter;
    S.focusedTerminal = id;
    card.querySelector('.terminal-body')?.focus();
  }
}

function closeTerminal(id) {
  const card = document.getElementById('term-'+id);
  if (card) card.remove();
  S.terminals.delete(id);
  vscode.postMessage({ type:'closeTerminal', id });
  updateMinimap();
  updateConnectionLines();
  officeRemoveWorker(id);
  autoSaveLayout();
}

function updateTerminalStatus(id, status) {
  const t = S.terminals.get(id);
  if (!t) return;
  t.status = status;
  const card = document.getElementById('term-'+id);
  if (!card) return;
  const dot = card.querySelector('.terminal-status');
  dot.className = 'terminal-status ' + status;
}

// Navigate to terminal (for search)
function navigateToTerminal(id) {
  const t = S.terminals.get(id);
  if (!t) return;
  const vw = canvasContainer.clientWidth, vh = canvasContainer.clientHeight;
  S.canvasX = vw/2 - (t.x + t.w/2) * S.zoom;
  S.canvasY = vh/2 - (t.y + t.h/2) * S.zoom;
  updateTransform();
  updateMinimap();
  focusTerminal(id);
}

// ==================== DRAG ====================
function startDragTerminal(e, id) {
  if (e.button !== 0) return;
  e.stopPropagation();
  const t = S.terminals.get(id);
  if (!t) return;
  S.isDraggingTerminal = true;
  S.dragTarget = id;
  S.dragOffsetX = (e.clientX - S.canvasX) / S.zoom - t.x;
  S.dragOffsetY = (e.clientY - S.canvasY) / S.zoom - t.y;
  canvasContainer.classList.add('dragging-terminal');
  focusTerminal(id);
}

function startResize(e, id) {
  e.stopPropagation(); e.preventDefault();
  const t = S.terminals.get(id);
  if (!t) return;
  S.isResizing = true; S.resizeTarget = id;
  S.resizeStartW = t.w; S.resizeStartH = t.h;
  S.resizeStartX = e.clientX; S.resizeStartY = e.clientY;
}

// Canvas pan
canvasContainer.addEventListener('mousedown', e => {
  if (e.target===canvasContainer || e.target===canvasEl) {
    if (e.button===0) {
      S.isDraggingCanvas = true;
      S.lastMouseX = e.clientX; S.lastMouseY = e.clientY;
      canvasContainer.classList.add('dragging-canvas');
      minimapEl.classList.add('visible');
    }
  }
});

window.addEventListener('mousemove', e => {
  if (S.isDraggingCanvas) {
    S.canvasX += e.clientX - S.lastMouseX;
    S.canvasY += e.clientY - S.lastMouseY;
    S.lastMouseX = e.clientX; S.lastMouseY = e.clientY;
    updateTransform(); updateMinimap();
  }
  if (S.isDraggingTerminal && S.dragTarget) {
    const t = S.terminals.get(S.dragTarget);
    if (!t) return;
    t.x = (e.clientX - S.canvasX) / S.zoom - S.dragOffsetX;
    t.y = (e.clientY - S.canvasY) / S.zoom - S.dragOffsetY;
    const card = document.getElementById('term-'+S.dragTarget);
    if (card) { card.style.left=t.x+'px'; card.style.top=t.y+'px'; }
    minimapEl.classList.add('visible');
    updateMinimap(); updateConnectionLines();
  }
  if (S.isResizing && S.resizeTarget) {
    const t = S.terminals.get(S.resizeTarget);
    if (!t) return;
    t.w = Math.max(350, S.resizeStartW + (e.clientX-S.resizeStartX)/S.zoom);
    t.h = Math.max(220, S.resizeStartH + (e.clientY-S.resizeStartY)/S.zoom);
    const card = document.getElementById('term-'+S.resizeTarget);
    if (card) { card.style.width=t.w+'px'; card.style.height=t.h+'px'; }
  }
});

window.addEventListener('mouseup', () => {
  const wasDragging = S.isDraggingCanvas || S.isDraggingTerminal;
  if (S.isDraggingCanvas) { S.isDraggingCanvas=false; canvasContainer.classList.remove('dragging-canvas'); }
  if (S.isDraggingTerminal) { S.isDraggingTerminal=false; S.dragTarget=null; canvasContainer.classList.remove('dragging-terminal'); autoSaveLayout(); }
  if (S.isResizing) { S.isResizing=false; S.resizeTarget=null; autoSaveLayout(); }
  if (wasDragging) {
    setTimeout(() => {
      if (!S.isDraggingCanvas && !S.isDraggingTerminal) minimapEl.classList.remove('visible');
    }, 1500);
  }
});

// Zoom
canvasContainer.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const nz = Math.max(0.1, Math.min(3, S.zoom * delta));
  S.canvasX = e.clientX - (e.clientX - S.canvasX) * (nz / S.zoom);
  S.canvasY = e.clientY - (e.clientY - S.canvasY) * (nz / S.zoom);
  S.zoom = nz;
  updateTransform(); updateMinimap();
}, { passive: false });

// ==================== TOOLBAR ====================
$('btn-new-terminal').addEventListener('click', () => {
  vscode.postMessage({ type:'createTerminal', name:'Terminal', command:'' });
});
$('btn-new-worktree').addEventListener('click', () => {
  const branch = prompt('Branch name for worktree:');
  if (branch) vscode.postMessage({ type:'createWorktree', branch });
});
$('btn-worktree-list').addEventListener('click', () => {
  vscode.postMessage({ type:'requestWorktrees' });
  $('worktree-modal').classList.add('visible');
});
$('btn-search').addEventListener('click', () => openSearch());
$('btn-fit-all').addEventListener('click', fitAll);
$('btn-reset-zoom').addEventListener('click', () => {
  S.zoom=1; S.canvasX=0; S.canvasY=0; updateTransform();
});
$('btn-office-view').addEventListener('click', toggleOfficeView);
$('btn-preset-mgr').addEventListener('click', openPresetManager);

function fitAll() {
  const terms = [...S.terminals.values()];
  if (!terms.length) return;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for (const t of terms) {
    minX=Math.min(minX,t.x); minY=Math.min(minY,t.y);
    maxX=Math.max(maxX,t.x+t.w); maxY=Math.max(maxY,t.y+t.h);
  }
  const pad=60, cW=maxX-minX+pad*2, cH=maxY-minY+pad*2;
  const vw=canvasContainer.clientWidth, vh=canvasContainer.clientHeight-80;
  S.zoom = Math.min(1, Math.min(vw/cW, vh/cH));
  S.canvasX = (vw - cW*S.zoom)/2 - minX*S.zoom + pad*S.zoom;
  S.canvasY = (vh - cH*S.zoom)/2 - minY*S.zoom + pad*S.zoom + 50;
  updateTransform();
}

// ==================== SEARCH ====================
function openSearch() {
  const modal = $('search-modal');
  const input = $('search-input');
  modal.classList.add('visible');
  input.value = '';
  input.focus();
  S.searchIdx = 0;
  renderSearchResults('');
}

$('search-input').addEventListener('input', e => {
  S.searchIdx = 0;
  renderSearchResults(e.target.value);
});

$('search-input').addEventListener('keydown', e => {
  const results = $('search-results').children;
  if (e.key === 'ArrowDown') { e.preventDefault(); S.searchIdx = Math.min(S.searchIdx+1, results.length-1); highlightSearchResult(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); S.searchIdx = Math.max(S.searchIdx-1, 0); highlightSearchResult(); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    const sel = results[S.searchIdx];
    if (sel) { navigateToTerminal(sel.dataset.id); $('search-modal').classList.remove('visible'); }
  }
  else if (e.key === 'Escape') { $('search-modal').classList.remove('visible'); }
});

function renderSearchResults(query) {
  const container = $('search-results');
  container.innerHTML = '';
  const q = query.toLowerCase();
  for (const [id, t] of S.terminals) {
    if (q && !t.name.toLowerCase().includes(q) && !(t.cwd||'').toLowerCase().includes(q)) continue;
    const div = document.createElement('div');
    div.className = 'search-result';
    div.dataset.id = id;
    const statusCls = t.status === 'active' ? 'background:#4ec9b0' : t.status === 'idle' ? 'background:#dcdcaa' : 'background:#f44747';
    div.innerHTML = '<div class="sr-status" style="'+statusCls+'"></div>' +
      '<span class="sr-name">' + escHtml(t.name) + '</span>' +
      '<span class="sr-cwd">' + escHtml(t.cwd||'') + '</span>';
    div.addEventListener('click', () => {
      navigateToTerminal(id);
      $('search-modal').classList.remove('visible');
    });
    container.appendChild(div);
  }
  highlightSearchResult();
}

function highlightSearchResult() {
  const results = $('search-results').children;
  for (let i = 0; i < results.length; i++) {
    results[i].classList.toggle('selected', i === S.searchIdx);
  }
}

// Close modals on backdrop click
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('visible'); });
});

// ==================== PRESET MANAGER ====================
let editPresets = [];

function openPresetManager() {
  editPresets = JSON.parse(JSON.stringify(S.presets));
  renderPresetList();
  $('preset-modal').classList.add('visible');
  $('preset-name-input').value = '';
  $('preset-cmd-input').value = '';
}

$('preset-add-btn').addEventListener('click', () => {
  const name = $('preset-name-input').value.trim();
  if (!name) return;
  editPresets.push({ name, command: $('preset-cmd-input').value.trim(), icon: $('preset-icon-input').value });
  $('preset-name-input').value = ''; $('preset-cmd-input').value = '';
  renderPresetList();
});

$('preset-save-btn').addEventListener('click', () => {
  vscode.postMessage({ type:'updatePresets', presets: editPresets });
  $('preset-modal').classList.remove('visible');
});
$('preset-cancel-btn').addEventListener('click', () => { $('preset-modal').classList.remove('visible'); });

function renderPresetList() {
  const container = $('preset-list');
  container.innerHTML = '';
  const icons = { terminal:'⬛', code:'📝', edit:'✏️', server:'🖥️', database:'🗄️' };
  for (let i = 0; i < editPresets.length; i++) {
    const p = editPresets[i];
    const div = document.createElement('div');
    div.className = 'preset-item';
    div.innerHTML = '<span>'+(icons[p.icon]||'⬛')+'</span>' +
      '<span class="pi-name">' + escHtml(p.name) + '</span>' +
      '<span class="pi-cmd">' + escHtml(p.command||'(default shell)') + '</span>' +
      '<button class="pi-del" title="Remove">✕</button>';
    div.querySelector('.pi-del').addEventListener('click', () => {
      editPresets.splice(i, 1);
      renderPresetList();
    });
    container.appendChild(div);
  }
}

// ==================== PRESET DOCK ====================
function renderPresets(presets) {
  S.presets = presets;
  const dock = $('preset-dock');
  dock.innerHTML = '';
  const icons = { terminal:'⬛', code:'📝', edit:'✏️', server:'🖥️', database:'🗄️' };
  for (const p of presets) {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.innerHTML = '<span class="preset-icon">'+(icons[p.icon]||'⬛')+'</span>' + escHtml(p.name);
    btn.addEventListener('click', () => {
      vscode.postMessage({ type:'createTerminal', name:p.name, command:p.command||'' });
    });
    dock.appendChild(btn);
  }
  const addBtn = document.createElement('button');
  addBtn.className = 'preset-btn';
  addBtn.innerHTML = '<span class="preset-icon">➕</span>Custom';
  addBtn.addEventListener('click', () => {
    const name = prompt('Terminal name:');
    if (!name) return;
    const cmd = prompt('Command (empty = default shell):') || '';
    vscode.postMessage({ type:'createTerminal', name, command:cmd });
  });
  dock.appendChild(addBtn);
}

// ==================== WORKTREE MODAL ====================
$('worktree-new-btn').addEventListener('click', () => {
  const branch = prompt('Branch name:');
  if (branch) { vscode.postMessage({ type:'createWorktree', branch }); $('worktree-modal').classList.remove('visible'); }
});
$('worktree-close-btn').addEventListener('click', () => { $('worktree-modal').classList.remove('visible'); });

function renderWorktrees(worktrees) {
  const container = $('worktree-list');
  container.innerHTML = '';
  if (!worktrees.length) { container.innerHTML = '<div style="color:#888;padding:8px">No worktrees found</div>'; return; }
  for (const wt of worktrees) {
    const div = document.createElement('div');
    div.className = 'worktree-item';
    div.innerHTML =
      '<span class="wt-branch">🌿 ' + escHtml(wt.branch) + '</span>' +
      '<span class="wt-path">' + escHtml(wt.path) + '</span>' +
      '<button class="wt-open" title="Open terminal here">Open</button>' +
      '<button class="wt-del pi-del" title="Remove worktree">✕</button>';
    div.querySelector('.wt-open').addEventListener('click', () => {
      vscode.postMessage({ type:'createTerminal', name:'🌿 '+wt.branch, command:'', cwd:wt.path });
      $('worktree-modal').classList.remove('visible');
    });
    div.querySelector('.wt-del').addEventListener('click', () => {
      if (confirm('Remove worktree '+wt.branch+'?')) {
        vscode.postMessage({ type:'removeWorktree', path:wt.path, id:'' });
        div.remove();
      }
    });
    container.appendChild(div);
  }
}

// ==================== LAYOUT PERSISTENCE ====================
let saveTimer = null;
function autoSaveLayout() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const terminals = [];
    for (const [id, t] of S.terminals) {
      terminals.push({ id:t.id, name:t.name, command:'', cwd:t.cwd, x:t.x, y:t.y, w:t.w, h:t.h, parentId:t.parentId||null });
    }
    vscode.postMessage({ type:'saveLayout', layout:{ terminals, canvasX:S.canvasX, canvasY:S.canvasY, zoom:S.zoom }});
  }, 1000);
}

function restoreLayout(layout) {
  if (!layout || !layout.terminals) return;
  S.canvasX = layout.canvasX || 0;
  S.canvasY = layout.canvasY || 0;
  S.zoom = layout.zoom || 1;
  updateTransform();
  // We restore positions but terminals need to be re-created via backend
  // Send info about desired positions
  for (const t of layout.terminals) {
    S.nextTermX = t.x;
    S.nextTermY = t.y;
    vscode.postMessage({ type:'createTerminal', name:t.name, command:t.command||'', cwd:t.cwd, parentId:t.parentId });
  }
}

// ==================== PIXEL OFFICE VIEW ====================
const officeView = $('office-view');
const officeCanvas = $('office-canvas');
const officeCtx = officeCanvas.getContext('2d');
let officeAnimId = null;

const OFFICE = { floorY:0, deskSpacing:130, workers:new Map() };
const PX = {
  skin:'#ffcc99',
  hair:['#3d2314','#8b4513','#d2691e','#ffd700','#1a1a2e','#c0c0c0','#e04040','#40e040'],
  shirt:['#007acc','#4ec9b0','#d16969','#dcdcaa','#c586c0','#569cd6','#e06c60','#60c0e0'],
  pants:'#2d2d5e', desk:'#8b6914', monitor:'#1e1e1e',
  screenOff:'#0e0e0e', screenOn:'#0d3320',
  floor:'#3d3552', wall:'#2a2040', chair:'#444',
};

class PixelWorker {
  constructor(id, name, deskX, floorY) {
    this.id = id; this.name = name;
    this.deskX = deskX; this.x = deskX; this.y = floorY; this.floorY = floorY;
    this.state = 'working'; this.frame = 0; this.dir = 1;
    this.walkTarget = null; this.message = ''; this.msgTimer = 0;
    this.hair = PX.hair[Math.floor(Math.random()*PX.hair.length)];
    this.shirt = PX.shirt[Math.floor(Math.random()*PX.shirt.length)];
    this.idleTimer = 0; this.actionTimer = Math.random()*300+100;
    this.showMsg('Starting up...', 120);
  }

  showMsg(m, d) { this.message = m; this.msgTimer = d||120; }

  update() {
    this.frame++;
    this.actionTimer--;
    if (this.msgTimer > 0) this.msgTimer--;

    if (this.state === 'working') {
      if (this.actionTimer <= 0) {
        if (Math.random() < 0.25) {
          this.state = 'walking';
          this.walkTarget = this.deskX + (Math.random()-0.5)*250;
          const msgs = ['Taking a break~','☕ Coffee time','Stretching...','💭 Thinking...'];
          this.showMsg(msgs[Math.floor(Math.random()*msgs.length)], 90);
        } else {
          const msgs = ['Working...','Coding...','Compiling...','Debugging...','Testing...','📝 Writing'];
          this.showMsg(msgs[Math.floor(Math.random()*msgs.length)], 80);
        }
        this.actionTimer = Math.random()*400+200;
      }
    } else if (this.state === 'walking') {
      const speed = 0.8;
      if (Math.abs(this.x - this.walkTarget) < 2) {
        this.state = 'idle'; this.idleTimer = Math.random()*150+50;
        this.showMsg('☕', 60);
      } else {
        this.dir = this.walkTarget > this.x ? 1 : -1;
        this.x += this.dir * speed;
      }
    } else if (this.state === 'idle') {
      this.idleTimer--;
      if (this.idleTimer <= 0) {
        this.state = 'walking'; this.walkTarget = this.deskX;
        this.showMsg('Back to work!', 90);
      }
    } else if (this.state === 'done') {
      if (this.actionTimer <= 0) { this.state = 'working'; this.actionTimer = Math.random()*300+100; }
    }
    if (this.state === 'walking' && this.walkTarget === this.deskX && Math.abs(this.x-this.deskX)<2) {
      this.x = this.deskX; this.state = 'working'; this.showMsg('Working...', 90);
    }
  }

  draw(ctx, s) {
    const px = this.x*s, py = this.y*s;
    const atDesk = this.state==='working' || (this.state==='done' && Math.abs(this.x-this.deskX)<5);
    const deskPx = this.deskX*s;

    // Desk
    ctx.fillStyle = PX.desk;
    ctx.fillRect(deskPx-20*s, py-24*s, 40*s, 3*s);
    ctx.fillRect(deskPx-18*s, py-24*s, 3*s, 24*s);
    ctx.fillRect(deskPx+15*s, py-24*s, 3*s, 24*s);

    // Monitor
    ctx.fillStyle = PX.monitor;
    ctx.fillRect(deskPx-10*s, py-40*s, 20*s, 14*s);
    const on = this.state==='working'||this.state==='done';
    ctx.fillStyle = on ? PX.screenOn : PX.screenOff;
    ctx.fillRect(deskPx-8*s, py-38*s, 16*s, 10*s);
    if (on && this.frame%10<7) {
      ctx.fillStyle = '#4ec9b0';
      for (let i=0;i<3;i++) ctx.fillRect(deskPx-6*s, (py-36*s)+i*3*s, (4+Math.floor(Math.random()*8))*s, 1*s);
    }
    ctx.fillStyle = PX.monitor;
    ctx.fillRect(deskPx-2*s, py-26*s, 4*s, 3*s);

    // Chair
    if (atDesk) {
      ctx.fillStyle = PX.chair;
      ctx.fillRect(deskPx-8*s, py-16*s, 16*s, 2*s);
      ctx.fillRect(deskPx-8*s, py-26*s, 2*s, 10*s);
      ctx.fillRect(deskPx-6*s, py-2*s, 3*s, 2*s);
      ctx.fillRect(deskPx+3*s, py-2*s, 3*s, 2*s);
    }

    // Character
    const cx = px, cy = py;
    // Legs
    ctx.fillStyle = PX.pants;
    if (this.state === 'walking') {
      const lf = Math.floor(this.frame/8)%4;
      const lo = [[-2,0,2,0],[-3,0,1,-1],[-2,0,2,0],[-1,-1,3,0]][lf];
      ctx.fillRect(cx+lo[0]*s, cy-10*s+lo[1]*s, 3*s, 10*s);
      ctx.fillRect(cx+lo[2]*s, cy-10*s+lo[3]*s, 3*s, 10*s);
    } else {
      ctx.fillRect(cx-2*s, cy-10*s, 3*s, 10*s);
      ctx.fillRect(cx+2*s, cy-10*s, 3*s, 10*s);
    }
    // Body
    ctx.fillStyle = this.shirt;
    ctx.fillRect(cx-4*s, cy-20*s, 10*s, 11*s);
    // Arms
    if (atDesk && this.state==='working') {
      ctx.fillRect(cx-6*s, cy-18*s, 3*s, 8*s);
      ctx.fillRect(cx+5*s, cy-18*s, 3*s, 8*s);
      ctx.fillStyle = PX.skin;
      ctx.fillRect(cx-6*s, cy-11*s, 3*s, 2*s);
      ctx.fillRect(cx+5*s, cy-11*s, 3*s, 2*s);
    } else {
      ctx.fillRect(cx-6*s, cy-19*s, 3*s, 10*s);
      ctx.fillRect(cx+5*s, cy-19*s, 3*s, 10*s);
      ctx.fillStyle = PX.skin;
      ctx.fillRect(cx-6*s, cy-10*s, 3*s, 2*s);
      ctx.fillRect(cx+5*s, cy-10*s, 3*s, 2*s);
    }
    // Head
    ctx.fillStyle = PX.skin;
    ctx.fillRect(cx-3*s, cy-28*s, 8*s, 8*s);
    // Hair
    ctx.fillStyle = this.hair;
    ctx.fillRect(cx-3*s, cy-30*s, 8*s, 3*s);
    if (this.dir===-1) ctx.fillRect(cx+4*s, cy-28*s, 1*s, 4*s);
    else ctx.fillRect(cx-3*s, cy-28*s, 1*s, 4*s);
    // Eyes
    ctx.fillStyle = '#333';
    if (this.frame%120 > 3) {
      ctx.fillRect(cx-1*s, cy-25*s, 2*s, 2*s);
      ctx.fillRect(cx+3*s, cy-25*s, 2*s, 2*s);
    }

    // Message bubble
    if (this.message && this.msgTimer > 0) {
      const mw = this.message.length * 5*s + 8*s;
      const mx = cx - mw/2 + 2*s, my = cy - 42*s;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(mx, my, mw, 10*s, 3*s);
      else { ctx.moveTo(mx+3*s,my); ctx.lineTo(mx+mw-3*s,my); ctx.lineTo(mx+mw,my+10*s); ctx.lineTo(mx,my+10*s); ctx.closePath(); }
      ctx.fill();
      ctx.fillRect(cx, my+9*s, 4*s, 3*s);
      ctx.fillStyle = '#333';
      ctx.font = Math.max(8,7*s)+'px monospace';
      ctx.fillText(this.message, mx+4*s, my+8*s);
    }

    // Name
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = Math.max(8,6*s)+'px monospace';
    const nw = ctx.measureText(this.name).width;
    ctx.fillText(this.name, cx-nw/2+2*s, cy+8*s);
  }
}

function officeAddWorker(id, name) {
  const cnt = OFFICE.workers.size;
  const deskX = 80 + cnt * OFFICE.deskSpacing;
  OFFICE.workers.set(id, new PixelWorker(id, name, deskX, OFFICE.floorY));
}
function officeRemoveWorker(id) { OFFICE.workers.delete(id); }

function officeSetStatus(id, status, msg) {
  const w = OFFICE.workers.get(id);
  if (!w) return;
  if (status === 'active') {
    if (w.state !== 'working' && w.state !== 'walking') {
      w.state = 'working'; w.showMsg(msg||'Working...', 120);
    }
  } else if (status === 'idle') {
    if (w.state === 'working') {
      w.showMsg(msg||'Waiting...', 120);
    }
  } else if (status === 'done') {
    w.state = 'done'; w.showMsg(msg||'Done! ✓', 180); w.actionTimer = 200;
  } else if (status === 'dead') {
    w.state = 'idle'; w.idleTimer = 9999; w.showMsg('💀 Exited', 200);
  }
}

function toggleOfficeView() {
  S.officeViewActive = !S.officeViewActive;
  if (S.officeViewActive) {
    officeView.classList.add('visible');
    for (const [id,t] of S.terminals) {
      if (!OFFICE.workers.has(id)) officeAddWorker(id, t.name);
    }
    startOfficeAnim();
  } else {
    officeView.classList.remove('visible');
    if (officeAnimId) { cancelAnimationFrame(officeAnimId); officeAnimId = null; }
  }
}

function startOfficeAnim() {
  const W = officeCanvas.width = officeCanvas.clientWidth;
  const H = officeCanvas.height = officeCanvas.clientHeight;
  OFFICE.floorY = H * 0.75;
  for (const w of OFFICE.workers.values()) { w.floorY = OFFICE.floorY; w.y = OFFICE.floorY; }

  function render() {
    officeCtx.clearRect(0,0,W,H);
    const sc = Math.min(W/800, H/400)*1.5;

    // Wall
    officeCtx.fillStyle = PX.wall;
    officeCtx.fillRect(0,0,W,OFFICE.floorY);

    // Windows
    const wW=60*sc, wH=40*sc;
    for (let i=0;i<3;i++) {
      const wx=W*0.2+i*W*0.3, wy=OFFICE.floorY*0.3;
      officeCtx.fillStyle='#1a1a3e'; officeCtx.fillRect(wx-wW/2,wy-wH/2,wW,wH);
      officeCtx.fillStyle='#2a2a5e'; officeCtx.fillRect(wx-wW/2+2,wy-wH/2+2,wW-4,wH-4);
      officeCtx.fillStyle='#555';
      officeCtx.fillRect(wx-1,wy-wH/2,2,wH);
      officeCtx.fillRect(wx-wW/2,wy-1,wW,2);
    }

    // Floor
    officeCtx.fillStyle = PX.floor;
    officeCtx.fillRect(0,OFFICE.floorY,W,H-OFFICE.floorY);
    officeCtx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let x=0;x<W;x+=20*sc) officeCtx.fillRect(x,OFFICE.floorY,10*sc,H-OFFICE.floorY);

    for (const w of OFFICE.workers.values()) { w.update(); w.draw(officeCtx, sc); }

    officeCtx.fillStyle='rgba(255,255,255,0.3)'; officeCtx.font=12*sc+'px monospace';
    officeCtx.fillText('🏢 Infinite Terminal Office', 10, 20*sc);
    officeCtx.font=8*sc+'px monospace';
    officeCtx.fillText(OFFICE.workers.size+' workers', 10, 34*sc);

    if (S.officeViewActive) officeAnimId = requestAnimationFrame(render);
  }
  render();
}

$('btn-close-office').addEventListener('click', toggleOfficeView);
$('btn-new-terminal-office').addEventListener('click', () => {
  vscode.postMessage({ type:'createTerminal', name:'Terminal', command:'' });
});

// ==================== MESSAGE HANDLING ====================
window.addEventListener('message', e => {
  const m = e.data;
  switch (m.type) {
    case 'terminalCreated':
      createTerminalCard(m.id, m.name, m.cwd, m.hasPty, m.parentId);
      break;
    case 'terminalOutput':
      appendTerminalOutput(m.id, m.data);
      break;
    case 'terminalExited':
      updateTerminalStatus(m.id, 'dead');
      appendTerminalOutput(m.id, '\\r\\n[Process exited with code '+m.exitCode+']');
      officeSetStatus(m.id, 'dead');
      break;
    case 'terminalActivity':
      if (m.isActive) {
        updateTerminalStatus(m.id, 'active');
        officeSetStatus(m.id, 'active');
      } else {
        updateTerminalStatus(m.id, 'idle');
        officeSetStatus(m.id, 'idle');
      }
      break;
    case 'triggerCreateTerminal':
      vscode.postMessage({ type:'createTerminal', name:m.name, command:m.command, cwd:m.cwd });
      break;
    case 'presets':
      renderPresets(m.presets);
      break;
    case 'worktrees':
      renderWorktrees(m.worktrees);
      break;
    case 'toggleOfficeView':
      toggleOfficeView();
      break;
    case 'openSearch':
      openSearch();
      break;
    case 'restoreLayout':
      restoreLayout(m.layout);
      break;
    case 'requestSaveLayout':
      autoSaveLayout();
      break;
  }
});

// ==================== HELPERS ====================
function escHtml(t) { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', e => {
  // Don't capture if typing in terminal or input
  const tag = document.activeElement?.tagName;
  const inTerminal = document.activeElement?.classList?.contains('terminal-body');

  if (!inTerminal) {
    if ((e.ctrlKey||e.metaKey) && e.key === 'p') {
      e.preventDefault(); openSearch();
    }
    if ((e.ctrlKey||e.metaKey) && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      vscode.postMessage({ type:'createTerminal', name:'Terminal', command:'' });
    }
  }
  if (e.key === 'Escape') {
    if (S.officeViewActive) toggleOfficeView();
    document.querySelectorAll('.modal.visible').forEach(m => m.classList.remove('visible'));
  }
});

// ==================== INIT ====================
updateTransform();
vscode.postMessage({ type:'requestPresets' });
vscode.postMessage({ type:'requestLayout' });
`;
