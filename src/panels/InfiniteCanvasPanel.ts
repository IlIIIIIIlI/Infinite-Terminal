import * as vscode from 'vscode';
import * as path from 'path';
import { WorktreeManager } from '../worktree/WorktreeManager';

interface TerminalSession {
  id: string;
  name: string;
  command: string;
  cwd: string;
  vscodeTerminal?: vscode.Terminal;
}

export class InfiniteCanvasPanel {
  public static currentPanel: InfiniteCanvasPanel | undefined;
  private static readonly viewType = 'infiniteTerminal.canvas';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private readonly _worktreeManager: WorktreeManager;
  private _disposables: vscode.Disposable[] = [];
  private _terminals: Map<string, TerminalSession> = new Map();
  private _terminalCounter = 0;

  public static createOrShow(
    context: vscode.ExtensionContext,
    worktreeManager: WorktreeManager
  ): InfiniteCanvasPanel {
    const column = vscode.ViewColumn.One;

    if (InfiniteCanvasPanel.currentPanel) {
      InfiniteCanvasPanel.currentPanel._panel.reveal(column);
      return InfiniteCanvasPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      InfiniteCanvasPanel.viewType,
      '∞ Infinite Terminal',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'media'),
          vscode.Uri.joinPath(context.extensionUri, 'dist')
        ]
      }
    );

    InfiniteCanvasPanel.currentPanel = new InfiniteCanvasPanel(panel, context, worktreeManager);
    return InfiniteCanvasPanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    worktreeManager: WorktreeManager
  ) {
    this._panel = panel;
    this._context = context;
    this._worktreeManager = worktreeManager;

    this._panel.webview.html = this._getHtmlForWebview();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    vscode.commands.executeCommand('setContext', 'infiniteTerminal.canvasActive', true);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'createTerminal':
            this._doCreateTerminal(message.name, message.command, message.cwd);
            break;
          case 'closeTerminal':
            this._closeTerminal(message.id);
            break;
          case 'terminalInput':
            this._sendToTerminal(message.id, message.data);
            break;
          case 'requestPresets':
            this._sendPresets();
            break;
          case 'createWorktree':
            this.createWorktreeTerminal(message.branch);
            break;
          case 'resizeTerminal':
            // Handle terminal resize
            break;
        }
      },
      null,
      this._disposables
    );

    // Listen for terminal data from VS Code terminals
    vscode.window.onDidCloseTerminal((terminal) => {
      for (const [id, session] of this._terminals) {
        if (session.vscodeTerminal === terminal) {
          this._panel.webview.postMessage({ type: 'terminalClosed', id });
          this._terminals.delete(id);
          break;
        }
      }
    }, null, this._disposables);
  }

  public createTerminal(name?: string, command?: string, cwd?: string) {
    this._panel.webview.postMessage({
      type: 'triggerCreateTerminal',
      name: name || 'Terminal',
      command: command || '',
      cwd: cwd || ''
    });
  }

  private _doCreateTerminal(name?: string, command?: string, cwd?: string) {
    this._terminalCounter++;
    const id = `term_${this._terminalCounter}_${Date.now()}`;
    const termName = name || `Terminal ${this._terminalCounter}`;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const termCwd = cwd || workspaceFolder || process.env.HOME || '/';

    const shellPath = command || undefined;

    const terminal = vscode.window.createTerminal({
      name: `∞ ${termName}`,
      cwd: termCwd,
      shellPath: shellPath || undefined,
    });

    const session: TerminalSession = {
      id,
      name: termName,
      command: command || '',
      cwd: termCwd,
      vscodeTerminal: terminal
    };

    this._terminals.set(id, session);

    // Notify webview
    this._panel.webview.postMessage({
      type: 'terminalCreated',
      id,
      name: termName,
      cwd: termCwd
    });

    // Set up data forwarding using writeEmitter approach
    // We'll use a pseudo-terminal approach for data capture in a future version
    // For now terminals are managed via VS Code's terminal API
  }

  private _closeTerminal(id: string) {
    const session = this._terminals.get(id);
    if (session?.vscodeTerminal) {
      session.vscodeTerminal.dispose();
    }
    this._terminals.delete(id);
  }

  private _sendToTerminal(id: string, data: string) {
    const session = this._terminals.get(id);
    if (session?.vscodeTerminal) {
      session.vscodeTerminal.sendText(data, false);
    }
  }

  private _sendPresets() {
    const config = vscode.workspace.getConfiguration('infiniteTerminal');
    const presets = config.get('presets') || [];
    this._panel.webview.postMessage({ type: 'presets', presets });
  }

  public toggleOfficeView() {
    this._panel.webview.postMessage({ type: 'toggleOfficeView' });
  }

  public async createWorktreeTerminal(branchName: string) {
    const info = await this._worktreeManager.createWorktree(branchName);
    if (info) {
      this.createTerminal(`🌿 ${branchName}`, undefined, info.path);
      vscode.window.showInformationMessage(
        `Worktree created: ${info.path} (branch: ${branchName})`
      );
    }
  }

  private dispose() {
    InfiniteCanvasPanel.currentPanel = undefined;
    vscode.commands.executeCommand('setContext', 'infiniteTerminal.canvasActive', false);

    for (const [_, session] of this._terminals) {
      session.vscodeTerminal?.dispose();
    }
    this._terminals.clear();

    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      d?.dispose();
    }
  }

  private _getHtmlForWebview(): string {
    const nonce = getNonce();
    return getWebviewContent(nonce);
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getWebviewContent(nonce: string): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src data:;">
  <title>Infinite Terminal</title>
  <style>
    :root {
      --bg-color: #1e1e1e;
      --surface-color: #252526;
      --border-color: #3c3c3c;
      --text-color: #cccccc;
      --accent-color: #007acc;
      --accent-hover: #1a8ad4;
      --terminal-bg: #0e0e0e;
      --header-bg: #2d2d2d;
      --danger-color: #f44747;
      --success-color: #4ec9b0;
      --warning-color: #dcdcaa;
      --grid-color: rgba(255,255,255,0.03);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: var(--bg-color);
      color: var(--text-color);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      user-select: none;
    }

    /* ===== CANVAS ===== */
    #canvas-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      cursor: grab;
    }
    #canvas-container.dragging-canvas { cursor: grabbing; }
    #canvas-container.dragging-terminal { cursor: move; }

    #canvas {
      position: absolute;
      top: 0; left: 0;
      transform-origin: 0 0;
      /* Grid pattern drawn via JS */
    }

    /* ===== TOOLBAR ===== */
    #toolbar {
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 6px 10px;
      z-index: 1000;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }

    .toolbar-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-color);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s;
    }
    .toolbar-btn:hover {
      background: var(--border-color);
      border-color: var(--accent-color);
    }
    .toolbar-btn.active {
      background: var(--accent-color);
      color: white;
    }

    .toolbar-sep {
      width: 1px;
      background: var(--border-color);
      margin: 2px 4px;
    }

    /* ===== TERMINAL CARD ===== */
    .terminal-card {
      position: absolute;
      min-width: 350px;
      min-height: 220px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.2s;
    }
    .terminal-card:hover {
      box-shadow: 0 6px 28px rgba(0,0,0,0.6);
    }
    .terminal-card.focused {
      border-color: var(--accent-color);
      box-shadow: 0 0 0 1px var(--accent-color), 0 6px 28px rgba(0,0,0,0.6);
    }

    .terminal-header {
      display: flex;
      align-items: center;
      padding: 6px 10px;
      background: var(--header-bg);
      cursor: move;
      gap: 8px;
      flex-shrink: 0;
    }

    .terminal-status {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--success-color);
      flex-shrink: 0;
    }
    .terminal-status.idle { background: var(--warning-color); }
    .terminal-status.dead { background: var(--danger-color); }

    .terminal-title {
      flex: 1;
      font-size: 12px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .terminal-cwd {
      font-size: 10px;
      color: #888;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .terminal-close {
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .terminal-close:hover { background: var(--danger-color); color: white; }

    .terminal-body {
      flex: 1;
      background: var(--terminal-bg);
      padding: 8px;
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.4;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: #d4d4d4;
      position: relative;
    }

    .terminal-body .cursor {
      display: inline-block;
      width: 7px;
      height: 15px;
      background: var(--text-color);
      animation: blink 1s step-end infinite;
      vertical-align: text-bottom;
    }

    @keyframes blink {
      50% { opacity: 0; }
    }

    .terminal-input-line {
      display: flex;
      align-items: center;
    }

    .terminal-prompt {
      color: var(--success-color);
      margin-right: 6px;
    }

    .terminal-input {
      background: transparent;
      border: none;
      color: #d4d4d4;
      font-family: inherit;
      font-size: inherit;
      outline: none;
      flex: 1;
      caret-color: var(--text-color);
    }

    /* ===== RESIZE HANDLE ===== */
    .terminal-resize {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: nwse-resize;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .terminal-card:hover .terminal-resize { opacity: 1; }
    .terminal-resize::after {
      content: '';
      position: absolute;
      right: 3px;
      bottom: 3px;
      width: 8px;
      height: 8px;
      border-right: 2px solid #666;
      border-bottom: 2px solid #666;
    }

    /* ===== MINIMAP ===== */
    #minimap {
      position: fixed;
      bottom: 16px;
      right: 16px;
      width: 200px;
      height: 150px;
      background: rgba(30,30,30,0.9);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      z-index: 999;
      overflow: hidden;
      opacity: 0;
      transform: scale(0.9) translateY(10px);
      transition: opacity 0.25s, transform 0.25s;
      pointer-events: none;
    }
    #minimap.visible {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    #minimap canvas {
      width: 100%;
      height: 100%;
    }

    /* ===== PRESET DOCK ===== */
    #preset-dock {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 8px 14px;
      z-index: 1000;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }

    .preset-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-color);
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.15s;
    }
    .preset-btn:hover {
      background: var(--border-color);
      border-color: var(--accent-color);
      transform: translateY(-2px);
    }
    .preset-icon {
      font-size: 20px;
    }

    /* ===== OFFICE VIEW ===== */
    #office-view {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 2000;
      display: none;
      background: #2a1f3d;
    }
    #office-view.visible { display: block; }
    #office-canvas {
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
    }

    #office-toolbar {
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
      background: rgba(40,30,60,0.9);
      border: 1px solid rgba(100,80,140,0.5);
      border-radius: 8px;
      padding: 6px 10px;
      z-index: 2001;
    }

    /* ===== CONNECTION LINES ===== */
    .connection-line {
      position: absolute;
      pointer-events: none;
      z-index: -1;
    }

    /* ===== ZOOM INDICATOR ===== */
    #zoom-indicator {
      position: fixed;
      bottom: 16px;
      left: 16px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      z-index: 999;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div id="canvas-container">
    <div id="canvas"></div>
  </div>

  <div id="toolbar">
    <button class="toolbar-btn" id="btn-new-terminal" title="New Terminal (Ctrl+Shift+N)">
      ⬛ New Terminal
    </button>
    <button class="toolbar-btn" id="btn-new-worktree" title="New Git Worktree Terminal">
      🌿 Worktree
    </button>
    <div class="toolbar-sep"></div>
    <button class="toolbar-btn" id="btn-fit-all" title="Fit All Terminals">
      ⊞ Fit All
    </button>
    <button class="toolbar-btn" id="btn-reset-zoom" title="Reset Zoom">
      🔍 100%
    </button>
    <div class="toolbar-sep"></div>
    <button class="toolbar-btn" id="btn-office-view" title="Toggle Pixel Office View">
      🏢 Office
    </button>
  </div>

  <div id="preset-dock"></div>

  <div id="minimap">
    <canvas id="minimap-canvas"></canvas>
  </div>

  <div id="zoom-indicator">100%</div>

  <!-- Office View Overlay -->
  <div id="office-view">
    <canvas id="office-canvas"></canvas>
    <div id="office-toolbar">
      <button class="toolbar-btn" id="btn-close-office">← Back to Canvas</button>
      <button class="toolbar-btn" id="btn-new-terminal-office">⬛ New Terminal</button>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    // ===================== STATE =====================
    const state = {
      terminals: new Map(),
      canvasX: 0,
      canvasY: 0,
      zoom: 1,
      isDraggingCanvas: false,
      isDraggingTerminal: false,
      dragTarget: null,
      dragOffsetX: 0,
      dragOffsetY: 0,
      lastMouseX: 0,
      lastMouseY: 0,
      nextTermX: 50,
      nextTermY: 50,
      officeViewActive: false,
      focusedTerminal: null,
      isResizing: false,
      resizeTarget: null,
      resizeStartW: 0,
      resizeStartH: 0,
      resizeStartX: 0,
      resizeStartY: 0,
    };

    const canvasContainer = document.getElementById('canvas-container');
    const canvas = document.getElementById('canvas');
    const minimapEl = document.getElementById('minimap');
    const minimapCanvas = document.getElementById('minimap-canvas');
    const minimapCtx = minimapCanvas.getContext('2d');
    const zoomIndicator = document.getElementById('zoom-indicator');

    // ===================== CANVAS TRANSFORM =====================
    function updateCanvasTransform() {
      canvas.style.transform = \`translate(\${state.canvasX}px, \${state.canvasY}px) scale(\${state.zoom})\`;
      zoomIndicator.textContent = Math.round(state.zoom * 100) + '%';
      document.getElementById('btn-reset-zoom').textContent = '🔍 ' + Math.round(state.zoom * 100) + '%';
    }

    // ===================== GRID =====================
    function drawGrid() {
      // CSS grid background on canvas container
      const gridSize = 40 * state.zoom;
      const offsetX = state.canvasX % gridSize;
      const offsetY = state.canvasY % gridSize;
      canvasContainer.style.backgroundImage =
        \`linear-gradient(var(--grid-color) 1px, transparent 1px),
         linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)\`;
      canvasContainer.style.backgroundSize = \`\${gridSize}px \${gridSize}px\`;
      canvasContainer.style.backgroundPosition = \`\${offsetX}px \${offsetY}px\`;
    }

    // ===================== MINIMAP =====================
    function updateMinimap() {
      const W = minimapCanvas.width = 200;
      const H = minimapCanvas.height = 150;
      minimapCtx.clearRect(0, 0, W, H);

      const terms = [...state.terminals.values()];
      if (terms.length === 0) return;

      // Find bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const t of terms) {
        minX = Math.min(minX, t.x);
        minY = Math.min(minY, t.y);
        maxX = Math.max(maxX, t.x + t.w);
        maxY = Math.max(maxY, t.y + t.h);
      }

      const padding = 100;
      minX -= padding; minY -= padding;
      maxX += padding; maxY += padding;

      const scaleX = W / (maxX - minX);
      const scaleY = H / (maxY - minY);
      const scale = Math.min(scaleX, scaleY);

      // Draw terminal rectangles
      for (const t of terms) {
        const rx = (t.x - minX) * scale;
        const ry = (t.y - minY) * scale;
        const rw = t.w * scale;
        const rh = t.h * scale;
        minimapCtx.fillStyle = t.id === state.focusedTerminal ? '#007acc' : '#4a4a4a';
        minimapCtx.fillRect(rx, ry, Math.max(rw, 2), Math.max(rh, 2));
        minimapCtx.strokeStyle = '#666';
        minimapCtx.strokeRect(rx, ry, Math.max(rw, 2), Math.max(rh, 2));
      }

      // Draw viewport
      const vw = canvasContainer.clientWidth;
      const vh = canvasContainer.clientHeight;
      const vpX = (-state.canvasX / state.zoom - minX) * scale;
      const vpY = (-state.canvasY / state.zoom - minY) * scale;
      const vpW = (vw / state.zoom) * scale;
      const vpH = (vh / state.zoom) * scale;

      minimapCtx.strokeStyle = '#007acc';
      minimapCtx.lineWidth = 2;
      minimapCtx.strokeRect(vpX, vpY, vpW, vpH);
      minimapCtx.fillStyle = 'rgba(0,122,204,0.1)';
      minimapCtx.fillRect(vpX, vpY, vpW, vpH);
    }

    // ===================== TERMINAL CREATION =====================
    let terminalIdCounter = 0;

    function createTerminalCard(id, name, cwd) {
      const config = { w: 600, h: 400 };
      const x = state.nextTermX;
      const y = state.nextTermY;
      state.nextTermX += 40;
      state.nextTermY += 40;

      const termData = { id, name, cwd, x, y, w: config.w, h: config.h, status: 'active', output: '', history: [] };
      state.terminals.set(id, termData);

      const card = document.createElement('div');
      card.className = 'terminal-card';
      card.id = \`term-\${id}\`;
      card.style.left = x + 'px';
      card.style.top = y + 'px';
      card.style.width = config.w + 'px';
      card.style.height = config.h + 'px';

      card.innerHTML = \`
        <div class="terminal-header" data-id="\${id}">
          <div class="terminal-status active"></div>
          <span class="terminal-title">\${escapeHtml(name)}</span>
          <span class="terminal-cwd">\${escapeHtml(cwd || '')}</span>
          <button class="terminal-close" data-id="\${id}">✕</button>
        </div>
        <div class="terminal-body" data-id="\${id}">
          <div class="terminal-output"></div>
          <div class="terminal-input-line">
            <span class="terminal-prompt">❯</span>
            <input class="terminal-input" type="text" data-id="\${id}" placeholder="Type command..." autofocus />
          </div>
        </div>
        <div class="terminal-resize" data-id="\${id}"></div>
      \`;

      canvas.appendChild(card);

      // Events
      const header = card.querySelector('.terminal-header');
      header.addEventListener('mousedown', (e) => startDragTerminal(e, id));

      const closeBtn = card.querySelector('.terminal-close');
      closeBtn.addEventListener('click', () => closeTerminal(id));

      const input = card.querySelector('.terminal-input');
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = input.value;
          input.value = '';
          appendOutput(id, \`❯ \${cmd}\\n\`);
          termData.history.push(cmd);
          vscode.postMessage({ type: 'terminalInput', id, data: cmd + '\\n' });
          // Simulate some output for visual feedback
          termData.status = 'active';
          updateTerminalStatus(id);
        }
      });

      card.addEventListener('mousedown', () => focusTerminal(id));

      // Resize
      const resizeHandle = card.querySelector('.terminal-resize');
      resizeHandle.addEventListener('mousedown', (e) => startResize(e, id));

      focusTerminal(id);
      updateMinimap();
      return card;
    }

    function appendOutput(id, text) {
      const card = document.getElementById(\`term-\${id}\`);
      if (!card) return;
      const output = card.querySelector('.terminal-output');
      output.textContent += text;
      const body = card.querySelector('.terminal-body');
      body.scrollTop = body.scrollHeight;
    }

    function focusTerminal(id) {
      // Unfocus all
      document.querySelectorAll('.terminal-card.focused').forEach(c => c.classList.remove('focused'));
      const card = document.getElementById(\`term-\${id}\`);
      if (card) {
        card.classList.add('focused');
        card.style.zIndex = ++terminalIdCounter + 10;
        state.focusedTerminal = id;
      }
    }

    function closeTerminal(id) {
      const card = document.getElementById(\`term-\${id}\`);
      if (card) card.remove();
      state.terminals.delete(id);
      vscode.postMessage({ type: 'closeTerminal', id });
      updateMinimap();
      // Also remove from office view
      if (state.officeViewActive) officeRemoveWorker(id);
    }

    function updateTerminalStatus(id) {
      const termData = state.terminals.get(id);
      if (!termData) return;
      const card = document.getElementById(\`term-\${id}\`);
      if (!card) return;
      const dot = card.querySelector('.terminal-status');
      dot.className = 'terminal-status ' + termData.status;
    }

    // ===================== DRAG TERMINALS =====================
    function startDragTerminal(e, id) {
      if (e.button !== 0) return;
      e.stopPropagation();
      const termData = state.terminals.get(id);
      if (!termData) return;

      state.isDraggingTerminal = true;
      state.dragTarget = id;
      state.dragOffsetX = (e.clientX - state.canvasX) / state.zoom - termData.x;
      state.dragOffsetY = (e.clientY - state.canvasY) / state.zoom - termData.y;
      canvasContainer.classList.add('dragging-terminal');
      focusTerminal(id);
    }

    // ===================== RESIZE =====================
    function startResize(e, id) {
      e.stopPropagation();
      e.preventDefault();
      const termData = state.terminals.get(id);
      if (!termData) return;

      state.isResizing = true;
      state.resizeTarget = id;
      state.resizeStartW = termData.w;
      state.resizeStartH = termData.h;
      state.resizeStartX = e.clientX;
      state.resizeStartY = e.clientY;
    }

    // ===================== CANVAS PAN =====================
    canvasContainer.addEventListener('mousedown', (e) => {
      if (e.target === canvasContainer || e.target === canvas) {
        if (e.button === 0) {
          state.isDraggingCanvas = true;
          state.lastMouseX = e.clientX;
          state.lastMouseY = e.clientY;
          canvasContainer.classList.add('dragging-canvas');
          minimapEl.classList.add('visible');
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (state.isDraggingCanvas) {
        const dx = e.clientX - state.lastMouseX;
        const dy = e.clientY - state.lastMouseY;
        state.canvasX += dx;
        state.canvasY += dy;
        state.lastMouseX = e.clientX;
        state.lastMouseY = e.clientY;
        updateCanvasTransform();
        drawGrid();
        updateMinimap();
      }

      if (state.isDraggingTerminal && state.dragTarget) {
        const termData = state.terminals.get(state.dragTarget);
        if (!termData) return;
        termData.x = (e.clientX - state.canvasX) / state.zoom - state.dragOffsetX;
        termData.y = (e.clientY - state.canvasY) / state.zoom - state.dragOffsetY;
        const card = document.getElementById(\`term-\${state.dragTarget}\`);
        if (card) {
          card.style.left = termData.x + 'px';
          card.style.top = termData.y + 'px';
        }
        minimapEl.classList.add('visible');
        updateMinimap();
      }

      if (state.isResizing && state.resizeTarget) {
        const termData = state.terminals.get(state.resizeTarget);
        if (!termData) return;
        const dx = (e.clientX - state.resizeStartX) / state.zoom;
        const dy = (e.clientY - state.resizeStartY) / state.zoom;
        termData.w = Math.max(350, state.resizeStartW + dx);
        termData.h = Math.max(220, state.resizeStartH + dy);
        const card = document.getElementById(\`term-\${state.resizeTarget}\`);
        if (card) {
          card.style.width = termData.w + 'px';
          card.style.height = termData.h + 'px';
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (state.isDraggingCanvas) {
        state.isDraggingCanvas = false;
        canvasContainer.classList.remove('dragging-canvas');
        // Hide minimap with delay
        setTimeout(() => {
          if (!state.isDraggingCanvas && !state.isDraggingTerminal) {
            minimapEl.classList.remove('visible');
          }
        }, 1500);
      }
      if (state.isDraggingTerminal) {
        state.isDraggingTerminal = false;
        state.dragTarget = null;
        canvasContainer.classList.remove('dragging-terminal');
        setTimeout(() => {
          if (!state.isDraggingCanvas && !state.isDraggingTerminal) {
            minimapEl.classList.remove('visible');
          }
        }, 1500);
      }
      if (state.isResizing) {
        state.isResizing = false;
        state.resizeTarget = null;
      }
    });

    // ===================== ZOOM =====================
    canvasContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, state.zoom * delta));

      // Zoom toward cursor
      const mx = e.clientX;
      const my = e.clientY;
      state.canvasX = mx - (mx - state.canvasX) * (newZoom / state.zoom);
      state.canvasY = my - (my - state.canvasY) * (newZoom / state.zoom);
      state.zoom = newZoom;

      updateCanvasTransform();
      drawGrid();
      updateMinimap();
    }, { passive: false });

    // ===================== TOOLBAR =====================
    document.getElementById('btn-new-terminal').addEventListener('click', () => {
      vscode.postMessage({ type: 'createTerminal', name: 'Terminal', command: '' });
    });

    document.getElementById('btn-new-worktree').addEventListener('click', () => {
      const branch = prompt('Enter branch name for worktree:');
      if (branch) {
        vscode.postMessage({ type: 'createWorktree', branch });
      }
    });

    document.getElementById('btn-fit-all').addEventListener('click', fitAllTerminals);

    document.getElementById('btn-reset-zoom').addEventListener('click', () => {
      state.zoom = 1;
      state.canvasX = 0;
      state.canvasY = 0;
      updateCanvasTransform();
      drawGrid();
    });

    document.getElementById('btn-office-view').addEventListener('click', () => {
      toggleOfficeView();
    });

    function fitAllTerminals() {
      const terms = [...state.terminals.values()];
      if (terms.length === 0) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const t of terms) {
        minX = Math.min(minX, t.x);
        minY = Math.min(minY, t.y);
        maxX = Math.max(maxX, t.x + t.w);
        maxY = Math.max(maxY, t.y + t.h);
      }

      const padding = 60;
      const contentW = maxX - minX + padding * 2;
      const contentH = maxY - minY + padding * 2;
      const viewW = canvasContainer.clientWidth;
      const viewH = canvasContainer.clientHeight - 80; // toolbar offset

      state.zoom = Math.min(1, Math.min(viewW / contentW, viewH / contentH));
      state.canvasX = (viewW - contentW * state.zoom) / 2 - minX * state.zoom + padding * state.zoom;
      state.canvasY = (viewH - contentH * state.zoom) / 2 - minY * state.zoom + padding * state.zoom + 50;

      updateCanvasTransform();
      drawGrid();
    }

    // ===================== PRESETS DOCK =====================
    function renderPresets(presets) {
      const dock = document.getElementById('preset-dock');
      dock.innerHTML = '';

      const icons = { terminal: '⬛', code: '📝', edit: '✏️', server: '🖥️', database: '🗄️' };

      for (const p of presets) {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.innerHTML = \`<span class="preset-icon">\${icons[p.icon] || '⬛'}</span>\${escapeHtml(p.name)}\`;
        btn.addEventListener('click', () => {
          vscode.postMessage({ type: 'createTerminal', name: p.name, command: p.command || '' });
        });
        dock.appendChild(btn);
      }

      // Add custom preset button
      const addBtn = document.createElement('button');
      addBtn.className = 'preset-btn';
      addBtn.innerHTML = '<span class="preset-icon">➕</span>Custom';
      addBtn.addEventListener('click', () => {
        const name = prompt('Preset name:');
        if (!name) return;
        const cmd = prompt('Command (leave empty for default shell):') || '';
        vscode.postMessage({ type: 'createTerminal', name, command: cmd });
      });
      dock.appendChild(addBtn);
    }

    // ===================== OFFICE VIEW (Pixel Art) =====================
    const officeView = document.getElementById('office-view');
    const officeCanvas = document.getElementById('office-canvas');
    const officeCtx = officeCanvas.getContext('2d');
    let officeAnimId = null;

    const OFFICE = {
      floorY: 0,
      deskSpacing: 120,
      workers: new Map(), // id -> worker state
    };

    const PIXEL_COLORS = {
      skin: '#ffcc99',
      hair: ['#3d2314', '#8b4513', '#d2691e', '#ffd700', '#1a1a2e', '#c0c0c0'],
      shirt: ['#007acc', '#4ec9b0', '#d16969', '#dcdcaa', '#c586c0', '#569cd6'],
      pants: '#2d2d5e',
      desk: '#8b6914',
      monitor: '#1e1e1e',
      monitorScreen: '#0e0e0e',
      monitorScreenActive: '#0d3320',
      floor: '#3d3552',
      wall: '#2a2040',
      chair: '#444',
    };

    class PixelWorker {
      constructor(id, name, deskX, floorY) {
        this.id = id;
        this.name = name;
        this.deskX = deskX;
        this.x = deskX;
        this.y = floorY;
        this.floorY = floorY;
        this.state = 'working'; // working, walking, idle, done
        this.frame = 0;
        this.direction = 1; // 1=right, -1=left
        this.walkTarget = null;
        this.message = '';
        this.messageTimer = 0;
        this.hairColor = PIXEL_COLORS.hair[Math.floor(Math.random() * PIXEL_COLORS.hair.length)];
        this.shirtColor = PIXEL_COLORS.shirt[Math.floor(Math.random() * PIXEL_COLORS.shirt.length)];
        this.idleTimer = 0;
        this.actionTimer = Math.random() * 300 + 100;
        this.showMessage('Starting up...', 120);
      }

      showMessage(msg, duration) {
        this.message = msg;
        this.messageTimer = duration || 120;
      }

      update() {
        this.frame++;
        this.actionTimer--;
        if (this.messageTimer > 0) this.messageTimer--;

        if (this.state === 'working') {
          // Occasionally decide to take a break
          if (this.actionTimer <= 0) {
            if (Math.random() < 0.3) {
              this.state = 'walking';
              this.walkTarget = this.deskX + (Math.random() - 0.5) * 200;
              this.showMessage('Taking a break~', 90);
            }
            this.actionTimer = Math.random() * 400 + 200;
          }
        } else if (this.state === 'walking') {
          const speed = 0.8;
          if (Math.abs(this.x - this.walkTarget) < 2) {
            this.state = 'idle';
            this.idleTimer = Math.random() * 150 + 50;
            this.showMessage('☕', 60);
          } else {
            this.direction = this.walkTarget > this.x ? 1 : -1;
            this.x += this.direction * speed;
          }
        } else if (this.state === 'idle') {
          this.idleTimer--;
          if (this.idleTimer <= 0) {
            this.state = 'walking';
            this.walkTarget = this.deskX;
            this.showMessage('Back to work!', 90);
          }
        } else if (this.state === 'done') {
          // Celebrate
          if (this.actionTimer <= 0) {
            this.state = 'working';
            this.actionTimer = Math.random() * 300 + 100;
          }
        }

        // Walk back to desk
        if (this.state === 'walking' && this.walkTarget === this.deskX && Math.abs(this.x - this.deskX) < 2) {
          this.x = this.deskX;
          this.state = 'working';
          this.showMessage('Working...', 90);
        }
      }

      draw(ctx, scale) {
        const s = scale;
        const px = this.x * s;
        const py = this.y * s;
        const isAtDesk = this.state === 'working' || (this.state === 'done' && Math.abs(this.x - this.deskX) < 5);

        // Draw desk
        const deskPx = this.deskX * s;
        // Desk surface
        ctx.fillStyle = PIXEL_COLORS.desk;
        ctx.fillRect(deskPx - 20*s, py - 24*s, 40*s, 3*s);
        // Desk legs
        ctx.fillRect(deskPx - 18*s, py - 24*s, 3*s, 24*s);
        ctx.fillRect(deskPx + 15*s, py - 24*s, 3*s, 24*s);

        // Monitor
        ctx.fillStyle = PIXEL_COLORS.monitor;
        ctx.fillRect(deskPx - 10*s, py - 40*s, 20*s, 14*s);
        const screenActive = this.state === 'working' || this.state === 'done';
        ctx.fillStyle = screenActive ? PIXEL_COLORS.monitorScreenActive : PIXEL_COLORS.monitorScreen;
        ctx.fillRect(deskPx - 8*s, py - 38*s, 16*s, 10*s);

        // Screen text flicker
        if (screenActive && this.frame % 10 < 7) {
          ctx.fillStyle = '#4ec9b0';
          for (let i = 0; i < 3; i++) {
            const w = 4 + Math.floor(Math.random() * 8);
            ctx.fillRect(deskPx - 6*s, (py - 36*s) + i*3*s, w*s, 1*s);
          }
        }

        // Monitor stand
        ctx.fillStyle = PIXEL_COLORS.monitor;
        ctx.fillRect(deskPx - 2*s, py - 26*s, 4*s, 3*s);

        // Chair
        if (isAtDesk) {
          ctx.fillStyle = PIXEL_COLORS.chair;
          ctx.fillRect(deskPx - 8*s, py - 16*s, 16*s, 2*s);
          ctx.fillRect(deskPx - 8*s, py - 16*s, 2*s, -10*s);
          ctx.fillRect(deskPx - 6*s, py - 2*s, 3*s, 2*s);
          ctx.fillRect(deskPx + 3*s, py - 2*s, 3*s, 2*s);
        }

        // Draw character
        const cx = px;
        const cy = py;

        // Legs
        ctx.fillStyle = PIXEL_COLORS.pants;
        if (this.state === 'walking') {
          const legFrame = Math.floor(this.frame / 8) % 4;
          const legOffsets = [[-2,0,2,0],[-3,0,1,-1],[-2,0,2,0],[-1,-1,3,0]];
          const lo = legOffsets[legFrame];
          ctx.fillRect(cx + lo[0]*s, cy - 10*s + lo[1]*s, 3*s, 10*s);
          ctx.fillRect(cx + lo[2]*s, cy - 10*s + lo[3]*s, 3*s, 10*s);
        } else {
          // Sitting or standing
          ctx.fillRect(cx - 2*s, cy - 10*s, 3*s, 10*s);
          ctx.fillRect(cx + 2*s, cy - 10*s, 3*s, 10*s);
        }

        // Body
        ctx.fillStyle = this.shirtColor;
        ctx.fillRect(cx - 4*s, cy - 20*s, 10*s, 11*s);

        // Arms
        if (isAtDesk && this.state === 'working') {
          // Arms reaching toward desk
          ctx.fillRect(cx - 6*s, cy - 18*s, 3*s, 8*s);
          ctx.fillRect(cx + 5*s, cy - 18*s, 3*s, 8*s);
          // Hands on keyboard area
          ctx.fillStyle = PIXEL_COLORS.skin;
          ctx.fillRect(cx - 6*s, cy - 11*s, 3*s, 2*s);
          ctx.fillRect(cx + 5*s, cy - 11*s, 3*s, 2*s);
        } else {
          // Arms at side
          ctx.fillRect(cx - 6*s, cy - 19*s, 3*s, 10*s);
          ctx.fillRect(cx + 5*s, cy - 19*s, 3*s, 10*s);
          ctx.fillStyle = PIXEL_COLORS.skin;
          ctx.fillRect(cx - 6*s, cy - 10*s, 3*s, 2*s);
          ctx.fillRect(cx + 5*s, cy - 10*s, 3*s, 2*s);
        }

        // Head
        ctx.fillStyle = PIXEL_COLORS.skin;
        ctx.fillRect(cx - 3*s, cy - 28*s, 8*s, 8*s);

        // Hair
        ctx.fillStyle = this.hairColor;
        ctx.fillRect(cx - 3*s, cy - 30*s, 8*s, 3*s);
        if (this.direction === -1) {
          ctx.fillRect(cx + 4*s, cy - 28*s, 1*s, 4*s);
        } else {
          ctx.fillRect(cx - 3*s, cy - 28*s, 1*s, 4*s);
        }

        // Eyes
        ctx.fillStyle = '#333';
        const blinkFrame = this.frame % 120;
        if (blinkFrame > 3) {
          ctx.fillRect(cx - 1*s, cy - 25*s, 2*s, 2*s);
          ctx.fillRect(cx + 3*s, cy - 25*s, 2*s, 2*s);
        }

        // Message bubble
        if (this.message && this.messageTimer > 0) {
          const msgWidth = this.message.length * 5 * s + 8 * s;
          const msgX = cx - msgWidth / 2 + 2*s;
          const msgY = cy - 42*s;

          // Bubble
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.beginPath();
          ctx.roundRect(msgX, msgY, msgWidth, 10*s, 3*s);
          ctx.fill();

          // Tail
          ctx.fillRect(cx, msgY + 9*s, 4*s, 3*s);

          // Text
          ctx.fillStyle = '#333';
          ctx.font = \`\${Math.max(8, 7*s)}px monospace\`;
          ctx.fillText(this.message, msgX + 4*s, msgY + 8*s);
        }

        // Name tag
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = \`\${Math.max(8, 6*s)}px monospace\`;
        const nameW = ctx.measureText(this.name).width;
        ctx.fillText(this.name, cx - nameW/2 + 2*s, cy + 8*s);
      }
    }

    function officeAddWorker(id, name) {
      const workerCount = OFFICE.workers.size;
      const deskX = 80 + workerCount * OFFICE.deskSpacing;
      const worker = new PixelWorker(id, name, deskX, OFFICE.floorY);
      OFFICE.workers.set(id, worker);
    }

    function officeRemoveWorker(id) {
      OFFICE.workers.delete(id);
    }

    function officeSetWorkerStatus(id, status, message) {
      const worker = OFFICE.workers.get(id);
      if (!worker) return;
      if (status === 'done') {
        worker.state = 'done';
        worker.showMessage(message || 'Done! ✓', 180);
        worker.actionTimer = 200;
      } else if (status === 'working') {
        worker.state = 'working';
        worker.showMessage(message || 'Working...', 120);
      } else if (status === 'idle') {
        worker.state = 'idle';
        worker.idleTimer = 9999;
        worker.showMessage(message || 'Waiting...', 120);
      }
    }

    function toggleOfficeView() {
      state.officeViewActive = !state.officeViewActive;
      if (state.officeViewActive) {
        officeView.classList.add('visible');
        // Ensure all current terminals have workers
        for (const [id, t] of state.terminals) {
          if (!OFFICE.workers.has(id)) {
            officeAddWorker(id, t.name);
          }
        }
        startOfficeAnimation();
      } else {
        officeView.classList.remove('visible');
        if (officeAnimId) {
          cancelAnimationFrame(officeAnimId);
          officeAnimId = null;
        }
      }
    }

    function startOfficeAnimation() {
      const W = officeCanvas.width = officeCanvas.clientWidth;
      const H = officeCanvas.height = officeCanvas.clientHeight;
      OFFICE.floorY = H * 0.75;

      // Update existing worker floor positions
      for (const w of OFFICE.workers.values()) {
        w.floorY = OFFICE.floorY;
        w.y = OFFICE.floorY;
      }

      function render() {
        officeCtx.clearRect(0, 0, W, H);
        const scale = Math.min(W / 800, H / 400) * 1.5;

        // Background - wall
        officeCtx.fillStyle = PIXEL_COLORS.wall;
        officeCtx.fillRect(0, 0, W, OFFICE.floorY);

        // Wall detail - window
        const windowW = 60 * scale;
        const windowH = 40 * scale;
        for (let i = 0; i < 3; i++) {
          const wx = W * 0.2 + i * W * 0.3;
          const wy = OFFICE.floorY * 0.3;
          ctx2 = officeCtx;
          ctx2.fillStyle = '#1a1a3e';
          ctx2.fillRect(wx - windowW/2, wy - windowH/2, windowW, windowH);
          ctx2.fillStyle = '#2a2a5e';
          ctx2.fillRect(wx - windowW/2 + 2, wy - windowH/2 + 2, windowW - 4, windowH - 4);
          // Window frame
          ctx2.fillStyle = '#555';
          ctx2.fillRect(wx - 1, wy - windowH/2, 2, windowH);
          ctx2.fillRect(wx - windowW/2, wy - 1, windowW, 2);
        }

        // Floor
        officeCtx.fillStyle = PIXEL_COLORS.floor;
        officeCtx.fillRect(0, OFFICE.floorY, W, H - OFFICE.floorY);

        // Floor pattern
        officeCtx.fillStyle = 'rgba(255,255,255,0.02)';
        for (let x = 0; x < W; x += 20 * scale) {
          officeCtx.fillRect(x, OFFICE.floorY, 10 * scale, H - OFFICE.floorY);
        }

        // Update and draw workers
        for (const worker of OFFICE.workers.values()) {
          worker.update();
          worker.draw(officeCtx, scale);
        }

        // Title
        officeCtx.fillStyle = 'rgba(255,255,255,0.3)';
        officeCtx.font = \`\${12 * scale}px monospace\`;
        officeCtx.fillText('🏢 Infinite Terminal Office', 10, 20 * scale);
        officeCtx.font = \`\${8 * scale}px monospace\`;
        officeCtx.fillText(\`\${OFFICE.workers.size} workers\`, 10, 34 * scale);

        if (state.officeViewActive) {
          officeAnimId = requestAnimationFrame(render);
        }
      }

      render();
    }

    document.getElementById('btn-close-office').addEventListener('click', toggleOfficeView);
    document.getElementById('btn-new-terminal-office').addEventListener('click', () => {
      vscode.postMessage({ type: 'createTerminal', name: 'Terminal', command: '' });
    });

    // ===================== MESSAGE HANDLING =====================
    window.addEventListener('message', (event) => {
      const msg = event.data;

      switch (msg.type) {
        case 'terminalCreated':
          createTerminalCard(msg.id, msg.name, msg.cwd);
          // Auto-create office worker when a new terminal is created
          if (!OFFICE.workers.has(msg.id)) {
            officeAddWorker(msg.id, msg.name);
          }
          break;

        case 'terminalClosed':
          closeTerminal(msg.id);
          break;

        case 'terminalOutput':
          appendOutput(msg.id, msg.data);
          break;

        case 'triggerCreateTerminal':
          vscode.postMessage({ type: 'createTerminal', name: msg.name, command: msg.command, cwd: msg.cwd });
          break;

        case 'presets':
          renderPresets(msg.presets);
          break;

        case 'toggleOfficeView':
          toggleOfficeView();
          break;

        case 'workerStatus':
          officeSetWorkerStatus(msg.id, msg.status, msg.message);
          break;
      }
    });

    // ===================== HELPERS =====================
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // roundRect polyfill
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        this.moveTo(x + r[0], y);
        this.lineTo(x + w - r[1], y);
        this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
        this.lineTo(x + w, y + h - r[2]);
        this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
        this.lineTo(x + r[3], y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
        this.lineTo(x, y + r[0]);
        this.quadraticCurveTo(x, y, x + r[0], y);
        this.closePath();
      };
    }

    // ===================== INIT =====================
    updateCanvasTransform();
    drawGrid();
    vscode.postMessage({ type: 'requestPresets' });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        vscode.postMessage({ type: 'createTerminal', name: 'Terminal', command: '' });
      }
      if (e.key === 'Escape' && state.officeViewActive) {
        toggleOfficeView();
      }
    });
  </script>
</body>
</html>`;
}
