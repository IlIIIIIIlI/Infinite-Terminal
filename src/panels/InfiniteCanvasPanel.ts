import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { WorktreeManager } from '../worktree/WorktreeManager';
import { PtyManager } from '../pty/PtyManager';
import { getWebviewHtml } from './webviewHtml';

interface TerminalSession {
  id: string;
  name: string;
  command: string;
  cwd: string;
  worktreeBranch?: string;
  parentId?: string; // for connection lines
}

interface SavedLayout {
  terminals: Array<{
    id: string;
    name: string;
    command: string;
    cwd: string;
    x: number;
    y: number;
    w: number;
    h: number;
    worktreeBranch?: string;
    parentId?: string;
  }>;
  groups?: Array<{
    id: string;
    name: string;
    color: string;
    terminalIds: string[];
  }>;
  canvasX: number;
  canvasY: number;
  zoom: number;
}

export class InfiniteCanvasPanel {
  public static currentPanel: InfiniteCanvasPanel | undefined;
  private static readonly viewType = 'infiniteTerminal.canvas';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private readonly _worktreeManager: WorktreeManager;
  private readonly _ptyManager: PtyManager;
  private _disposables: vscode.Disposable[] = [];
  private _terminals: Map<string, TerminalSession> = new Map();
  private _terminalCounter = 0;
  private _useFallback = false;
  private _fallbackTerminals: Map<string, vscode.Terminal> = new Map();

