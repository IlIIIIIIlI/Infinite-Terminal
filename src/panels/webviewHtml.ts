export function getWebviewHtml(
  xtermJsUri: string,
  xtermCssInline: string,
  fitAddonUri: string,
  cspSource: string,
): string {
  const nonce = getNonce();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${cspSource} data:; img-src data:;">
  <title>Infinite Terminal</title>
  <style>${xtermCssInline}</style>
  <script nonce="${nonce}" src="${xtermJsUri}"></script>
  <script nonce="${nonce}" src="${fitAddonUri}"></script>
  <style>${CSS_CONTENT}</style>
</head>
<body>
  <div id="canvas-container">
    <div id="canvas"></div>
  </div>

  <!-- Toolbar -->
  <div id="toolbar">
    <button class="toolbar-btn" id="btn-new-terminal" title="New Terminal (Ctrl+Shift+N)">⬛ New</button>
    <div class="toolbar-sep"></div>
    <button class="toolbar-btn" id="btn-search" title="Search Terminals (Ctrl+P)">🔍 Search</button>
    <button class="toolbar-btn" id="btn-fit-all" title="Fit All">⊞ Fit</button>
    <button class="toolbar-btn" id="btn-auto-layout" title="Auto Layout">⊞ Layout</button>
    <button class="toolbar-btn" id="btn-reset-zoom">🔍 100%</button>
    <div class="toolbar-sep"></div>
    <button class="toolbar-btn" id="btn-group" title="Group selected terminals (Shift+Click to select)">📦 Group</button>
    <button class="toolbar-btn" id="btn-ungroup" title="Ungroup focused terminal">📤 Ungroup</button>
    <div class="toolbar-sep"></div>
    <button class="toolbar-btn" id="btn-preset-mgr" title="Manage Presets">⚙️ Presets</button>
  </div>

  <!-- Preset Dock -->
  <div id="preset-dock"></div>

  <!-- Group Nav Bar -->
  <div id="group-nav"></div>

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

  <!-- Group Edit Modal -->
  <div id="group-modal" class="modal">
    <div class="modal-content">
      <h3 id="group-modal-title">Create Group</h3>
      <div class="modal-form">
        <input id="group-name-input" type="text" placeholder="Group name" />
        <div id="group-color-picker" style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0;"></div>
      </div>
      <div class="modal-actions">
        <button class="modal-btn" id="group-save-btn">Save</button>
        <button class="modal-btn modal-btn-secondary" id="group-cancel-btn">Cancel</button>
        <button class="modal-btn modal-btn-danger" id="group-delete-btn" style="display:none">Delete Group</button>
      </div>
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
/* Dark theme (default) */
:root, body.vscode-dark {
  --bg: #1e1e1e; --surface: #252526; --border: #3c3c3c;
  --text: #cccccc; --accent: #007acc; --accent2: #1a8ad4;
  --term-bg: #0e0e0e; --term-fg: #d4d4d4; --header-bg: #2d2d2d;
  --danger: #f44747; --success: #4ec9b0; --warning: #dcdcaa;
  --grid: rgba(255,255,255,0.03);
  --cursor: #d4d4d4; --selection: #264f78;
  --shadow: rgba(0,0,0,0.5); --shadow-hover: rgba(0,0,0,0.6);
}
/* Light theme */
body.vscode-light {
  --bg: #f3f3f3; --surface: #ffffff; --border: #e0e0e0;
  --text: #333333; --accent: #007acc; --accent2: #1a8ad4;
  --term-bg: #ffffff; --term-fg: #1e1e1e; --header-bg: #f0f0f0;
  --danger: #d32f2f; --success: #388e3c; --warning: #f57c00;
  --grid: rgba(0,0,0,0.04);
  --cursor: #1e1e1e; --selection: #add6ff;
  --shadow: rgba(0,0,0,0.12); --shadow-hover: rgba(0,0,0,0.18);
}
/* High contrast */
body.vscode-high-contrast {
  --bg: #000000; --surface: #0a0a0a; --border: #6fc3df;
  --text: #ffffff; --accent: #6fc3df; --accent2: #6fc3df;
  --term-bg: #000000; --term-fg: #ffffff; --header-bg: #0a0a0a;
  --danger: #f48771; --success: #89d185; --warning: #cca700;
  --grid: rgba(255,255,255,0.06);
  --cursor: #ffffff; --selection: #264f78;
  --shadow: rgba(255,255,255,0.1); --shadow-hover: rgba(255,255,255,0.15);
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
  box-shadow:0 4px 16px var(--shadow);
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
  overflow:hidden; box-shadow:0 4px 20px var(--shadow);
  display:flex; flex-direction:column; transition:box-shadow 0.2s;
}
.terminal-card:hover { box-shadow:0 6px 28px var(--shadow-hover); }
.terminal-card.focused { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent),0 6px 28px var(--shadow-hover); }

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

