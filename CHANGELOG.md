# Changelog

## 4.0.0-alpha.2

### Bug Fixes

- **Event listener leak in savePosition** — `removeWindowMovedListeners()` created new arrow functions instead of using stored references, so `moved` listeners were never actually removed and accumulated on every lock/unlock cycle. Fixed by storing listener references in a `Map`.
- **IOHook listener accumulation** — `startIOHook()` registered mouse/keyboard listeners that stacked up when called repeatedly on settings changes. Added cleanup of all listeners before re-registering and a running state guard to prevent double-start.
- **Auto-update listener accumulation** — `autoUpdater.on()` was called every time `update()` ran without removing previous listeners, causing duplicate notifications. Fixed with a `listenersRegistered` guard and single polling interval.
- **Keyboard shortcut registration failure** — `globalShortcut.unregisterAll()` was called before building the new shortcut list. If `register()` threw mid-way, all shortcuts were lost. Fixed by collecting shortcuts first, then swapping atomically with per-shortcut try-catch.
- **Window `moved`/`resize` listener leak** — Listeners registered in `createWindow()` were never removed when the window closed. Fixed by storing references and removing them in the `close` handler.
- **Duplicate close handlers on crosshair windows** — Both `createWindow()` and `createCrosshairWindow()` registered `close`/`closed` handlers for the same window, causing potential race conditions accessing deleted state. Consolidated into a single handler.
- **IPC listener cleanup leak in renderer** — `removeAllListeners()` was used instead of the unsubscribe functions returned by `ipcRenderer.on()`. Fixed by storing and calling unsubscribe functions.
- **Stale `settings.allowSounds` closure** — The PLAY_SOUND listener captured `settings.allowSounds` at effect registration time, so toggling sounds had no effect until remount. Fixed by fetching latest settings via IPC when a sound plays.
- **Window position `0` treated as falsy** — `state?.x` evaluated to false for windows at x=0 or y=0, preventing position restore. Changed to `state?.x != null`.
- **Off-screen window restore** — Saved window positions were restored without checking if the target display still exists (e.g., monitor unplugged). Added `safeSetBounds()` validation in `ready-to-show`.
- **IPC sent to destroyed windows** — `synchronizeApp()` and `setActionStateKey()` sent IPC messages to all windows without checking if they were destroyed, causing errors during window close. Added `!win.isDestroyed()` guards.
- **`setProgressBar` on destroyed window** — Auto-update progress bar was set via optional chaining which doesn't check `isDestroyed()`. Added explicit destruction checks.

### Settings Reorganization

- Reorder tabs: Crosshair (default) > Bindings > Appearance > App > Notifications > Keyboard > Advanced > About
- Rename tabs: "General" → "App", "Actions" → "Bindings"
- Improve labels: "Allow start locked" → "Resume locked on launch", "Close settings on blur" → "Auto-hide settings window", "Enable telemetry" → "Anonymous usage analytics", "Hide on Action" → "Auto-Hide", "Resize on ADS" → "ADS Zoom", "Enable Secondary Action" → "Secondary Crosshair"
- Fix reticle description incorrectly saying "crosshair"

### Security

- Sanitize SVG content before inline rendering — strip `<script>` tags, inline event handlers (`onload`, `onerror`, etc.), and `javascript:` URIs from user-provided SVG crosshair files before injecting via `dangerouslySetInnerHTML`.

## 4.0.0-alpha.1

### Features

- **Electron 40 upgrade** — Bump from Electron 12.2.3 to ^40.0.0 with electron-builder ^25.0.0
- **Replace iohook with uiohook-napi** — iohook is unmaintained; rewrite to use uiohook-napi 1.5.4 with manual keydown/keyup event tracking
- **Dev mode compatibility** — Switch from ts-node to tsx for Node 22 ESM compatibility
- **Hide on mouse button** — Configurable button + toggle/hold mode, hides crosshair via opacity
- **Hide on keypress** — Hold-to-hide with configurable key bind
- **ADS resize** — Configurable button + toggle/hold, changes crosshair scale when aiming down sights
- **Inline SVG rendering** — Fill/stroke/width customization for SVG crosshairs
- **Crosshair gallery chooser** — Browse and select crosshairs, drag-and-drop custom images
- **Secondary crosshair** — Full settings tab with renderer swap for secondary crosshair
- **Enriched tray menu** — More actions accessible from system tray
- **macOS accessibility flow** — Guided dialog for requesting accessibility permissions (required for uiohook)
- **App size modes** — Normal, resizable, and fullscreen crosshair window modes
- **Crash report dialog** — Renderer process crash detection and user notification
- **Single-instance lock** — `app.requestSingleInstanceLock()` focuses existing window instead of launching duplicate
- **Settings blur-to-close** — Optional auto-hide when settings window loses focus

### Tests

- **E2E test suite** — Playwright tests ported from CrossOver: launch, crosshair rendering, button interactions, settings window, keyboard IPC

### Infrastructure

- Add `.nvmrc` pinning Node 22
- Fix `devEngines` format for npm 11
- Fix electron-rebuild script fallback to `@electron/rebuild`
- Set `contextIsolation: true`, `nodeIntegration: false` explicitly
- Suppress EPIPE errors on electron-log console transport during shutdown

## 4.0.0

Rebuild from scratch using Electron and React. Complete rewrite of the original CrossOver app on top of the electron-bones boilerplate.
