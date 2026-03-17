import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const execSyncMock = vi.hoisted(() => vi.fn());
const existsSyncMock = vi.hoisted(() => vi.fn());
const mkdirSyncMock = vi.hoisted(() => vi.fn());

const vscodeMock = vi.hoisted(() => ({
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }] as
      | Array<{ uri: { fsPath: string } }>
      | undefined,
  },
  window: {
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
  },
}));

vi.mock('vscode', () => vscodeMock);

vi.mock('child_process', () => ({
  execSync: execSyncMock,
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: existsSyncMock,
    mkdirSync: mkdirSyncMock,
  };
});

import { WorktreeManager } from './WorktreeManager';

describe('WorktreeManager', () => {
  let manager: WorktreeManager;

  beforeEach(() => {
    manager = new WorktreeManager();
    execSyncMock.mockReset();
    existsSyncMock.mockReset();
    mkdirSyncMock.mockReset();

    // Default: git rev-parse returns repo root
    execSyncMock.mockImplementation((cmd: string) => {
      if (cmd === 'git rev-parse --show-toplevel') {
        return Buffer.from('/workspace\n');
      }
      return Buffer.from('');
    });
  });

  describe('listWorktrees', () => {
    it('should parse porcelain output into WorktreeInfo array', () => {
      execSyncMock.mockImplementation((cmd: string) => {
        if (cmd === 'git rev-parse --show-toplevel') {
          return Buffer.from('/workspace\n');
        }
        if (cmd === 'git worktree list --porcelain') {
          return Buffer.from(
            [
              'worktree /workspace',
              'HEAD abc1234',
              'branch refs/heads/main',
              '',
              'worktree /workspace/.worktrees/feature_login',
              'HEAD def5678',
              'branch refs/heads/feature/login',
              '',
            ].join('\n'),
          );
        }
        return Buffer.from('');
      });

      const worktrees = manager.listWorktrees();

      expect(worktrees).toEqual([
        { path: '/workspace', branch: 'main', isNew: false },
        { path: '/workspace/.worktrees/feature_login', branch: 'feature/login', isNew: false },
      ]);
    });

    it('should return empty array when git command fails', () => {
      execSyncMock.mockImplementation((cmd: string) => {
        if (cmd === 'git rev-parse --show-toplevel') {
          return Buffer.from('/workspace\n');
        }
        throw new Error('git failed');
      });

      expect(manager.listWorktrees()).toEqual([]);
    });

    it('should return empty array when no workspace folders', () => {
      const original = vscodeMock.workspace.workspaceFolders;
      vscodeMock.workspace.workspaceFolders = undefined;

      expect(manager.listWorktrees()).toEqual([]);

      vscodeMock.workspace.workspaceFolders = original;
    });
  });

  describe('createWorktree', () => {
    it('should return existing worktree without creating a new one', async () => {
      existsSyncMock.mockImplementation((p: string) => {
        if (p.endsWith('.worktrees')) return true;
        if (p.endsWith('feature_login')) return true;
        return false;
      });

      const result = await manager.createWorktree('feature/login');

      expect(result).toEqual({
        path: path.join('/workspace', '.worktrees', 'feature_login'),
        branch: 'feature/login',
        isNew: false,
      });
    });

    it('should sanitize branch name for directory path', async () => {
      existsSyncMock.mockReturnValue(false);
      mkdirSyncMock.mockReturnValue(undefined);
      execSyncMock.mockImplementation((cmd: string) => {
        if (cmd === 'git rev-parse --show-toplevel') {
          return Buffer.from('/workspace\n');
        }
        // Branch doesn't exist
        if (cmd.includes('rev-parse --verify')) {
          throw new Error('not found');
        }
        return Buffer.from('');
      });

      const result = await manager.createWorktree('feature/special@branch');

      expect(result).toEqual({
        path: path.join('/workspace', '.worktrees', 'feature_special_branch'),
        branch: 'feature/special@branch',
        isNew: true,
      });
    });

    it('should return undefined when no git repo is found', async () => {
      execSyncMock.mockImplementation(() => {
        throw new Error('not a git repo');
      });

      const result = await manager.createWorktree('test-branch');
      expect(result).toBeUndefined();
    });
  });

  describe('removeWorktree', () => {
    it('should return true on successful removal', async () => {
      const result = await manager.removeWorktree('/workspace/.worktrees/old-branch');
      expect(result).toBe(true);
      expect(execSyncMock).toHaveBeenCalledWith(
        'git worktree remove "/workspace/.worktrees/old-branch" --force',
        { cwd: '/workspace' },
      );
    });

    it('should return false when removal fails', async () => {
      execSyncMock.mockImplementation((cmd: string) => {
        if (cmd === 'git rev-parse --show-toplevel') {
          return Buffer.from('/workspace\n');
        }
        throw new Error('worktree is dirty');
      });

      const result = await manager.removeWorktree('/workspace/.worktrees/dirty');
      expect(result).toBe(false);
    });
  });
});