/* Terminal Body - xterm.js container */
.terminal-body {
  flex:1; background:var(--term-bg);
  position:relative; overflow:hidden;
}
.terminal-body .xterm { height:100%; }
.terminal-body .xterm-viewport { overflow-y:auto; }

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
  box-shadow:0 4px 16px var(--shadow);
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
  overflow-y:auto; box-shadow:0 8px 32px var(--shadow-hover);
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

/* Terminal selection */
.terminal-card.selected {
  outline: 2px dashed var(--accent); outline-offset: 2px;
}

/* Group frame on canvas */
.group-frame {
  position:absolute; border:2px solid; border-radius:12px;
  pointer-events:none; transition: opacity 0.2s;
}
.group-frame-label {
  position:absolute; top:-24px; left:8px;
  font-size:11px; font-weight:600; padding:2px 10px; border-radius:4px;
  pointer-events:auto; cursor:pointer; white-space:nowrap;
  user-select:none;
}

/* Group nav bar (left side) */
#group-nav {
  position:fixed; top:60px; left:12px; display:flex; flex-direction:column; gap:4px;
  z-index:1000;
}
.group-nav-btn {
  display:flex; align-items:center; gap:6px;
  background:var(--surface); border:2px solid; color:var(--text);
  padding:5px 12px; border-radius:6px; cursor:pointer; font-size:11px;
  font-weight:500; transition:all 0.15s; white-space:nowrap;
  box-shadow:0 2px 8px var(--shadow);
}
.group-nav-btn:hover { transform:translateX(3px); filter:brightness(1.15); }
.group-nav-btn .gnb-dot {
  width:10px; height:10px; border-radius:50%; flex-shrink:0;
}
.group-nav-btn .gnb-count {
  font-size:10px; opacity:0.6;
}

/* Group color picker swatches */
.color-swatch {
  width:28px; height:28px; border-radius:6px; cursor:pointer;
  border:2px solid transparent; transition:all 0.15s;
}
.color-swatch:hover { transform:scale(1.15); }
.color-swatch.active { border-color:var(--text); box-shadow:0 0 0 2px var(--accent); }

/* Toolbar btn disabled look */
.toolbar-btn:disabled, .toolbar-btn[disabled] {
  opacity:0.4; cursor:default; pointer-events:none;
}


`;

// ============================================================
// JS
// ============================================================
const JS_CONTENT = /*js*/ `
const vscode = acquireVsCodeApi();

// ==================== STATE ====================
const S = {
  terminals: new Map(),
  groups: new Map(),        // id -> { id, name, color, terminalIds: Set }
  selectedTerminals: new Set(),
  groupCounter: 0,
  canvasX: 0, canvasY: 0, zoom: 1,
  isDraggingCanvas: false, isDraggingTerminal: false,
  dragTarget: null, dragOffsetX: 0, dragOffsetY: 0,
  lastMouseX: 0, lastMouseY: 0,
  nextTermX: 50, nextTermY: 50,
  focusedTerminal: null,
  isResizing: false, resizeTarget: null,
  resizeStartW: 0, resizeStartH: 0, resizeStartX: 0, resizeStartY: 0,
  zCounter: 10,
  presets: [],
  searchIdx: 0,
  editingGroupId: null,     // for group modal
};

const GROUP_COLORS = [
  '#007acc', '#4ec9b0', '#dcdcaa', '#f44747', '#c586c0',
  '#ce9178', '#6a9955', '#569cd6', '#d7ba7d', '#9cdcfe',
];

