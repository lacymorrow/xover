CrossOver Parity Tasks

- Core Windows
  - Main crosshair window parity (always-on-top, transparent, aspect ratio)
  - Multiple crosshair windows (duplicate/new) with saved state
  - Settings window show/hide behavior aligns with lock state
  - Child/Chooser window for crosshair selection

- Preferences/Settings
  - Map legacy settings to new schema: theme, colors, sounds, notifications
  - Start on login (auto-launch) toggle
  - Auto-update toggle and behavior
  - Keyboard shortcuts enable/disable while locked
  - Actions: follow mouse, hide on mouse, hide on key, ADS resize, tilt controls

- Menus/Tray
  - App menu items: Preferences…, Choose Crosshair…, Open Custom Image…, Reset, About, Help links
  - Tray menu parity with quick actions

- Auto Update
  - Background checks, notifications, progress, relaunch prompt

- Accessibility (macOS)
  - Check/request permissions for uiohook features
  - Non-blocking notifications and restart guidance

- Sounds/Alerts
  - Preload and play all event sounds, gated by setting
  - Developer alert (remote message) support

- IPC
  - Parity for channels used by renderer crosshair and settings UIs

- Files/Images
  - Scan bundled assets and allow user custom image selection via dialog


Work Log

1) Enable Auto Update based on setting and wire event handlers — Done
   Implemented constructor wiring in `src/main/auto-update.ts` and enabled initialization in `startup.ready()` when `allowAutoUpdate` is true.

2) Accessibility permissions for uiohook on macOS — Done
   Added `src/main/accessibility.ts`, integrated checks in startup and before starting uiohook; shows notifications and handles restart guidance on macOS.

3) Open Custom Image dialog + menu/tray entries — Done
   Added `openImageDialog()` to `src/main/dialog.ts`, wired into app menu (mac + others) and tray menu.

Next Up

- Mouse actions: hide on mouse (toggle/hold), ADS resize (toggle/hold) — Done (initial)
- Keyboard action: hide on key (hold/toggle) — Done (initial)
- Developer alerts parity (optional)

Completed

4) Crosshair Chooser window parity (gallery of assets, select and apply) — Done
   Implemented `createChooserWindow()` in `src/main/create-window.ts`, added IPC `open-chooser-window`, preload bridge `openChooser()`, chooser renderer UI at `src/renderer/windows/chooser/ChooserApp.tsx`, and entry `src/renderer/chooser.tsx`. Selecting an item sets the active window's `crosshair`.

5) Mouse/Keyboard actions — Done (initial)
   Added config/state for `hideOnMouseBind`, `hideOnMouseBehavior`, `hideOnKeyBind`, `adsResizeEnabled`, `adsResizeBind`, `adsResizeBehavior`, `adsResizeSize`. Implemented listeners in `src/main/iohook.ts` that signal renderer with `set_crosshair_opacity` and `set_crosshair_size`. Added renderer listeners in `Home.tsx` that update window state accordingly. Further UX polish remains.

