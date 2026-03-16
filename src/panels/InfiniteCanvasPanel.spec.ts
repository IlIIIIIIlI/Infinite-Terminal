import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createTerminalMock,
  executeCommandMock,
  postMessageMock,
  ptyFactoryMock,
  setReceiveMessageHandler,
  vscodeState,
} = vi.hoisted(() => {
  const postMessageMock = vi.fn();
  const createTerminalMock = vi.fn(() => ({ dispose: vi.fn(), sendText: vi.fn() }));
  const executeCommandMock = vi.fn();
  const ptyFactoryMock = vi.fn();

  const vscodeState: {
    receiveMessageHandler?: (message: Record<string, unknown>) => Promise<void> | void;
  } = {};

  return {
    createTerminalMock,
    executeCommandMock,
    postMessageMock,
    ptyFactoryMock,
    setReceiveMessageHandler: (
      handler?: (message: Record<string, unknown>) => Promise<void> | void,
    ) => {
      vscodeState.receiveMessageHandler = handler;
    },
    vscodeState,
  };
});

vi.mock('vscode', () => {
  const panel = {
    reveal: vi.fn(),
    dispose: vi.fn(),
    webview: {
      html: '',
      postMessage: postMessageMock,
      onDidReceiveMessage: vi.fn(
        (handler: (message: Record<string, unknown>) => Promise<void> | void) => {
          setReceiveMessageHandler(handler);
          return { dispose: vi.fn() };
        },
      ),
    },
    onDidDispose: vi.fn(() => ({ dispose: vi.fn() })),
  };

  return {
    ViewColumn: { One: 1 },
    Uri: {
      joinPath: vi.fn(() => ({ fsPath: '/extension-resource' })),
    },
    commands: {
      executeCommand: executeCommandMock,
    },
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
      getConfiguration: vi.fn(() => ({
        get: vi.fn(() => []),
        update: vi.fn(),
      })),
    },
    window: {
      createTerminal: createTerminalMock,
      createWebviewPanel: vi.fn(() => panel),
      onDidCloseTerminal: vi.fn(() => ({ dispose: vi.fn() })),
      showErrorMessage: vi.fn(),
      showInformationMessage: vi.fn(),
    },
    ConfigurationTarget: { Global: 1 },
  };
});

vi.mock('../pty/PtyManager', () => ({
  PtyManager: vi.fn(() => ptyFactoryMock()),
}));

vi.mock('./webviewHtml', () => ({
  getWebviewHtml: vi.fn(() => '<html></html>'),
}));

import { InfiniteCanvasPanel } from './InfiniteCanvasPanel';

describe('InfiniteCanvasPanel', () => {
  beforeEach(() => {
    InfiniteCanvasPanel.currentPanel = undefined;
    createTerminalMock.mockClear();
    executeCommandMock.mockClear();
    postMessageMock.mockClear();
    setReceiveMessageHandler(undefined);

    ptyFactoryMock.mockReset();
    ptyFactoryMock.mockImplementation(() => ({
      isAvailable: true,
      onActivity: vi.fn(),
      onData: vi.fn(),
      onExit: vi.fn(),
      spawn: vi.fn(() => true),
      resize: vi.fn(),
      getProcess: vi.fn(),
      write: vi.fn(),
      kill: vi.fn(),
      dispose: vi.fn(),
    }));
  });

  function createPanel() {
    const context = {
      extensionPath: '/extension',
      extensionUri: { fsPath: '/extension' },
      workspaceState: {
        get: vi.fn(),
        update: vi.fn(),
      },
    };

    InfiniteCanvasPanel.createOrShow(context as never, {} as never);

    if (!vscodeState.receiveMessageHandler) {
      throw new Error('Expected webview message handler to be registered');
    }

    return { context, receiveMessage: vscodeState.receiveMessageHandler };
  }

  function findPostedMessage(type: string) {
    return postMessageMock.mock.calls
      .map(([message]) => message)
      .find((message) => message.type === type);
  }

  it('should fall back to VS Code terminal when PTY is unavailable', async () => {
    ptyFactoryMock.mockImplementation(() => ({
      isAvailable: false,
      onActivity: vi.fn(),
      onData: vi.fn(),
      onExit: vi.fn(),
      spawn: vi.fn(() => false),
      resize: vi.fn(),
      getProcess: vi.fn(),
      write: vi.fn(),
      kill: vi.fn(),
      dispose: vi.fn(),
    }));

    const { receiveMessage } = createPanel();

    await receiveMessage({
      type: 'createTerminal',
      name: 'Fallback',
      command: '',
      cwd: '/workspace',
    });

    expect(createTerminalMock).toHaveBeenCalledTimes(1);
    expect(findPostedMessage('terminalCreated')).toMatchObject({
      type: 'terminalCreated',
      name: 'Fallback',
      cwd: '/workspace',
      hasPty: false,
    });
    expect(findPostedMessage('terminalOutput')).toMatchObject({
      type: 'terminalOutput',
      data: expect.stringContaining('Fallback mode'),
    });
  });

  it('should keep hasPty true when PTY spawn succeeds', async () => {
    const { receiveMessage } = createPanel();

    await receiveMessage({
      type: 'createTerminal',
      name: 'Node',
      command: 'node',
      cwd: '/workspace',
    });

    expect(createTerminalMock).not.toHaveBeenCalled();
    expect(findPostedMessage('terminalCreated')).toMatchObject({
      type: 'terminalCreated',
      name: 'Node',
      cwd: '/workspace',
      hasPty: true,
    });
  });

  it('should fall back for individual terminal when PTY spawn fails', async () => {
    ptyFactoryMock.mockImplementation(() => ({
      isAvailable: true,
      onActivity: vi.fn(),
      onData: vi.fn(),
      onExit: vi.fn(),
      spawn: vi.fn(() => false),
      resize: vi.fn(),
      getProcess: vi.fn(),
      write: vi.fn(),
      kill: vi.fn(),
      dispose: vi.fn(),
    }));

    const { receiveMessage } = createPanel();

    await receiveMessage({
      type: 'createTerminal',
      name: 'FailedPty',
      command: '',
      cwd: '/workspace',
    });

    // When isAvailable is true but spawn fails, it falls back for that terminal
    expect(createTerminalMock).toHaveBeenCalledTimes(1);
    expect(findPostedMessage('terminalOutput')).toMatchObject({
      type: 'terminalOutput',
      data: expect.stringContaining('Fallback mode'),
    });
  });
});