const $ = id => document.getElementById(id);
const canvasContainer = $('canvas-container');
const canvasEl = $('canvas');
const minimapEl = $('minimap');
const minimapCanvas = $('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');
const zoomIndicator = $('zoom-indicator');
const connectionSvg = $('connection-svg');

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
  S.nextTermX += w + 30;
  if (S.nextTermX > 2000) { S.nextTermX = 50; S.nextTermY += h + 30; }

  const t = { id, name, cwd, x, y, w, h, status:'active', hasPty, parentId: parentId||null, xterm: null, fitAddon: null };
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
    '<div class="terminal-body" data-id="'+id+'"></div>' +
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
  card.addEventListener('mousedown', (e) => {
    if (e.shiftKey) {
      e.stopPropagation();
      toggleSelectTerminal(id);
    } else {
      focusTerminal(id);
    }
  });

  // xterm.js terminal instance - theme follows VS Code
  const cs = getComputedStyle(document.body);
  const term = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: "'Cascadia Code','Fira Code','Consolas','Courier New',monospace",
    theme: {
      background: cs.getPropertyValue('--term-bg').trim(),
      foreground: cs.getPropertyValue('--term-fg').trim(),
      cursor: cs.getPropertyValue('--cursor').trim(),
      selectionBackground: cs.getPropertyValue('--selection').trim(),
    },
    allowTransparency: true,
    scrollback: 5000,
  });
  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  t.xterm = term;
  t.fitAddon = fitAddon;

  // Delay xterm.open() until body has real dimensions to prevent measurement chars leaking
  const initXterm = () => {
    if (body.clientWidth > 0 && body.clientHeight > 0) {
      term.open(body);
      try { fitAddon.fit(); } catch (e) { console.warn('xterm fit failed:', e); }
      vscode.postMessage({ type:'terminalResize', id, cols:term.cols, rows:term.rows });

      term.onData(data => {
        vscode.postMessage({ type:'terminalInput', id, data });
      });

      const doFit = () => {
        try { fitAddon.fit(); vscode.postMessage({ type:'terminalResize', id, cols:term.cols, rows:term.rows }); } catch (e) { console.warn('xterm fit/resize failed:', e); }
      };
      new ResizeObserver(() => doFit()).observe(body);
    } else {
      requestAnimationFrame(initXterm);
    }
  };
  requestAnimationFrame(initXterm);

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
    };
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', e2 => { if(e2.key==='Enter') input.blur(); if(e2.key==='Escape'){input.value=t.name;input.blur();} });
  });

  // Resize
  resizeHandle.addEventListener('mousedown', e => startResize(e,id));

  // Auto-center on new terminal
  const vw = canvasContainer.clientWidth, vh = canvasContainer.clientHeight;
  S.canvasX = vw/2 - (x + w/2) * S.zoom;
  S.canvasY = vh/2 - (y + h/2) * S.zoom;
  updateTransform();

  focusTerminal(id);
  updateMinimap();
  updateConnectionLines();

  // Auto-create office worker

  return card;
}

function appendTerminalOutput(id, data) {
  const t = S.terminals.get(id);
  if (!t) return;
  if (!t.xterm || !t.xterm.element) {
    // Buffer data until xterm is ready
    t.pendingData = (t.pendingData || '') + data;
    const check = () => {
      if (t.xterm && t.xterm.element) {
        if (t.pendingData) { t.xterm.write(t.pendingData); t.pendingData = ''; }
      } else { requestAnimationFrame(check); }
    };
    requestAnimationFrame(check);
    return;
  }
  t.xterm.write(data);
}

function focusTerminal(id) {
  document.querySelectorAll('.terminal-card.focused').forEach(c => c.classList.remove('focused'));
  const card = document.getElementById('term-'+id);
  if (card) {
    card.classList.add('focused');
    card.style.zIndex = ++S.zCounter;
    S.focusedTerminal = id;
    const t = S.terminals.get(id);
    if (t && t.xterm) t.xterm.focus();
  }
}