  public static createOrShow(
    context: vscode.ExtensionContext,
    worktreeManager: WorktreeManager,
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
          vscode.Uri.joinPath(context.extensionUri, 'dist'),
          vscode.Uri.joinPath(context.extensionUri, 'node_modules', 'xterm'),
          vscode.Uri.joinPath(context.extensionUri, 'node_modules', 'xterm-addon-fit'),
        ],
      },
    );

    InfiniteCanvasPanel.currentPanel = new InfiniteCanvasPanel(panel, context, worktreeManager);
    return InfiniteCanvasPanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    worktreeManager: WorktreeManager,
  ) {
    this._panel = panel;
    this._context = context;
    this._worktreeManager = worktreeManager;
    this._ptyManager = new PtyManager();

    // Set up PTY callbacks
    this._ptyManager.onData((id, data) => {
      this._panel.webview.postMessage({ type: 'terminalOutput', id, data });
    });

    this._ptyManager.onExit((id, exitCode) => {
      this._panel.webview.postMessage({ type: 'terminalExited', id, exitCode });
    });

    this._ptyManager.onActivity((id, isActive) => {
      this._panel.webview.postMessage({ type: 'terminalActivity', id, isActive });
    });

    const xtermJsUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'node_modules', 'xterm', 'lib', 'xterm.js'),
    );
    const fitAddonUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(
        context.extensionUri,
        'node_modules',
        'xterm-addon-fit',
        'lib',
        'xterm-addon-fit.js',
      ),
    );
    // Inline xterm.css to avoid CSP/loading issues
    const xtermCssPath = path.join(
      context.extensionPath,
      'node_modules',
      'xterm',
      'css',
      'xterm.css',
    );
    let xtermCss = '';
    try {
      xtermCss = fs.readFileSync(xtermCssPath, 'utf8');
    } catch (e: any) {
      console.warn(`[InfiniteTerminal] Failed to load xterm.css: ${e.message}`);
    }
    this._panel.webview.html = getWebviewHtml(
      xtermJsUri.toString(),
      xtermCss,
      fitAddonUri.toString(),
      this._panel.webview.cspSource,
    );
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    vscode.commands.executeCommand('setContext', 'infiniteTerminal.canvasActive', true);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'createTerminal':
            this._doCreateTerminal(message.name, message.command, message.cwd, message.parentId);
            break;
          case 'closeTerminal':
            this._closeTerminal(message.id);
            break;
          case 'terminalInput':
            this._writeToTerminal(message.id, message.data);
            break;
          case 'terminalResize':
            this._ptyManager.resize(message.id, message.cols, message.rows);
            break;
          case 'requestPresets':
            this._sendPresets();
            break;
          case 'createWorktree':
            this.createWorktreeTerminal(message.branch);
            break;
          case 'saveLayout':
            this._saveLayout(message.layout);
            break;
          case 'requestLayout':
            this._restoreLayout();
            break;
          case 'updatePresets':
            this._updatePresets(message.presets);
            break;
          case 'requestWorktrees':
            this._sendWorktrees();
            break;
          case 'removeWorktree':
            this._removeWorktree(message.path, message.id);
            break;
          case 'renameTerminal':
            this._renameTerminal(message.id, message.name);
            break;
          case 'openPixelAgents':
            vscode.commands.executeCommand('infiniteTerminal.toggleOfficeView');
            break;
        }
      },
      null,
      this._disposables,
    );

    // Listen for fallback VS Code terminal close
    {
      vscode.window.onDidCloseTerminal(
        (terminal) => {
          for (const [id, t] of this._fallbackTerminals) {
            if (t === terminal) {
              this._panel.webview.postMessage({ type: 'terminalExited', id, exitCode: 0 });
              this._fallbackTerminals.delete(id);
              this._terminals.delete(id);
              break;
            }
          }
        },
        null,
        this._disposables,
      );
    }
  }

  public createTerminal(name?: string, command?: string, cwd?: string) {
    this._panel.webview.postMessage({
      type: 'triggerCreateTerminal',
      name: name || 'Terminal',
      command: command || '',
      cwd: cwd || '',
    });
  }

  private async _doCreateTerminal(
    name?: string,
    command?: string,
    cwd?: string,
    parentId?: string,
  ): Promise<string> {
    this._terminalCounter++;
    const id = `term_${this._terminalCounter}_${Date.now()}`;
    const termName = name || `Terminal ${this._terminalCounter}`;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const termCwd = cwd || workspaceFolder || process.env.HOME || '/';

    const session: TerminalSession = {
      id,
      name: termName,
      command: command || '',
      cwd: termCwd,
      parentId: parentId || undefined,
    };
    this._terminals.set(id, session);

    const spawned = await this._ptyManager.spawn(id, termName, command || '', termCwd, 80, 24);
    if (!spawned) {
      this._spawnFallbackTerminal(id, termName, command, termCwd);
    }

    this._panel.webview.postMessage({
      type: 'terminalCreated',
      id,
      name: termName,
      cwd: termCwd,
      parentId: parentId || null,
      hasPty: spawned,
    });

    return id;
  }

  private _spawnFallbackTerminal(
    id: string,
    name: string,
    command: string | undefined,
    cwd: string,
  ) {
    const terminal = vscode.window.createTerminal({
      name: `∞ ${name}`,
      cwd,
      shellPath: command || undefined,
    });
    this._fallbackTerminals.set(id, terminal);
    // In fallback mode, webview shows a message that output is in VS Code's terminal panel
    this._panel.webview.postMessage({
      type: 'terminalOutput',
      id,
      data: `[Fallback mode: node-pty not available. Output appears in VS Code terminal panel.]\r\n[Terminal: ∞ ${name}]\r\n\r\n`,
    });
  }

  private _writeToTerminal(id: string, data: string) {
    if (this._ptyManager.getProcess(id)) {
      this._ptyManager.write(id, data);
    } else {
      const ft = this._fallbackTerminals.get(id);
      if (ft) {
        ft.sendText(data, false);
      }
    }
  }

  private _closeTerminal(id: string) {
    this._ptyManager.kill(id);
    const ft = this._fallbackTerminals.get(id);
    if (ft) {
      ft.dispose();
      this._fallbackTerminals.delete(id);
    }
    this._terminals.delete(id);
  }

  private _renameTerminal(id: string, name: string) {
    const session = this._terminals.get(id);
    if (session) {
      session.name = name;
    }
  }

  private _sendPresets() {
    const config = vscode.workspace.getConfiguration('infiniteTerminal');
    const presets = config.get('presets') || [];
    this._panel.webview.postMessage({ type: 'presets', presets });
  }

  private async _updatePresets(presets: any[]) {
    const config = vscode.workspace.getConfiguration('infiniteTerminal');
    await config.update('presets', presets, vscode.ConfigurationTarget.Global);
    this._sendPresets();
    vscode.window.showInformationMessage('Presets updated!');
  }

  private _sendWorktrees() {
    const worktrees = this._worktreeManager.listWorktrees();
    this._panel.webview.postMessage({ type: 'worktrees', worktrees });
  }

  private async _removeWorktree(wtPath: string, terminalId: string) {
    const ok = await this._worktreeManager.removeWorktree(wtPath);
    if (ok) {
      vscode.window.showInformationMessage(`Worktree removed: ${wtPath}`);
      if (terminalId) {
        this._closeTerminal(terminalId);
      }
      this._sendWorktrees();
    } else {
      vscode.window.showErrorMessage('Failed to remove worktree');
    }
  }

  public async createWorktreeTerminal(branchName: string) {
    const info = await this._worktreeManager.createWorktree(branchName);
    if (info) {
      const id = await this._doCreateTerminal(`🌿 ${branchName}`, undefined, info.path);
      const session = this._terminals.get(id);
      if (session) {
        session.worktreeBranch = branchName;
      }
      vscode.window.showInformationMessage(
        `Worktree created: ${info.path} (branch: ${branchName})`,
      );
    }
  }

  public searchTerminals() {
    this._panel.webview.postMessage({ type: 'openSearch' });
  }

  private _saveLayout(layout: SavedLayout) {
    this._context.workspaceState.update('infiniteTerminal.layout', layout);
  }

  private _restoreLayout() {
    const layout = this._context.workspaceState.get<SavedLayout>('infiniteTerminal.layout');
    if (layout) {
      this._panel.webview.postMessage({ type: 'restoreLayout', layout });
    }
  }

  private dispose() {
    InfiniteCanvasPanel.currentPanel = undefined;
    vscode.commands.executeCommand('setContext', 'infiniteTerminal.canvasActive', false);

    // Save layout before disposing
    try {
      this._panel.webview.postMessage({ type: 'requestSaveLayout' });
    } catch (e: any) {
      console.warn(`[InfiniteTerminal] Could not request layout save during dispose: ${e.message}`);
    }

    this._ptyManager.dispose();
    for (const [_, t] of this._fallbackTerminals) {
      t.dispose();
    }
    this._fallbackTerminals.clear();
    this._terminals.clear();

    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      d?.dispose();
    }
  }
}
