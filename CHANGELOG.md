# Changelog

## 4.0.0-beta.7

### Bug Fixes

- **Follow Mouse froze while any mouse button was down.** `uiohook-napi` maps libuiohook event types 4-9 and 11 to named events and has no case for `EVENT_MOUSE_DRAGGED` (10), so `mousemove` went silent for the whole drag. The hook now also listens on the catch-all `input` event and forwards type 10 to the same handler. Ported from v3 #542 / #541.
- **The keyboard Auto-Hide bind ignored "Press to toggle".** Settings has offered the choice since v4 shipped, but the keyboard registration never read it, so picking it did nothing. It now honors the setting and adds a third mode from v3 #573 / #340: press to hide until the next ADS click, for dropping into first-person without holding a key. Press mode is offered for keyboard binds only; a bind switched to the mouse falls back to hold.
- **Show App could not bring back a crosshair when none was usable.** Completes the beta.5 tray crash (`TypeError: Object has been destroyed` at `tray.ts:37`): beta.5's reset wiped `windows.crosshairWindows`, so closing the crosshair later left `mainWindow` pointing at a destroyed window. beta.6 removed that line and guarded destroyed windows; Show App now also repoints a stale `mainWindow` at a live crosshair, or creates one, the way the Dock icon does. Previously it left the lock on with no crosshair on screen.

## 4.0.0-beta.6

### Bug Fixes

- **Toggle Reticle would not stay bound.** The keybind shipped in beta.5, and electron-store only applies defaults when the whole `keybinds` key is absent, so no store upgraded from beta.4 had the property. `setKeybind` validated the action against the keys the store already had and dropped every write. Any action added after an install was created was affected; the store is now backfilled from the defaults.
- **Reset confirmation opened behind other apps**, from the tray and from Settings > Advanced. The dialog now brings CrossOver to the front and attaches itself to the settings window when that window is up. Same for the update prompt.
- **Reset re-centers the crosshair** on the display it is currently on. Reset also behaves the same from all three entry points now: the tray and Settings > Advanced used to skip the sound, the image rescan and the transient state.
- **Center Crosshair moved the settings window.** Global shortcuts act on crosshair windows only. The same audit fixed the move and display shortcuts doing nothing while the crosshair was locked, Focus Next Window cycling through Settings, and the crosshair's own center and close buttons acting on whichever window shared a numeric id.
- **Show App left a locked crosshair stuck.** Show App, a second launch and the Settings shortcut now unlock and unhide the app before showing Settings. A locked app refused to open Settings, so all three did nothing at all.
- **Auto-Hide left the reticle on screen.** Auto-Hide (ADS) hid the crosshair image only; the reticle is a sibling element and stayed at full opacity, and the secondary crosshair overrode the hide outright. It now hides the whole overlay in hold, toggle and invert modes, and the reticle returns to its own Toggle Reticle state on reveal.
- **About page was still the template's.** Rebranded from "Electron-Hotplate", with the hardcoded star count and date dropped and the card pointing at lacymorrow/crossover. Window title, package keywords and the Snap store description too.

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