function closeTerminal(id) {
  const t = S.terminals.get(id);
  if (t && t.xterm) t.xterm.dispose();
  const card = document.getElementById('term-'+id);
  if (card) card.remove();
  S.terminals.delete(id);
  S.selectedTerminals.delete(id);
  ungroupTerminal(id);
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
    updateAllGroupFrames();
  }
  if (S.isResizing && S.resizeTarget) {
    const t = S.terminals.get(S.resizeTarget);
    if (!t) return;
    t.w = Math.max(350, S.resizeStartW + (e.clientX-S.resizeStartX)/S.zoom);
    t.h = Math.max(220, S.resizeStartH + (e.clientY-S.resizeStartY)/S.zoom);
    const card = document.getElementById('term-'+S.resizeTarget);
    if (card) { card.style.width=t.w+'px'; card.style.height=t.h+'px'; }
    updateAllGroupFrames();
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

// Zoom (mouse wheel) + trackpad gestures (pan & pinch)
canvasContainer.addEventListener('wheel', e => {
  // Let xterm.js handle scroll when cursor is over a terminal
  if (e.target.closest && e.target.closest('.terminal-body')) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  if (e.ctrlKey || e.metaKey) {
    // Pinch-to-zoom on trackpad / Ctrl+scroll / Cmd+scroll
    const factor = e.ctrlKey ? 0.01 : 0.002;
    const nz = Math.max(0.1, Math.min(3, S.zoom * (1 - e.deltaY * factor)));
    S.canvasX = e.clientX - (e.clientX - S.canvasX) * (nz / S.zoom);
    S.canvasY = e.clientY - (e.clientY - S.canvasY) * (nz / S.zoom);
    S.zoom = nz;
  } else if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
    // Two-finger pan on trackpad / regular scroll
    S.canvasX -= e.deltaX;
    S.canvasY -= e.deltaY;
  }
  updateTransform(); updateMinimap();
}, { passive: false, capture: true });

// ==================== TOOLBAR ====================
$('btn-new-terminal').addEventListener('click', () => {
  vscode.postMessage({ type:'createTerminal', name:'Terminal', command:'' });
});
$('btn-search').addEventListener('click', () => openSearch());
$('btn-fit-all').addEventListener('click', fitAll);
$('btn-auto-layout').addEventListener('click', autoLayout);
$('btn-reset-zoom').addEventListener('click', () => {
  S.zoom=1; S.canvasX=0; S.canvasY=0; updateTransform();
});
// Office view disabled for now
// $('btn-office-view')?.addEventListener('click', () => { vscode.postMessage({ type:'openPixelAgents' }); });
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

// ==================== TERMINAL SELECTION ====================
function toggleSelectTerminal(id) {
  if (S.selectedTerminals.has(id)) {
    S.selectedTerminals.delete(id);
  } else {
    S.selectedTerminals.add(id);
  }
  updateSelectionUI();
}

function clearSelection() {
  S.selectedTerminals.clear();
  updateSelectionUI();
}

function updateSelectionUI() {
  document.querySelectorAll('.terminal-card').forEach(c => {
    const tid = c.id.replace('term-', '');
    c.classList.toggle('selected', S.selectedTerminals.has(tid));
  });
  // Enable/disable group button based on selection
  const groupBtn = $('btn-group');
  if (groupBtn) {
    if (S.selectedTerminals.size >= 1) {
      groupBtn.removeAttribute('disabled');
    } else {
      groupBtn.setAttribute('disabled', '');
    }
  }
}

// ==================== GROUPS ====================
function createGroup(name, color, terminalIds) {
  S.groupCounter++;
  const id = 'group_' + S.groupCounter + '_' + Date.now();
  const group = { id, name, color, terminalIds: new Set(terminalIds) };
  S.groups.set(id, group);
  renderGroupFrame(group);
  renderGroupNav();
  autoSaveLayout();
  return group;
}

function deleteGroup(groupId) {
  const frame = document.getElementById('gframe-' + groupId);
  if (frame) frame.remove();
  S.groups.delete(groupId);
  renderGroupNav();
  autoSaveLayout();
}

function ungroupTerminal(termId) {
  for (const [gid, g] of S.groups) {
    if (g.terminalIds.has(termId)) {
      g.terminalIds.delete(termId);
      if (g.terminalIds.size === 0) {
        deleteGroup(gid);
      } else {
        updateGroupFrame(g);
      }
    }
  }
  renderGroupNav();
  autoSaveLayout();
}

