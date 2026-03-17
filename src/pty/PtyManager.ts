import * as os from 'os';
import * as cp from 'child_process';

// node-pty is an optional native dependency
// If binary doesn't match platform, try to rebuild it automatically
let pty: any;
let ptyReady: Promise<void>;

const log = (msg: string) => console.log(`[InfiniteTerminal] ${msg}`);

function tryLoadPty(): boolean {
  try {
    pty = require('node-pty');
    log(`node-pty require OK, platform=${process.platform}, arch=${process.arch}`);
    const test = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : '/bin/sh', ['-c', 'exit 0'], {
      cols: 1, rows: 1, cwd: os.homedir(),
    });
    test.kill();
    log('node-pty sanity check passed');
    return true;
  } catch (e: any) {
    log(`node-pty failed: ${e.message}`);
    pty = null;
    return false;
  }
}

if (!tryLoadPty()) {
  const path = require('path');
  const rebuildCwd = path.join(__dirname, '..');
  log(`Attempting npm rebuild node-pty in ${rebuildCwd}`);
  ptyReady = new Promise<void>((resolve) => {
    try {
      const rebuild = cp.spawn('npm', ['rebuild', 'node-pty'], {
        cwd: rebuildCwd,
        stdio: 'pipe',
        shell: true,
      });
      let rebuildOutput = '';
      rebuild.stdout?.on('data', (d: Buffer) => { rebuildOutput += d.toString(); });
      rebuild.stderr?.on('data', (d: Buffer) => { rebuildOutput += d.toString(); });
      rebuild.on('close', (code) => {
        log(`npm rebuild exited with code ${code}`);
        log(`rebuild output: ${rebuildOutput.slice(-500)}`);
        if (code === 0) {
          try {
            delete require.cache[require.resolve('node-pty')];
          } catch {}
          const ok = tryLoadPty();
          log(`after rebuild, node-pty loaded: ${ok}`);
        }
        resolve();
      });
      rebuild.on('error', (e) => { log(`rebuild spawn error: ${e.message}`); resolve(); });
      setTimeout(() => { try { rebuild.kill(); } catch {} log('rebuild timed out'); resolve(); }, 30000);
    } catch (e: any) {
      log(`rebuild failed to start: ${e.message}`);
      resolve();
    }
  });
} else {
  ptyReady = Promise.resolve();
}

export interface PtyProcess {
  id: string;
  name: string;
  cwd: string;
  process: any; // IPty or ChildProcess wrapper
  lastDataTime: number;
  totalBytes: number;
  isFallback: boolean;
}

export type PtyDataCallback = (id: string, data: string) => void;
export type PtyExitCallback = (id: string, exitCode: number) => void;
export type PtyActivityCallback = (id: string, isActive: boolean) => void;

export class PtyManager {
  private _processes: Map<string, PtyProcess> = new Map();
  private _onData: PtyDataCallback | null = null;
  private _onExit: PtyExitCallback | null = null;
  private _onActivity: PtyActivityCallback | null = null;
  private _activityCheckInterval: NodeJS.Timer | null = null;

  constructor() {
    this._activityCheckInterval = setInterval(() => this._checkActivity(), 2000);
  }

  get isAvailable(): boolean {
    return true; // always available - falls back to child_process
  }

  onData(cb: PtyDataCallback) { this._onData = cb; }
  onExit(cb: PtyExitCallback) { this._onExit = cb; }
  onActivity(cb: PtyActivityCallback) { this._onActivity = cb; }

