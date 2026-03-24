# CrossOver v4

A crosshair overlay for any screen. Pin a customizable crosshair on top of any application — perfect for games that lack crosshair options, accessibility, or creative use cases.

Built with Electron 40, React 18, TypeScript, Tailwind CSS, and shadcn/ui. Rebuild of [CrossOver v3](https://github.com/lacymorrow/crossover) from scratch on the [electron-bones](https://github.com/nicely-gg/electron-bones) boilerplate.

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]

</div>

## Features

- Multiple crosshair windows with independent settings
- Inline SVG crosshairs with fill, stroke, and width customization
- Crosshair gallery with drag-and-drop custom image support
- Secondary crosshair with toggle/hold keybinds
- Lock mode — click-through overlay, stays on top of fullscreen apps
- Hide on mouse button or keypress (toggle/hold)
- ADS zoom — resize crosshair when aiming down sights
- Tilt crosshair left/right with configurable binds
- Follow mouse mode
- Per-window size modes (compact, normal, large, resizable, fullscreen)
- Configurable keyboard shortcuts for all actions
- System tray with quick actions
- Auto-updater
- macOS accessibility permission flow (required for input hooks)
- Single-instance lock
- Dark mode
- E2E test suite (Playwright)

## Getting Started

```bash
# Clone this repository
git clone https://github.com/lacymorrow/crossover.git
cd crossover

# Install dependencies
npm install

# Run the app in development
npm start

# Build for production
npm run build
```

Requires Node >= 18.x and npm >= 7.x. See `.nvmrc` for the pinned Node version.

## Architecture

```
src/
  main/           # Electron main process
    iohook.ts     # Global mouse/keyboard hooks (uiohook-napi)
    keyboard.ts   # Global shortcut registration
    create-window.ts  # Window lifecycle management
    store-actions.ts  # Settings persistence and sync
    auto-update.ts    # Auto-updater with progress
    accessibility.ts  # macOS accessibility permissions
  renderer/       # React renderer process
    context/      # Global state (settings, keybinds, action state)
    components/   # UI components (settings pages, crosshair renderer)
    windows/      # Window entry points (crosshair, settings)
  config/         # Settings schema, IPC channels, keycodes
test/             # Playwright E2E tests
```

Data flows top-down: main process stores state in `electron-store`, pushes updates to renderers via IPC (`APP_UPDATED`), renderers request state via `GET_RENDERER_SYNC`.

## Configuration

CrossOver data is stored as `config.json` in the per-user application data directory:

- **Windows:** `%APPDATA%\CrossOver`
- **Linux:** `$XDG_CONFIG_HOME/CrossOver` or `~/.config/CrossOver`
- **macOS:** `~/Library/Application Support/CrossOver`

### Disable the "Lock" keybind

Edit `config.json` and set the lock keybind to an empty string:

```json
{
  "keybinds": {
    "lock": ""
  }
}
```

## Built With

- [Electron 40](https://electronjs.org/)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [uiohook-napi](https://github.com/nicely-gg/uiohook-napi) — global input hooks
- [electron-store](https://github.com/sindresorhus/electron-store) — persistent settings
- [electron-updater](https://www.electron.build/auto-update) — auto-updates

## Development

### UI Components

Uses shadcn/ui. Add components with:

```sh
npx shadcn-ui@latest add button checkbox dropdown-menu ...
```

Check for updates: `npx shadcn-ui@latest diff`

### Testing

```sh
npm test
```

Runs Playwright E2E tests covering app launch, crosshair rendering, button interactions, settings window, and keyboard IPC.

## License

MIT © [Lacy Morrow](https://github.com/lacymorrow)

[github-actions-status]: https://github.com/lacymorrow/crossover/workflows/Build/badge.svg
[github-actions-url]: https://github.com/lacymorrow/crossover/actions
[github-tag-image]: https://img.shields.io/github/tag/lacymorrow/crossover.svg?label=version
[github-tag-url]: https://github.com/lacymorrow/crossover/releases/latest
