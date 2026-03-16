import * as vscode from 'vscode';
import { InfiniteCanvasPanel } from './panels/InfiniteCanvasPanel';
import { WorktreeManager } from './worktree/WorktreeManager';

export function activate(context: vscode.ExtensionContext) {
  const worktreeManager = new WorktreeManager();

  // Status bar button
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = '$(terminal) ∞ Terminal';
  statusBarItem.tooltip = 'Open Infinite Terminal Canvas';
  statusBarItem.command = 'infiniteTerminal.openCanvas';
  statusBarItem.show();

  context.subscriptions.push(
    statusBarItem,
    vscode.commands.registerCommand('infiniteTerminal.openCanvas', () => {
      InfiniteCanvasPanel.createOrShow(context, worktreeManager);
    }),

    vscode.commands.registerCommand('infiniteTerminal.createTerminal', () => {
      const panel = InfiniteCanvasPanel.currentPanel;
      if (panel) {
        panel.createTerminal();
      } else {
        InfiniteCanvasPanel.createOrShow(context, worktreeManager);
      }
    }),

    vscode.commands.registerCommand('infiniteTerminal.openPreset', async () => {
      const config = vscode.workspace.getConfiguration('infiniteTerminal');
      const presets =
        config.get<Array<{ name: string; icon: string; command: string }>>('presets') || [];

      const picked = await vscode.window.showQuickPick(
        presets.map((p) => ({ label: `$(${p.icon}) ${p.name}`, preset: p })),
        { placeHolder: 'Select a terminal preset' },
      );

      if (picked) {
        const panel = InfiniteCanvasPanel.currentPanel;
        if (panel) {
          panel.createTerminal(picked.preset.name, picked.preset.command);
        } else {
          const newPanel = InfiniteCanvasPanel.createOrShow(context, worktreeManager);
          setTimeout(() => {
            newPanel?.createTerminal(picked.preset.name, picked.preset.command);
          }, 500);
        }
      }
    }),

    vscode.commands.registerCommand('infiniteTerminal.toggleOfficeView', () => {
      const panel = InfiniteCanvasPanel.currentPanel;
      if (panel) {
        panel.toggleOfficeView();
      }
    }),

    vscode.commands.registerCommand('infiniteTerminal.createWorktree', async () => {
      const panel = InfiniteCanvasPanel.currentPanel;
      if (!panel) {
        InfiniteCanvasPanel.createOrShow(context, worktreeManager);
      }
      const currentPanel = InfiniteCanvasPanel.currentPanel;
      if (currentPanel) {
        const branchName = await vscode.window.showInputBox({
          prompt: 'Enter branch name for the new worktree',
          placeHolder: 'feature/my-branch',
        });
        if (branchName) {
          currentPanel.createWorktreeTerminal(branchName);
        }
      }
    }),

    vscode.commands.registerCommand('infiniteTerminal.searchTerminals', () => {
      const panel = InfiniteCanvasPanel.currentPanel;
      if (panel) {
        panel.searchTerminals();
      }
    }),
  );
}

export function deactivate() {}
