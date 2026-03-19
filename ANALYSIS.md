# CrossOver vs XOver — Comparative Analysis

> **Generated:** 2026-03-07  
> **Crossover:** v3.4.1 (original, `~/repo/crossover`)  
> **XOver:** v4.0.0-alpha.2 (rebuild, `~/repo/xover`)

---

## Table of Contents

1. [Architecture Comparison](#1-architecture-comparison)
2. [Feature Matrix](#2-feature-matrix)
3. [Missing Features (Crossover → XOver)](#3-missing-features)
4. [Improvements in XOver](#4-improvements-in-xover)
5. [Bugs & Issues in XOver](#5-bugs--issues-in-xover)
6. [Recommendations](#6-recommendations)

---

## 1. Architecture Comparison

### Tech Stack

| Aspect | Crossover (v3) | XOver (v4) |
|---|---|---|
| **Language** | JavaScript (CommonJS) | TypeScript |
| **Renderer** | Vanilla JS + HTML/CSS | React 18 + React Router |
| **UI Components** | Raw HTML + Feather Icons | Radix UI + shadcn/ui + Lucide |
| **Styling** | SCSS (compiled) | Tailwind CSS + SCSS |
| **State Management** | `electron-preferences` (JSON file) | `electron-store` + React Context |
| **Settings Window** | `electron-preferences` (built-in UI) | Custom React SPA (separate BrowserWindow) |
| **Crosshair Chooser** | Separate child window (`chooser.html`) | Combobox in Settings SPA |
| **Build System** | electron-builder (direct) | Webpack (ERB boilerplate) + electron-builder |
| **Electron Version** | ^14.0.0 | 12.2.3 (devDep — ERB template default) |
| **Testing** | Playwright (E2E) | Jest (unit, minimal) |
| **IOHook** | `uiohook-napi` ^1.5.4 | `iohook` ^0.9.3 (older, unmaintained) |
| **Logging** | `electron-log` | `electron-log` |
| **Auto Update** | `electron-updater` 6.3.0 | `electron-updater` ^6.1.7 |
| **Analytics** | None | Aptabase (`@aptabase/electron`) |
| **Color Picker** | Pickr (vendored) | `react-colorful` / `@uiw/react-color-chrome` / `@mapbox/react-colorpickr` |

### Architecture Patterns

| Pattern | Crossover | XOver |
|---|---|---|
| **Window model** | 1 main + N shadow (Set-based) | N crosshair windows (Object keyed by UUID) |
| **Settings persistence** | `electron-preferences` → `preferences.json` | `electron-store` → `config.json` (schema-validated) |
| **IPC pattern** | `ipcRenderer.send/on` with channel whitelists | `ipcMain.handle/on` with typed channels enum |
| **Preload security** | `contextBridge.exposeInMainWorld` with whitelisted channels | `contextBridge.exposeInMainWorld` with typed handler |
| **Settings sync** | Main → Renderer push (IPC `set_*` messages) | Bidirectional: renderer requests via `invoke`, main pushes `APP_UPDATED` |
| **Per-window state** | Main window only; shadows clone settings | Every window has independent state in store |
| **Module structure** | Flat `src/main/*.js` files | `src/main/*.ts` + `src/main/utils/*.ts` + `src/renderer/components/**` |

### Code Quality

| Metric | Crossover | XOver |
|---|---|---|
| **Type safety** | None (JS) | TypeScript throughout |
| **Circular deps** | Some (uses `madge` to check) | Some (hard-coded IPC channel strings to avoid) |
| **Error handling** | `electron-unhandled` + crash dialog | `electron-unhandled` + Logger |
| **Code organization** | Reasonable for JS, some monolithic files | Well-organized React component hierarchy |
| **Test coverage** | Playwright E2E (8 spec files) | Single Jest smoke test |

---

## 2. Feature Matrix

### Core Features

| Feature | Crossover | XOver | Notes |
|---|---|---|---|
| **Crosshair overlay (always-on-top)** | ✅ | ✅ | Both use `screen-saver` level |
| **Transparent window** | ✅ | ✅ | |
| **Click-through when locked** | ✅ | ✅ | `setIgnoreMouseEvents` |
| **Lock/Unlock toggle** | ✅ | ✅ | |
| **Center crosshair** | ✅ | ✅ | |
| **Pixel-level movement (arrow keys)** | ✅ | ✅ | |
| **Multi-monitor: move to next display** | ✅ | ✅ | |
| **Custom crosshair images** | ✅ | ✅ | XOver via file dialog + store |
| **Built-in crosshair library** | ✅ | ✅ | Same crosshair assets |
| **Crosshair size** | ✅ (px slider 1-100) | ✅ (scale % 0-100) | Different approach |
| **Crosshair opacity** | ✅ (slider 1-100) | ✅ (slider 0-100) | |
| **Crosshair rotation** | ❌ | ✅ | XOver adds -180° to 180° rotation |
| **Reticle (center sight)** | ✅ (dot/cross/circle/off) | ✅ (35+ reticle styles via Radix icons) | XOver much richer |
| **Reticle color** | ✅ | ✅ | |
| **Reticle scale** | ✅ (slider 1-500) | ✅ (slider 0-100) | |
| **Reticle rotation** | ❌ | ✅ | XOver adds -180° to 180° |
| **Sound effects** | ✅ | ✅ | XOver has extensive sound library |
| **System notifications** | ✅ | ✅ | XOver adds notification type selection |
| **Dark/Light/System theme** | ✅ | ✅ | |
| **Settings persistence** | ✅ | ✅ | Both persist across sessions |
| **Position persistence** | ✅ | ✅ | XOver per-window |
| **Keyboard shortcuts** | ✅ | ✅ | Both customizable |
| **System tray** | ✅ | ✅ | Crossover richer tray menu |
| **Auto-update** | ✅ | ⚠️ (code exists, commented out in startup) | Not active |
| **Start on boot** | ✅ | ✅ | |
| **Quit app** | ✅ | ✅ | |
| **Reset all settings** | ✅ | ✅ | |

### Shadow/Duplicate Windows

| Feature | Crossover | XOver | Notes |
|---|---|---|---|
| **Duplicate/shadow windows** | ✅ (up to 14) | ✅ (unlimited, UUID-keyed) | |
| **Per-window state** | ❌ (shadows clone main) | ✅ (each window independent) | XOver improvement |
| **Close individual shadow** | ✅ | ✅ | |
| **Close all shadows** | ✅ | ❌ | Missing in XOver |
| **Focus next window** | ✅ | ✅ | |
| **New window (blank)** | ❌ | ✅ | XOver adds "new" vs "duplicate" |
| **Shadow window colored bg** | ✅ (random color) | ❌ | Missing in XOver |
| **Max window limit** | ✅ (14) | ❌ (no limit) | Could be a problem |

### IOHook / Actions

| Feature | Crossover | XOver | Notes |
|---|---|---|---|
| **Follow mouse** | ✅ | ✅ | |
| **Hide on mouse button** | ✅ (any button, toggle/hold) | ❌ | **Missing** |
| **Hide on keypress** | ✅ (any key, hold) | ❌ | **Missing** |
| **Resize on ADS** | ✅ (toggle/hold right-click) | ❌ | **Missing** |
| **ADS size setting** | ✅ | ❌ | **Missing** |
| **Tilt left/right** | ✅ (keyboard only) | ✅ (keyboard + mouse) | XOver adds mouse binds |
| **Tilt toggle/hold** | ✅ | ✅ | |
| **Tilt angle** | ✅ (1-90°) | ✅ (0-90°) | |
| **Secondary action** | ❌ | ⚠️ (UI commented out, infra exists) | Partially implemented |
| **Accessibility check (macOS)** | ✅ (full dialog flow) | ❌ | **Missing** |
| **IOHook library** | `uiohook-napi` (maintained) | `iohook` (unmaintained) | XOver uses older lib |

### Crosshair Customization

| Feature | Crossover | XOver | Notes |
|---|---|---|---|
| **SVG fill color** | ✅ | ⚠️ (UI commented out, settings exist) | Not functional |
| **SVG stroke color** | ✅ | ⚠️ (UI commented out) | Not functional |
| **SVG stroke width** | ✅ | ⚠️ (UI commented out) | Not functional |
| **SVG inline rendering** | ✅ (inline-svg library) | ❌ | Missing; SVGs render as `<img>` |
| **Circle reticle thickness** | ✅ | ❌ | Missing |
| **App background color** | ✅ | ✅ | |
| **App icon/highlight color** | ✅ | ✅ (foreground color) | |
| **Drag-and-drop custom image** | ✅ | ❌ | **Missing** |
| **Custom image via file dialog** | ✅ (in preferences + menu) | ⚠️ (via combobox, no dedicated dialog) | Partial |
| **Crosshair chooser window** | ✅ (dedicated popup) | ❌ (combobox dropdown in settings) | Different UX |

### Window Management

| Feature | Crossover | XOver | Notes |
|---|---|---|---|
| **App size modes (normal/resize/fullscreen)** | ✅ | ⚠️ (resizable toggle only) | Missing fullscreen mode |
| **Aspect ratio lock** | ✅ (16:10) | ✅ (16:10) | |
| **Hide/Show all windows** | ✅ (CSS class toggle) | ✅ (window.hide/show) | Different approach |
| **Safe bounds (prevent off-screen)** | ✅ | ✅ | |
| **Settings window blur-to-close** | ✅ | ❌ (commented out) | |
| **Dock icon visibility** | ✅ (auto based on lock) | ✅ (user setting) | XOver more explicit |
| **Taskbar icon** | ✅ (default) | ✅ (toggle setting) | XOver has toggle |
| **Progress bar (download)** | ✅ (main window) | ✅ (settings window) | |
| **Visible on all workspaces** | ✅ | ✅ | |
| **Visible on fullscreen** | ✅ | ✅ | |

### System Settings

| Feature | Crossover | XOver | Notes |
|---|---|---|---|
| **GPU/Hardware acceleration toggle** | ✅ | ✅ | |
| **GPU in-process mode** | ✅ | ✅ (command-line flag) | |
| **Start unlocked option** | ✅ | ✅ (start locked) | Inverted default |
| **Developer alerts** | ✅ (remote CROSSOVER_ALERT) | ❌ | Missing |
| **Notification toggle** | ✅ | ✅ | |
| **Sound toggle** | ✅ | ✅ | |
| **Command-line flags UI** | ❌ | ✅ (9 configurable flags) | XOver improvement |
| **Disable all keyboard shortcuts** | ❌ | ✅ (except lock) | XOver improvement |
| **Analytics toggle** | ❌ | ✅ (Aptabase) | XOver improvement |
| **Quit on window close (macOS)** | ❌ | ✅ | XOver improvement |
| **Transition duration** | ❌ | ✅ (configurable ms) | XOver improvement |

### Application Menu

| Feature | Crossover | XOver | Notes |
|---|---|---|---|
| **macOS app menu** | ✅ (full with preferences) | ✅ (standard) | |
| **File menu** | ✅ (custom image, close) | ✅ | |
| **Help menu** | ✅ (links, report issue, about) | ✅ | |
| **Debug menu (dev only)** | ✅ (prefs file, app data, delete) | ✅ (context menu) | |
| **Tray: Show app** | ✅ | ❌ | Missing |
| **Tray: Preferences** | ✅ | ✅ (Settings) | |
| **Tray: Custom image** | ✅ | ❌ | Missing |
| **Tray: Reset** | ✅ | ❌ | Missing |
| **Tray: About** | ✅ | ✅ | |
| **Tray: Quit** | ✅ | ✅ | |

### Build & Distribution

| Feature | Crossover | XOver | Notes |
|---|---|---|---|
| **macOS (DMG, universal)** | ✅ | ✅ (arm64 + x64) | |
| **Windows (NSIS + Portable)** | ✅ | ✅ | |
| **Windows (AppX/Microsoft Store)** | ✅ | ✅ (config exists) | |
| **Linux (AppImage, deb, rpm, etc.)** | ✅ | ✅ | |
| **Snap Store** | ✅ | ✅ | |
| **Windows auto-launch (Store)** | ✅ (`electron-winstore-auto-launch`) | ❌ | Missing |
| **macOS notarization** | ❌ (not configured) | ✅ (afterSign script) | XOver improvement |
| **CI/CD** | CircleCI + Appveyor + GitHub Actions | GitHub Actions (build, test, publish, CodeQL) | |
| **Code signing** | ❌ | ✅ (entitlements.mac.plist) | XOver improvement |
| **Single instance lock** | ✅ | ❌ | **Missing** |

### Testing

| Feature | Crossover | XOver | Notes |
|---|---|---|---|
| **E2E tests** | ✅ (Playwright, 8 spec files) | ❌ | **Missing** |
| **Unit tests** | ❌ | ⚠️ (1 smoke test) | Barely exists |
| **Accessibility tests** | ✅ (axe-playwright) | ❌ | Missing |
| **Sanity/button tests** | ✅ | ❌ | Missing |

### Unique Features

| Feature | Crossover | XOver | Notes |
|---|---|---|---|
| **Second instance → create shadow** | ✅ | ❌ | Crossover-only |
| **Developer alert system** | ✅ (fetches from GitHub) | ❌ | |
| **Crash report dialog** | ✅ (GitHub issue auto-fill) | ❌ | Missing |
| **Custom image notification** | ✅ | ❌ | |
| **Hide on key (hold-to-hide)** | ✅ | ❌ | **Missing** |
| **Hide on mouse (ADS hide)** | ✅ | ❌ | **Missing** |
| **Resize on ADS** | ✅ | ❌ | **Missing** |
| **React-based settings SPA** | ❌ | ✅ | XOver-only |
| **Per-window independent settings** | ❌ | ✅ | XOver-only |
| **35+ reticle shapes** | ❌ (4: dot/cross/circle/off) | ✅ | XOver-only |
| **Crosshair rotation** | ❌ | ✅ | XOver-only |
| **Reticle rotation** | ❌ | ✅ | XOver-only |
| **App message log** | ❌ | ✅ | XOver-only |
| **Command-line flags UI** | ❌ | ✅ | XOver-only |
| **IOHook mouse binds for tilt** | ❌ | ✅ | XOver-only |
| **Analytics (Aptabase)** | ❌ | ✅ | XOver-only |
| **Context menu (dev)** | ❌ | ✅ | XOver-only |
| **Protocol handler (`crossover://`)** | ❌ | ✅ (registered) | XOver-only |
| **Online status indicator** | ❌ | ✅ (react-is-online-context) | XOver-only |
| **UI sounds library** | ❌ | ✅ (Material Design sounds) | XOver-only |

---

## 3. Missing Features

These are features present in Crossover that XOver lacks, **ranked by importance**:

### 🔴 Critical (Core Gaming Functionality)

1. **Hide crosshair on mouse button (ADS hide)** — Crossover hides the crosshair when a configurable mouse button is held/toggled. Essential for FPS games where ADS has its own crosshair. XOver has no equivalent.

2. **Hide crosshair on keypress** — Crossover hides the crosshair while a configurable key is held. Important for games with variable scope/aim states.

3. **Resize crosshair on ADS** — Crossover resizes the crosshair when right-clicking (ADS). Configurable between toggle and hold modes, with a separate ADS size setting. Missing entirely from XOver.

4. **SVG inline rendering** — Crossover inlines SVG crosshairs so CSS variables (fill, stroke, stroke-width) actually affect the SVG content. XOver renders SVGs as `<img>` tags, making SVG customization impossible. The SVG settings UI is commented out because of this.

5. **macOS accessibility permission flow** — Crossover has a comprehensive dialog flow to request, guide, and track accessibility permissions needed for IOHook features. XOver has no accessibility handling at all.

### 🟡 Important (UX & Polish)

6. **Crosshair chooser window** — Crossover has a dedicated popup window showing all available crosshairs in a visual grid. XOver uses a small combobox dropdown in settings — much harder to browse.

7. **Drag-and-drop custom images** — Crossover supports dragging image files directly onto the crosshair window. XOver has no drag-and-drop support.

8. **Custom image file dialog (dedicated)** — Crossover has a "Custom Image..." menu item that opens a native file dialog with proper image filters. XOver only allows image selection through the settings combobox.

9. **Single instance lock** — Crossover prevents multiple app instances and uses second-instance events to create shadow windows. XOver has no single-instance enforcement.

10. **Auto-update active** — While XOver has auto-update code, it's commented out in `startup.ts` (`// new AutoUpdate();`). Not functional.

### 🟢 Nice to Have

11. **Close all shadow windows** — Crossover has `closeAllShadows()`. XOver only allows closing windows individually.

12. **Shadow window random colored background** — When creating shadows in Crossover, each gets a random colored background for easy identification.

13. **Tray menu richness** — Crossover's tray has: Show App, Preferences, Choose Crosshair, Custom Image, Reset, About, Quit. XOver's tray has: Settings, About, Quit.

14. **Developer alert system** — Crossover can fetch developer messages from a GitHub file and display them. Useful for urgent bug notices.

15. **Crash report dialog** — Crossover shows a dialog on crash with options to report to GitHub with pre-filled issue data.

16. **App size modes** — Crossover supports normal, resizable, and fullscreen-sized window modes. XOver only has a resizable toggle.

17. **Settings window blur-to-close** — Crossover auto-closes settings when user clicks away. XOver has this commented out.

18. **Second instance → shadow creation** — Opening Crossover again when already running creates a shadow window. Useful workflow.

19. **E2E tests** — Crossover has 8 Playwright spec files covering buttons, IPC, accessibility, etc. XOver has essentially no tests.

20. **Windows Store auto-launch** — Crossover has `electron-winstore-auto-launch` for Store builds.

21. **Circle reticle thickness** — Crossover allows adjusting circle reticle stroke width. Missing from XOver.

22. **Hide/Show reticle keybind** — Crossover has Ctrl+Shift+Alt+S to toggle reticle visibility. Missing from XOver.

---

## 4. Improvements in XOver

Things XOver does better than Crossover:

### Major Improvements

1. **TypeScript** — Full type safety across the codebase. Crossover is untyped JavaScript.

2. **Modern React UI** — Settings are a proper React SPA with Radix UI primitives, Tailwind CSS, and excellent component architecture. Crossover uses `electron-preferences` which has limited customization.

3. **Per-window independent state** — Each crosshair window in XOver has its own crosshair, size, opacity, rotation, and reticle settings stored independently. Crossover shadows clone the main window.

4. **35+ reticle styles** — XOver uses Radix UI icons for a huge variety of reticle shapes (crosshair, target, star, heart, pin, etc.) vs Crossover's 4 (dot, cross, circle, off).

5. **Crosshair & reticle rotation** — XOver adds -180° to 180° rotation for both crosshair image and reticle. Crossover has no rotation.

6. **Schema-validated store** — `electron-store` with JSON Schema validation catches invalid settings. Crossover's `electron-preferences` has no validation.

7. **Command-line flags UI** — XOver exposes 9 Electron command-line switches in a checkbox UI. Crossover only has GPU toggle.

8. **Mouse + keyboard IOHook binds** — XOver supports binding tilt to mouse buttons OR keyboard keys. Crossover only supports keyboard for tilt.

9. **Disable all keyboard shortcuts** — XOver can disable all shortcuts except lock. Useful to prevent accidental triggers.

10. **Analytics** — XOver has opt-in Aptabase analytics for usage tracking.

### Minor Improvements

11. **macOS notarization** — XOver has notarization scripts and entitlements configured.
12. **Protocol handler** — `crossover://` protocol registered.
13. **Online status indicator** — Shows connectivity status.
14. **UI sounds library** — Extensive Material Design sound effects for interactions.
15. **Transition duration** — Configurable animation speed.
16. **Quit on window close** — macOS-specific option.
17. **Taskbar icon toggle** — Windows users can hide the taskbar icon.
18. **Dock icon toggle** — macOS users can explicitly control dock visibility.

---

## 5. Bugs & Issues in XOver

### Confirmed Bugs / Incomplete Implementations

1. **Auto-update disabled** — `startup.ts:ready()` has auto-update commented out. No updates will be delivered.

2. **SVG customization non-functional** — `SettingsSVG.tsx` has all controls commented out. The SVG fill/stroke/width settings exist in the store but aren't applied because SVGs render as `<img>` tags (not inlined).

3. **Secondary action UI commented out** — `SettingsActions.tsx` has the secondary action enable switch, bind input, and behavior selector all commented out. The infrastructure exists in `iohook.ts` but can't be configured.

4. **Secondary crosshair tab shows placeholder** — `SettingsWindow.tsx` shows "Change your secondary here." text in the Secondary tab with no actual controls.

5. **`iohook` dependency is unmaintained** — XOver uses `iohook@^0.9.3` which is abandoned. Crossover migrated to `uiohook-napi@^1.5.4` which is actively maintained. The old `iohook` has known compatibility issues with newer Electron versions.

6. **Electron version mismatch** — `package.json` specifies `electron: "12.2.3"` (from the ERB template, 2021). This is extremely old. The `iohook` targets in the config point to `electron-87` (Electron 12), but modern features may not work.

7. **Settings window `close` handler prevents quit** — The settings window's `close` handler calls `e.preventDefault()` and hides instead of closing. This could prevent the app from quitting cleanly if the settings window is the last window.

8. **No max window limit** — Unlike Crossover's 14-window cap, XOver allows unlimited crosshair windows. Could lead to resource exhaustion.

9. **`focusNextWindow` includes settings window** — The implementation cycles through ALL windows including settings, which is confusing. There's a commented-out fix for this.

10. **Reset app button doesn't restart** — Noted in TODO comments: "Reset app button in settings should restart app" and "Restart app doesn't work."

11. **Dock icon remains after quitting** — Listed as a known issue in `main.ts` TODOs.

12. **Resizable window crosshair doesn't stay centered** — Listed as a known issue.

13. **`iohook` hold behavior for mouse secondary** — The `registerToggleHoldMouseAlt` function has a bug: the `hold` path's `mousedown` handler toggles instead of just setting to true (comment says "MACOS Mousedown fired twice for middle mouse").

14. **Context isolation not fully enabled** — `preload.ts` has `contextIsolation` and `nodeIntegration` settings commented out as "Todo: secure."

15. **`webSecurity` disabled in dev** — `create-window.ts` sets `webSecurity: !is.development`, which is risky even in development.

### TODO Items from Source (Author's Own Notes)

From `main.ts`:
- App registration
- Sounds for actions
- Logging improvements
- Translations/i18n
- Protocol handling
- Scroll reset when changing settings page
- Improve keybind input
- Large crosshair chooser
- SVG support
- Image overlay (#112)
- Tray/Dock menus
- First run experience
- Migrations
- Ask for accessibility permissions (macOS)
- Less renderer sync
- Position settings improvements

---

## 6. Recommendations

### Priority 1 — Fix Critical Gaps

These block feature parity with Crossover for gaming use:

1. **Migrate from `iohook` to `uiohook-napi`** — The current dependency is unmaintained and incompatible with modern Electron. This is a blocker for all IOHook features.

2. **Implement Hide on Mouse Button (ADS hide)** — Port Crossover's `hideOnMouse()` from `iohook.js`. Support all mouse buttons, toggle/hold modes. This is one of the most-requested gaming features.

3. **Implement Hide on Keypress** — Port Crossover's `hideOnKey()`. Support any single key as a hold-to-hide trigger.

4. **Implement Resize on ADS** — Port Crossover's `resizeOnADS()`. Toggle/hold modes for right-click resize with configurable ADS size.

5. **Enable auto-update** — Uncomment the `AutoUpdate` instantiation in `startup.ts:ready()`. Configure and test the update flow.

6. **Implement SVG inline rendering** — Either use a library like `inline-svg` or implement React-based SVG inlining so fill/stroke CSS variables work. Un-comment the SVG settings UI.

### Priority 2 — Important UX Parity

7. **Add macOS accessibility permission flow** — Port Crossover's `accessibility.js`. Check permissions before starting IOHook, show guidance dialogs, handle restart.

8. **Add single-instance lock** — Use `app.requestSingleInstanceLock()`. On second instance, focus existing window or create duplicate.

9. **Build a crosshair chooser** — Replace the small combobox with a visual grid/gallery. Could be a modal dialog, a dedicated page in settings, or a separate window like Crossover.

10. **Add drag-and-drop image support** — Add `dragenter/dragover/drop` handlers to the crosshair window. Send file path to main process via IPC.

11. **Upgrade Electron** — Move from 12.2.3 to a current version (28+). This is needed for security, performance, and `uiohook-napi` compatibility.

### Priority 3 — Polish & Quality

12. **Add Hide/Show Reticle keybind** — Port Crossover's `hideReticle` shortcut.

13. **Enrich tray menu** — Add: Show App, Choose Crosshair, Custom Image, Reset.

14. **Add close-all-windows command** — Implement `closeAllShadows` equivalent.

15. **Add max window limit** — Cap at 20 or similar to prevent resource issues.

16. **Fix secondary action UI** — Un-comment the secondary action controls in `SettingsActions.tsx`. Complete the secondary crosshair settings tab.

17. **Add E2E tests** — Port Crossover's Playwright tests or write new ones with the Playwright + Electron setup.

18. **Settings window blur-to-close** — Un-comment and test the blur handler.

19. **Add app size modes** — Implement normal/resizable/fullscreen like Crossover.

20. **Add crash report dialog** — Show a user-friendly dialog on crashes with auto-filled GitHub issue creation.

### Priority 4 — Future Enhancements

21. **Add circle reticle thickness** control.
22. **Add developer alert system** (fetch from remote).
23. **Second instance → duplicate window** behavior.
24. **Windows Store auto-launch** support.
25. **Shadow window colored backgrounds** for visual differentiation.
26. **i18n / translations** support.
27. **First-run experience** / onboarding.

---

## Summary

**XOver is a significant architectural improvement** over Crossover — TypeScript, React, modern UI components, per-window state, and better code organization. The settings UI is substantially better.

**However, XOver is missing critical gaming features** that Crossover has: ADS hide, key hide, ADS resize, SVG customization, and accessibility permissions. The IOHook dependency (`iohook`) is unmaintained and needs replacing. Auto-update is disabled. The Electron version is ancient.

**The primary goal should be:** migrate to `uiohook-napi`, implement the missing IOHook actions (hide on mouse, hide on key, resize on ADS), enable auto-update, and upgrade Electron. These changes would bring XOver to feature parity with Crossover while maintaining its architectural advantages.
