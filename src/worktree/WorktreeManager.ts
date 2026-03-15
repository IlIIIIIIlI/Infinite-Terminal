import * as vscode from 'vscode';
import { execSync, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface WorktreeInfo {
  path: string;
  branch: string;
  isNew: boolean;
}

export class WorktreeManager {
  private getRepoRoot(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return undefined;
    }
    const folder = workspaceFolders[0].uri.fsPath;
    try {
      return execSync('git rev-parse --show-toplevel', { cwd: folder }).toString().trim();
    } catch {
      return undefined;
    }
  }

  async createWorktree(branchName: string): Promise<WorktreeInfo | undefined> {
    const repoRoot = this.getRepoRoot();
    if (!repoRoot) {
      vscode.window.showErrorMessage('No git repository found in workspace');
      return undefined;
    }

    const worktreesDir = path.join(repoRoot, '.worktrees');
    if (!fs.existsSync(worktreesDir)) {
      fs.mkdirSync(worktreesDir, { recursive: true });
    }

    const safeBranch = branchName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const worktreePath = path.join(worktreesDir, safeBranch);

    if (fs.existsSync(worktreePath)) {
      return { path: worktreePath, branch: branchName, isNew: false };
    }

    try {
      // Check if branch exists
      try {
        execSync(`git rev-parse --verify ${branchName}`, { cwd: repoRoot });
        // Branch exists, create worktree with existing branch
        execSync(`git worktree add "${worktreePath}" ${branchName}`, { cwd: repoRoot });
      } catch {
        // Branch doesn't exist, create new branch in worktree
        execSync(`git worktree add -b ${branchName} "${worktreePath}"`, { cwd: repoRoot });
      }
      return { path: worktreePath, branch: branchName, isNew: true };
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to create worktree: ${err.message}`);
      return undefined;
    }
  }

  listWorktrees(): WorktreeInfo[] {
    const repoRoot = this.getRepoRoot();
    if (!repoRoot) { return []; }

    try {
      const output = execSync('git worktree list --porcelain', { cwd: repoRoot }).toString();
      const worktrees: WorktreeInfo[] = [];
      let currentPath = '';
      let currentBranch = '';

      for (const line of output.split('\n')) {
        if (line.startsWith('worktree ')) {
          currentPath = line.substring(9);
        } else if (line.startsWith('branch ')) {
          currentBranch = line.substring(7).replace('refs/heads/', '');
        } else if (line === '') {
          if (currentPath && currentBranch) {
            worktrees.push({ path: currentPath, branch: currentBranch, isNew: false });
          }
          currentPath = '';
          currentBranch = '';
        }
      }
      return worktrees;
    } catch {
      return [];
    }
  }

  async removeWorktree(worktreePath: string): Promise<boolean> {
    const repoRoot = this.getRepoRoot();
    if (!repoRoot) { return false; }

    try {
      execSync(`git worktree remove "${worktreePath}" --force`, { cwd: repoRoot });
      return true;
    } catch {
      return false;
    }
  }
}