function getGroupBounds(group) {
  const pad = 20;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let count = 0;
  for (const tid of group.terminalIds) {
    const t = S.terminals.get(tid);
    if (!t) continue;
    minX = Math.min(minX, t.x);
    minY = Math.min(minY, t.y);
    maxX = Math.max(maxX, t.x + t.w);
    maxY = Math.max(maxY, t.y + t.h);
    count++;
  }
  if (count === 0) return null;
  return { x: minX - pad, y: minY - pad - 20, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 + 20 };
}

function renderGroupFrame(group) {
  let frame = document.getElementById('gframe-' + group.id);
  if (!frame) {
    frame = document.createElement('div');
    frame.className = 'group-frame';
    frame.id = 'gframe-' + group.id;
    // Insert at start of canvas so it's behind terminal cards
    canvasEl.insertBefore(frame, canvasEl.firstChild);
  }

  const bounds = getGroupBounds(group);
  if (!bounds) { frame.style.display = 'none'; return; }

  frame.style.display = '';
  frame.style.left = bounds.x + 'px';
  frame.style.top = bounds.y + 'px';
  frame.style.width = bounds.w + 'px';
  frame.style.height = bounds.h + 'px';
  frame.style.borderColor = group.color;
  frame.style.background = group.color + '10';

  // Label
  let label = frame.querySelector('.group-frame-label');
  if (!label) {
    label = document.createElement('div');
    label.className = 'group-frame-label';
    label.addEventListener('dblclick', () => openGroupModal(group.id));
    frame.appendChild(label);
  }
  label.textContent = group.name;
  label.style.background = group.color;
  label.style.color = isLightColor(group.color) ? '#000' : '#fff';
}

function updateGroupFrame(group) {
  renderGroupFrame(group);
}

function updateAllGroupFrames() {
  for (const [_, g] of S.groups) {
    updateGroupFrame(g);
  }
}

function isLightColor(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return (r*0.299 + g*0.587 + b*0.114) > 150;
}

// ==================== GROUP NAV ====================
function renderGroupNav() {
  const nav = $('group-nav');
  nav.innerHTML = '';
  for (const [_, g] of S.groups) {
    const btn = document.createElement('button');
    btn.className = 'group-nav-btn';
    btn.style.borderColor = g.color;
    btn.innerHTML = '<span class="gnb-dot" style="background:' + g.color + '"></span>' +
      escHtml(g.name) +
      '<span class="gnb-count">' + g.terminalIds.size + '</span>';
    btn.addEventListener('click', () => navigateToGroup(g.id));
    btn.addEventListener('dblclick', () => openGroupModal(g.id));
    nav.appendChild(btn);
  }
}

function navigateToGroup(groupId) {
  const group = S.groups.get(groupId);
  if (!group) return;
  const bounds = getGroupBounds(group);
  if (!bounds) return;

  const vw = canvasContainer.clientWidth;
  const vh = canvasContainer.clientHeight;
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;

  // Zoom to fit the group with some padding
  const padFactor = 1.3;
  const zoomW = vw / (bounds.w * padFactor);
  const zoomH = vh / (bounds.h * padFactor);
  S.zoom = Math.min(1, Math.min(zoomW, zoomH));

  S.canvasX = vw / 2 - cx * S.zoom;
  S.canvasY = vh / 2 - cy * S.zoom;
  updateTransform();
  updateMinimap();
}

// ==================== GROUP MODAL ====================
function openGroupModal(existingGroupId) {
  const modal = $('group-modal');
  const nameInput = $('group-name-input');
  const title = $('group-modal-title');
  const deleteBtn = $('group-delete-btn');
  const picker = $('group-color-picker');

  S.editingGroupId = existingGroupId || null;

  if (existingGroupId) {
    const g = S.groups.get(existingGroupId);
    title.textContent = 'Edit Group';
    nameInput.value = g ? g.name : '';
    deleteBtn.style.display = '';
    renderColorPicker(picker, g ? g.color : GROUP_COLORS[0]);
  } else {
    title.textContent = 'Create Group';
    nameInput.value = '';
    deleteBtn.style.display = 'none';
    const colorIdx = S.groups.size % GROUP_COLORS.length;
    renderColorPicker(picker, GROUP_COLORS[colorIdx]);
  }

  modal.classList.add('visible');
  nameInput.focus();
}

function renderColorPicker(container, activeColor) {
  container.innerHTML = '';
  for (const c of GROUP_COLORS) {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (c === activeColor ? ' active' : '');
    swatch.style.background = c;
    swatch.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
    container.appendChild(swatch);
  }
}

