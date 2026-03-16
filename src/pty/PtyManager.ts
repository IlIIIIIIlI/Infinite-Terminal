import * as os from 'os';

// node-pty is an optional native dependency
let pty: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  pty = require('node-pty');
} catch {
  pty = null;
}

export interface PtyProcess {
  id: string;
  name: string;
  cwd: string;
  process: any; // IPty
  lastDataTime: number;
  totalBytes: number;
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
    // Check activity every 2 seconds
    this._activityCheckInterval = setInterval(() => this._checkActivity(), 2000);
  }

  get isAvailable(): boolean {
    return pty !== null;
  }

  onData(cb: PtyDataCallback) {
    this._onData = cb;
  }
  onExit(cb: PtyExitCallback) {
    this._onExit = cb;
  }
  onActivity(cb: PtyActivityCallback) {
    this._onActivity = cb;
  }

  spawn(
    id: string,
    name: string,
    shellCommand: string,
    cwd: string,
    cols: number,
    rows: number,
  ): boolean {
    if (!pty) {
      return false;
    }

    const shell = shellCommand || this._getDefaultShell();
    const args = shellCommand ? [] : [];

    try {
      const proc = pty.spawn(shell, args, {
        name: 'xterm-256color',
        cols: cols || 80,
        rows: rows || 24,
        cwd: cwd || os.homedir(),
        env: { ...process.env, TERM: 'xterm-256color' },
      });

      const ptyProc: PtyProcess = {
        id,
        name,
        cwd,
        process: proc,
        lastDataTime: Date.now(),
        totalBytes: 0,
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
    } catch (err) {
      console.error('Failed to spawn PTY:', err);
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
      try {
        proc.process.resize(cols, rows);
      } catch {
        /* resize may fail if process exited */
      }
    }
  }

  kill(id: string) {
    const proc = this._processes.get(id);
    if (proc) {
      try {
        proc.process.kill();
      } catch {
        /* kill may fail if already exited */
      }
      this._processes.delete(id);
    }
  }

  isActive(id: string): boolean {
    const proc = this._processes.get(id);
    if (!proc) {
      return false;
    }
    return Date.now() - proc.lastDataTime < 3000;
  }

  getProcess(id: string): PtyProcess | undefined {
    return this._processes.get(id);
  }

  private _checkActivity() {
    for (const [id, proc] of this._processes) {
      const active = Date.now() - proc.lastDataTime < 3000;
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
