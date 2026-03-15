import * as vscode from 'vscode';
import { InfiniteCanvasPanel } from './panels/InfiniteCanvasPanel';
import { WorktreeManager } from './worktree/WorktreeManager';

export function activate(context: vscode.ExtensionContext) {
  const worktreeManager = new WorktreeManager();

  context.subscriptions.push(
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
      const presets = config.get<Array<{ name: string; icon: string; command: string }>>('presets') || [];

      const picked = await vscode.window.showQuickPick(
        presets.map(p => ({ label: `$(${p.icon}) ${p.name}`, preset: p })),
        { placeHolder: 'Select a terminal preset' }
      );

      if (picked) {
        const panel = InfiniteCanvasPanel.currentPanel;
        if (panel) {
          panel.createTerminal(picked.preset.name, picked.preset.command);
        } else {
          const newPanel = await InfiniteCanvasPanel.createOrShow(context, worktreeManager);
          // Small delay to let the webview initialize
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
          placeHolder: 'feature/my-branch'
        });
        if (branchName) {
          currentPanel.createWorktreeTerminal(branchName);
        }
      }
    })
  );
}

export function deactivate() {}
