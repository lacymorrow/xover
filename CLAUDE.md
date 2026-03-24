# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CrossOver v4 — a gaming crosshair overlay built with Electron 40, React 18, TypeScript, Tailwind CSS, and shadcn/ui.

## Commands

```bash
npm start           # Dev mode (starts webpack dev server + Electron)
npm run build       # Production build (main + renderer)
npm test            # Playwright E2E tests
npm run package     # Build distributable installers
npm run lint        # ESLint + TypeScript check
npm run lint:fix    # Auto-fix lint issues
```

Run a single test file:
```bash
npx playwright test test/crosshair.spec.ts
```

## Architecture

This is a two-process Electron app. The main process (Node.js) manages state, windows, and system APIs. The renderer process (React) is the UI. A preload script bridges them via a context-isolated IPC API.

### Process Boundary

**Main process** (`src/main/`):
- `main.ts` — Entry point; single-instance lock, calls `startup()` then `ready()`
- `ipc.ts` — All IPC handler registration (`ipcMain.handle` + `ipcMain.on`)
- `store.ts` / `store-actions.ts` — `electron-store` schema and typed getters/setters
- `keyboard.ts` — Global shortcut registration and handling
- `create-window.ts` — BrowserWindow creation, lifecycle, position persistence
- `startup.ts` — Initialization sequence: `startup()` → `ready()` → `idle()`
- `license.ts` — Polar.sh license activation/validation with offline grace period

**Renderer process** (`src/renderer/`):
- Two window types share the same webpack bundle, distinguished by URL query param `?id=<uuid>` (crosshair windows) vs no param (settings window)
- `context/global-context.tsx` — Root context: settings, keybinds, window state, premium status. Calls `GET_RENDERER_SYNC` on mount; listens for `APP_UPDATED` to re-sync.
- `context/action-state-context.tsx` — Real-time runtime state (hidden, secondary, ADS, tilt). Updates via `ACTION_STATE` IPC channel; applies CSS classes to `<body>`.
- `windows/crosshair/CrosshairApp.tsx` — The overlay window
- `windows/main/App.tsx` — Settings window with React Router

**Shared config** (`src/config/`):
- `settings.ts` — `SettingsType` (app-wide) and `CrosshairWindowStateType` (per-window) with defaults
- `ipc-channels.ts` — All IPC channel name constants (whitelisted in preload)
- `license.ts` — Polar.sh organization ID, API URL, and `PREMIUM_FEATURES` flags

### State Flow

1. Main process persists state in `electron-store` (JSON on disk)
2. Renderer calls `GET_RENDERER_SYNC` (invoke) on mount → full state object
3. Renderer sends `SET_SETTINGS` / `SET_WINDOW_STATE` (one-way) to update
4. Main updates store, broadcasts `APP_UPDATED` to all renderer windows
5. Real-time action state flows via `ACTION_STATE` channel (not persisted between launches)

### IPC Pattern

- **Invoke** (request/response): `window.electron.invoke(channel, ...args)`
- **Send** (one-way): `window.electron.send(channel, ...args)`
- **Listen**: `window.electron.on(channel, handler)` / `window.electron.once(...)`
- All channels must be declared in `src/config/ipc-channels.ts` and whitelisted in `src/main/preload.ts`

### Per-Window State

Each crosshair window has its own `CrosshairWindowStateType` stored under `windows[id]` in the store. The settings window uses the key `'settings'`. Windows are recreated on startup via `createOrReloadCrosshairWindows()` using persisted IDs.

### License System

Polar.sh integration with 24-hour validation cache and 7-day offline grace period. Premium features are gated via `isPremium` in `GlobalContext`. Feature flags live in `src/config/license.ts` → `PREMIUM_FEATURES`.

### Build

Webpack 5 with separate configs for main process, renderer, and preload script (in `.erb/configs/`). Electron Builder packages to DMG (macOS universal), NSIS (Windows), and AppImage/DEB/etc. (Linux).

### Tests

Playwright E2E tests in `test/`. `helpers.ts` exports `startApp()` / `closeApp()` which launch the actual Electron binary. No unit tests — all tests are integration-level against the running app.
