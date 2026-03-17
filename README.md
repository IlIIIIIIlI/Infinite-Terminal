# ∞ Infinite Terminal

A VS Code extension that provides an **infinite canvas** for managing multiple terminals, with real terminal I/O, git worktree integration, and a unique **pixel art office view**.

## Features

### 🖥️ Infinite Canvas with Real Terminals
- Create unlimited terminals on an infinite, pannable canvas
- **Real terminal I/O via node-pty** — full ANSI color support, interactive programs work
- Drag, resize, and reposition terminals freely
- Zoom in/out with mouse wheel (zoom toward cursor)
- Grid background for spatial orientation
- **Keyboard input directly in terminal cards** — arrow keys, Ctrl+C, tab completion all work

### 🔍 Terminal Search (Ctrl+P)
- Quick-search terminals by name
- Arrow keys to navigate results, Enter to jump
- Instantly pans canvas and focuses the selected terminal
- Each terminal has an editable name (double-click to rename)

### 🚀 Preset Management
- Quick-launch from dock: Shell, Node.js, Python, Vim
- **Full preset manager UI** — add, edit, delete presets
- Presets saved to VS Code settings
- One-click custom terminal creation

### 🌿 Git Worktree Integration
- Create git worktrees for parallel branch development
- **Worktree manager UI** — list, open, and delete worktrees
- Each worktree terminal auto-links with connection lines

### 🗺️ Minimap
- Appears during canvas/terminal drag
- Shows all terminals as miniature rectangles
- Highlights viewport and focused terminal
- Auto-hides 1.5s after drag stops

### 📐 Connection Lines
- Dashed lines connect related terminals (parent ↔ child)
- Worktree terminals auto-link to their origin
- Lines update in real-time during drag

### 💾 Layout Persistence
- Terminal positions, sizes, and canvas view auto-saved
- Restored on next session open
- Saves to VS Code workspace state

### 🏢 Pixel Office View
- Toggle pixel art office scene
- **Each terminal = one pixel worker** (auto-created)
- Workers have randomized appearance (8 hair colors, 8 shirt colors)
- **Status linked to real terminal activity:**
  - Active terminal → worker typing at desk
  - Idle terminal → worker takes coffee break
  - Exited terminal → worker shows 💀
- Autonomous behaviors: walking, stretching, thinking
- Speech bubbles: "Working...", "Compiling...", "☕ Coffee time", "Done! ✓"

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `Open Canvas` | `Ctrl+Shift+\`` | Open the infinite terminal canvas |
| `New Terminal` | `Ctrl+Shift+N` | Create a new terminal |
| `Search Terminals` | `Ctrl+P` | Search and navigate to terminals |
| `Open Preset Terminal` | — | Pick from preset configurations |
| `Toggle Pixel Office View` | — | Toggle the office view |
| `Create Git Worktree Terminal` | — | Create a worktree + terminal |

## Settings

```json
{
  "infiniteTerminal.presets": [
    { "name": "Shell", "icon": "terminal", "command": "" },
    { "name": "Node.js", "icon": "code", "command": "node" },
    { "name": "Python", "icon": "code", "command": "python3" },
    { "name": "Vim", "icon": "edit", "command": "vim" }
  ],
  "infiniteTerminal.defaultShell": "",
  "infiniteTerminal.terminalWidth": 600,
  "infiniteTerminal.terminalHeight": 400
}
```

## Development

```bash
npm install
npm run watch    # Development with hot reload
npm run compile  # Production build
```

Press F5 in VS Code to launch the extension in debug mode.

## Architecture

```
src/
├── extension.ts                    # Extension entry, command registration
├── pty/
│   └── PtyManager.ts              # node-pty process management with activity tracking
├── panels/
│   ├── InfiniteCanvasPanel.ts      # Webview panel + PTY integration + layout persistence
│   └── webviewHtml.ts              # Webview HTML/CSS/JS generation
│       ├── ANSI parser/renderer    # Color code parsing for terminal output
│       ├── Infinite Canvas         # Pan, zoom, grid, terminal cards
│       ├── Terminal cards          # Real I/O, keyboard input, rename
│       ├── Search modal            # Ctrl+P terminal search
│       ├── Preset manager          # Add/edit/delete presets
│       ├── Worktree manager        # List/create/delete worktrees
│       ├── Connection lines        # SVG lines between related terminals
│       ├── Minimap                 # Canvas overview during drag
│       └── Pixel Office View       # Animated pixel art office
└── worktree/
    └── WorktreeManager.ts          # Git worktree CRUD operations
```

## Acknowledgments

The pixel art studio view was inspired by the rendering approach in [pixel-agents](https://github.com/pablodelucca/pixel-agents) (MIT). All character designs and code are original.

## License

MIT
