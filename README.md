# ∞ Infinite Terminal - 无限终端

A VS Code extension that provides an **infinite canvas** for managing multiple terminals, with a unique **pixel art office view** where animated characters represent your running terminals.

## Features

### 🖥️ Infinite Canvas
- Create unlimited terminals on an infinite, pannable canvas
- Drag and reposition terminals freely
- Zoom in/out with mouse wheel (zoom toward cursor)
- Resize terminals by dragging the bottom-right corner
- Grid background for spatial orientation

### 🚀 Preset Terminals
- Quick-launch preset terminals (Shell, Node.js, Python, Vim)
- Add custom presets via settings
- Bottom dock for one-click terminal creation

### 🌿 Git Worktree Integration
- Automatically create git worktrees for parallel development
- Each worktree gets its own terminal on the canvas
- Work on multiple branches of the same project simultaneously

### 🗺️ Minimap
- Shows during canvas/terminal drag operations
- Displays all terminals as miniature rectangles
- Highlights viewport position and focused terminal
- Auto-hides when not dragging

### 🏢 Pixel Office View
- Toggle a pixel art office scene
- Each terminal spawns a pixel character (worker) at a desk
- Workers have randomized appearance (hair color, shirt color)
- **Animated behaviors:**
  - Working at desk with typing animation
  - Taking coffee breaks and walking around
  - Showing status messages in speech bubbles
  - Returning to desk after breaks
- Status indicators: "Working...", "Done! ✓", "Taking a break~", "☕"
- **New terminal = new pixel worker** automatically created

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `Infinite Terminal: Open Canvas` | `Ctrl+Shift+\`` | Open the infinite terminal canvas |
| `Infinite Terminal: New Terminal` | `Ctrl+Shift+N` (when canvas active) | Create a new terminal |
| `Infinite Terminal: Open Preset Terminal` | — | Pick from preset configurations |
| `Infinite Terminal: Toggle Pixel Office View` | — | Toggle the office view |
| `Infinite Terminal: Create Git Worktree Terminal` | — | Create a worktree + terminal |

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

## Architecture

```
src/
├── extension.ts                    # Extension entry point, command registration
├── panels/
│   └── InfiniteCanvasPanel.ts      # Webview panel with embedded HTML/CSS/JS
│       ├── Infinite Canvas         # Pan, zoom, grid, terminal cards
│       ├── Terminal Management     # Create, drag, resize, close terminals
│       ├── Minimap                 # Canvas overview during drag
│       ├── Preset Dock             # Quick-launch terminal presets
│       └── Pixel Office View       # Animated pixel art office scene
└── worktree/
    └── WorktreeManager.ts          # Git worktree creation and management
```

## License

MIT