function getSelectedColor() {
  const active = document.querySelector('#group-color-picker .color-swatch.active');
  return active ? active.style.background : GROUP_COLORS[0];
}

$('group-save-btn').addEventListener('click', () => {
  const name = $('group-name-input').value.trim() || 'Untitled Group';
  const color = rgbToHex(getSelectedColor());

  if (S.editingGroupId) {
    // Edit existing group
    const g = S.groups.get(S.editingGroupId);
    if (g) {
      g.name = name;
      g.color = color;
      updateGroupFrame(g);
      renderGroupNav();
      autoSaveLayout();
    }
  } else {
    // Create new group from selected terminals
    const ids = [...S.selectedTerminals];
    if (ids.length === 0) { $('group-modal').classList.remove('visible'); return; }
    createGroup(name, color, ids);
    clearSelection();
  }
  $('group-modal').classList.remove('visible');
});

$('group-cancel-btn').addEventListener('click', () => {
  $('group-modal').classList.remove('visible');
});

$('group-delete-btn').addEventListener('click', () => {
  if (S.editingGroupId) {
    deleteGroup(S.editingGroupId);
  }
  $('group-modal').classList.remove('visible');
});

function rgbToHex(color) {
  if (color.startsWith('#')) return color;
  const match = color.match(/\\d+/g);
  if (!match || match.length < 3) return color;
  return '#' + match.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
}

// ==================== TOOLBAR GROUP BUTTONS ====================
$('btn-group').addEventListener('click', () => {
  if (S.selectedTerminals.size > 0) {
    openGroupModal(null);
  }
});

$('btn-ungroup').addEventListener('click', () => {
  if (S.focusedTerminal) {
    ungroupTerminal(S.focusedTerminal);
  }
});

// ==================== AUTO LAYOUT ====================
function autoLayout() {
  const terms = [...S.terminals.values()];
  if (terms.length === 0) return;

  const gap = 30;
  const vw = canvasContainer.clientWidth;
  const vh = canvasContainer.clientHeight;

  if (terms.length === 1) {
    // Single terminal: center it
    const t = terms[0];
    t.x = 50;
    t.y = 50;
    applyTerminalPosition(t);
    fitAll();
    autoSaveLayout();
    return;
  }

  // Calculate the ideal number of columns based on viewport aspect ratio
  // and terminal count - try to make a roughly rectangular grid
  const avgW = terms.reduce((s, t) => s + t.w, 0) / terms.length;
  const avgH = terms.reduce((s, t) => s + t.h, 0) / terms.length;
  const aspectRatio = vw / vh;
  let cols = Math.max(1, Math.round(Math.sqrt(terms.length * aspectRatio * (avgH / avgW))));
  cols = Math.min(cols, terms.length);

  // Sort terminals: larger ones first for better packing
  terms.sort((a, b) => (b.w * b.h) - (a.w * a.h));

  // Row-based packing: fill each row left-to-right, track row height
  const rows = [];     // array of { terms: [], maxH: number }
  let currentRow = { terms: [], maxH: 0 };
  let colCount = 0;

  for (const t of terms) {
    if (colCount >= cols && currentRow.terms.length > 0) {
      rows.push(currentRow);
      currentRow = { terms: [], maxH: 0 };
      colCount = 0;
    }
    currentRow.terms.push(t);
    currentRow.maxH = Math.max(currentRow.maxH, t.h);
    colCount++;
  }
  if (currentRow.terms.length > 0) rows.push(currentRow);

  // Position each terminal
  let cursorY = 50;
  for (const row of rows) {
    // Calculate total width needed for this row
    const totalRowW = row.terms.reduce((s, t) => s + t.w, 0) + gap * (row.terms.length - 1);

    // Start x: center the row
    let cursorX = 50;

    for (const t of row.terms) {
      t.x = cursorX;
      t.y = cursorY;
      applyTerminalPosition(t);
      cursorX += t.w + gap;
    }
    cursorY += row.maxH + gap;
  }

  // Animate into view
  fitAll();
  updateMinimap();
  updateConnectionLines();
  updateAllGroupFrames();
  autoSaveLayout();
}

