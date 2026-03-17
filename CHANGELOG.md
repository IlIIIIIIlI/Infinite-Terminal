# Changelog

All notable changes to the "Infinite Terminal" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Auto Layout button in toolbar to arrange terminal tiles into a neat grid
- Dependabot configuration for automated dependency updates
- Pull request template for consistent PR formatting

### Fixed
- Dead code: unreachable log statement after `return` in PtyManager
- `hasPty` flag incorrectly reporting `true` in fallback terminal mode
- Race condition in `createWorktreeTerminal` (missing `await`)
- Empty catch blocks replaced with proper error logging across codebase
- `dispose()` crash when webview already torn down
- `stty` resize commands echoing as visible output in Linux fallback terminals

### Changed
- CI matrix updated from Node 18/20 to Node 20/22
- ESLint `allowEmptyCatch` set to `false` to prevent silent failures
- Added `engines.node >= 20` to package.json

## [0.3.14] - 2026-03-16

### Fixed
- Preserve shell command in fallback terminal mode
- Add resize support (SIGWINCH + stty) for fallback terminals

## [0.3.13] - 2026-03-16

### Fixed
- Use `path.join` in tests for Windows compatibility

## [0.3.12] - 2026-03-16

### Fixed
- Build native modules on correct OS in CI pipeline

## [0.3.11] - 2026-03-16

### Fixed
- Remove counter-zoom approach, add terminal numbering for presets

## [0.3.10] - 2026-03-16

### Fixed
- Restore zoom behavior with counter-zoom for accurate xterm rendering

## [0.3.9] - 2026-03-16

### Fixed
- Zoom only affects terminal position, not terminal card size

## [0.3.8] - 2026-03-16

### Added
- Dark, light, and high-contrast theme support following VS Code theme

## [0.3.7] - 2026-03-16

### Added
- Windows platform support (win32-x64, win32-arm64)

## [0.3.6] - 2026-03-16

### Changed
- Remove Chinese name from display name and README for marketplace consistency

## [0.3.5] - 2026-03-16

### Fixed
- Accurate text selection at any zoom level

## [0.3.4] - 2026-03-16

### Changed
- Remove Worktree and Trees buttons from toolbar (accessible via commands)

## [0.3.3] - 2026-03-16

### Fixed
- Allow scroll inside terminal cards (wheel events no longer captured by canvas)

## [0.3.2] - 2026-03-16

### Added
- CI auto-publish to VS Code Marketplace on PR merge
- ESLint, Prettier, Husky, and Vitest tooling

### Fixed
- Restore xterm.js core with child_process fallback
- Trackpad gesture handling (pan and pinch-to-zoom)
- ESLint errors and CI publish workflow issues

## [0.2.0] - 2026-03-16

### Added
- Status bar button for quick access to Infinite Terminal
- Extension activates on startup for immediate availability
- Icon and LICENSE for VS Code Marketplace packaging

### Fixed
- Removed duplicate `getNonce()` and unused `exec` import

## [0.1.0] - 2026-03-15

### Added
- Infinite canvas with pan, zoom, and grid background
- Real terminal I/O via node-pty with ANSI color rendering
- Terminal cards with drag, resize, rename, and keyboard input
- Terminal search modal (Ctrl+P) with arrow key navigation
- Preset terminal configurations with full manager UI
- Git worktree integration with worktree manager UI
- Connection lines (SVG) between related terminals
- Minimap overlay during canvas/terminal drag
- Layout persistence via VS Code workspace state
- Pixel art office view with animated workers linked to terminal activity
- Fallback to VS Code built-in terminals when node-pty is unavailable