  async spawn(id: string, name: string, shellCommand: string, cwd: string, cols: number, rows: number): Promise<boolean> {
    log(`spawn called: id=${id}, shell=${shellCommand||'default'}, cwd=${cwd}, pty=${!!pty}`);
    await ptyReady;
    log(`ptyReady resolved, pty=${!!pty}`);
    const shell = shellCommand || this._getDefaultShell();
    const spawnCwd = cwd || os.homedir();
    log(`using shell=${shell}, cwd=${spawnCwd}`);

    // Try node-pty first
    if (pty) {
      try {
        const proc = pty.spawn(shell, [], {
          name: 'xterm-256color',
          cols: cols || 80,
          rows: rows || 24,
          cwd: spawnCwd,
          env: { ...process.env, TERM: 'xterm-256color' },
        });

        const ptyProc: PtyProcess = {
          id, name, cwd: spawnCwd, process: proc,
          lastDataTime: Date.now(), totalBytes: 0, isFallback: false,
        };

        proc.onData((data: string) => {
          ptyProc.lastDataTime = Date.now();
          ptyProc.totalBytes += data.length;
          this._onData?.(id, data);
        });

        proc.onExit(({ exitCode }: { exitCode: number }) => {
          this._onExit?.(id, exitCode);
          this._processes.delete(id);
        });

        this._processes.set(id, ptyProc);
        return true;
        log(`node-pty spawn OK for ${id}`);
      } catch (err: any) {
        log(`node-pty spawn failed: ${err.message}, falling back`);
      }
    }

    // Fallback: use script(1) to wrap shell in a real PTY
    log(`using fallback for ${id}`);
    try {
      // Find a default shell only if no command is specified
      const fs = require('fs');
      let fallbackShell = shell;
      if (!shellCommand) {
        // No command given, find default shell
        for (const sh of ['/bin/zsh', '/bin/bash', '/bin/sh']) {
          if (fs.existsSync(sh)) { fallbackShell = sh; break; }
        }
      }
      log(`fallback shell resolved: ${fallbackShell}`);

      // Use script(1) to create a real PTY wrapper (works on Linux & macOS)
      let child;
      if (process.platform === 'linux') {
        child = cp.spawn('script', ['-qc', fallbackShell, '/dev/null'], {
          cwd: spawnCwd,
          env: { ...process.env, TERM: 'xterm-256color', COLUMNS: String(cols || 80), LINES: String(rows || 24) },
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } else {
        child = cp.spawn(fallbackShell, ['-i'], {
          cwd: spawnCwd,
          env: { ...process.env, TERM: 'xterm-256color', COLUMNS: String(cols || 80), LINES: String(rows || 24) },
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      }

      const ptyProc: PtyProcess = {
        id, name, cwd: spawnCwd,
        process: {
          _child: child,
          write: (data: string) => { child.stdin?.write(data); },
          resize: (c: number, r: number) => {
            // Send SIGWINCH and update env for resize
            try {
              process.kill(child.pid!, 'SIGWINCH');
            } catch {}
            // Also write stty resize command for script(1) wrapped shells
            try {
              child.stdin?.write(`stty cols ${c} rows ${r}\n`);
            } catch {}
          },
          kill: () => { child.kill(); },
        },
        lastDataTime: Date.now(), totalBytes: 0, isFallback: true,
      };

      child.stdout?.on('data', (data: Buffer) => {
        const str = data.toString();
        ptyProc.lastDataTime = Date.now();
        ptyProc.totalBytes += str.length;
        this._onData?.(id, str);
      });

      child.stderr?.on('data', (data: Buffer) => {
        const str = data.toString();
        ptyProc.lastDataTime = Date.now();
        this._onData?.(id, str);
      });

      child.on('exit', (code) => {
        this._onExit?.(id, code ?? 0);
        this._processes.delete(id);
      });

      this._processes.set(id, ptyProc);
      this._onData?.(id, '\x1b[33m[fallback mode: no PTY, TUI apps may not work]\x1b[0m\r\n');
      return true;
    } catch (err) {
      console.error('Failed to spawn process:', err);
      return false;
    }
  }

  write(id: string, data: string) {
    const proc = this._processes.get(id);
    if (proc) {
      proc.process.write(data);
    }
  }

  resize(id: string, cols: number, rows: number) {
    const proc = this._processes.get(id);
    if (proc) {
      try { proc.process.resize(cols, rows); } catch {}
    }
  }

  kill(id: string) {
    const proc = this._processes.get(id);
    if (proc) {
      try { proc.process.kill(); } catch {}
      this._processes.delete(id);
    }
  }

  isActive(id: string): boolean {
    const proc = this._processes.get(id);
    if (!proc) { return false; }
    return (Date.now() - proc.lastDataTime) < 3000;
  }

  getProcess(id: string): PtyProcess | undefined {
    return this._processes.get(id);
  }

  private _checkActivity() {
    for (const [id, proc] of this._processes) {
      const active = (Date.now() - proc.lastDataTime) < 3000;
      this._onActivity?.(id, active);
    }
  }

  private _getDefaultShell(): string {
    if (process.platform === 'win32') {
      return process.env.COMSPEC || 'cmd.exe';
    }
    return process.env.SHELL || '/bin/bash';
  }

  dispose() {
    if (this._activityCheckInterval) {
      clearInterval(this._activityCheckInterval as any);
    }
    for (const [id] of this._processes) {
      this.kill(id);
    }
  }
}