function applyTerminalPosition(t) {
  const card = document.getElementById('term-' + t.id);
  if (card) {
    card.style.left = t.x + 'px';
    card.style.top = t.y + 'px';
    card.style.width = t.w + 'px';
    card.style.height = t.h + 'px';
  }
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
  if (!S.presetCounters) S.presetCounters = {};
  const dock = $('preset-dock');
  dock.innerHTML = '';
  const icons = { terminal:'⬛', code:'📝', edit:'✏️', server:'🖥️', database:'🗄️' };
  for (const p of presets) {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.innerHTML = '<span class="preset-icon">'+(icons[p.icon]||'⬛')+'</span>' + escHtml(p.name);
    btn.addEventListener('click', () => {
      S.presetCounters[p.name] = (S.presetCounters[p.name]||0) + 1;
      const num = S.presetCounters[p.name];
      vscode.postMessage({ type:'createTerminal', name:p.name+' '+num, command:p.command||'' });
    });
    dock.appendChild(btn);
  }
  const addBtn = document.createElement('button');
  addBtn.className = 'preset-btn';
  addBtn.innerHTML = '<span class="preset-icon">➕</span>';
  addBtn.title = 'New terminal';
  addBtn.addEventListener('click', () => {
    S.presetCounters['Terminal'] = (S.presetCounters['Terminal']||0) + 1;
    vscode.postMessage({ type:'createTerminal', name:'Terminal '+S.presetCounters['Terminal'], command:'' });
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
    const groups = [];
    for (const [id, g] of S.groups) {
      groups.push({ id:g.id, name:g.name, color:g.color, terminalIds:[...g.terminalIds] });
    }
    vscode.postMessage({ type:'saveLayout', layout:{ terminals, groups, canvasX:S.canvasX, canvasY:S.canvasY, zoom:S.zoom }});
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
  // Restore groups after a short delay to let terminals be created
  if (layout.groups && layout.groups.length) {
    setTimeout(() => {
      for (const g of layout.groups) {
        // Only include terminal IDs that actually exist
        const validIds = g.terminalIds.filter(tid => S.terminals.has(tid));
        if (validIds.length > 0) {
          const group = { id: g.id, name: g.name, color: g.color, terminalIds: new Set(validIds) };
          S.groups.set(g.id, group);
          // Track groupCounter
          const match = g.id.match(/group_(\\d+)/);
          if (match) S.groupCounter = Math.max(S.groupCounter, parseInt(match[1]));
          renderGroupFrame(group);
        }
      }
      renderGroupNav();
    }, 500);
  }
}

// ==================== PIXEL OFFICE (external via pixel-agents) ====================

// Stubs - office view is handled by pixel-agents extension
function officeAddWorker() {}
function officeRemoveWorker() {}
function officeSetStatus() {}

// END PIXEL OFFICE STUBS
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
  // Don't capture if typing in terminal (xterm.js textarea) or input
  const active = document.activeElement;
  const inTerminal = active?.closest('.terminal-body') || (active?.tagName === 'TEXTAREA' && active?.closest('.xterm'));

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
    const modals = document.querySelectorAll('.modal.visible');
    if (modals.length) {
      modals.forEach(m => m.classList.remove('visible'));
    } else if (S.selectedTerminals.size > 0) {
      clearSelection();
    }
  }
  // Ctrl/Cmd+G to group selected
  if (!inTerminal && (e.ctrlKey||e.metaKey) && e.key === 'g') {
    e.preventDefault();
    if (S.selectedTerminals.size > 0) openGroupModal(null);
  }
});

// ==================== THEME OBSERVER ====================
// Update xterm themes when VS Code theme changes
new MutationObserver(() => {
  const cs = getComputedStyle(document.body);
  const theme = {
    background: cs.getPropertyValue('--term-bg').trim(),
    foreground: cs.getPropertyValue('--term-fg').trim(),
    cursor: cs.getPropertyValue('--cursor').trim(),
    selectionBackground: cs.getPropertyValue('--selection').trim(),
  };
  for (const [_, t] of S.terminals) {
    if (t.xterm) t.xterm.options.theme = theme;
  }
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

// ==================== INIT ====================
updateTransform();
vscode.postMessage({ type:'requestPresets' });
vscode.postMessage({ type:'requestLayout' });
`;
