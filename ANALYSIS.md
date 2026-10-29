# CrossOver v3 vs v4 — Parity Analysis

> **Verified:** 2026-10-20 (LAC-5182)
> **v3:** `~/repo/crossover` @ 3.4.7 (shipping)
> **v4:** `~/repo/xover` @ 4.0.0-beta.4 (this repo)

This document exists for one decision: **can the v3 in-app banner send users to v4 without taking something away from them?** Every row below was read in both codebases on the date above.

The previous revision was written 2026-03-07 against v4 alpha and had gone badly stale. Most of its "missing" rows had shipped since: hide-on-mouse, hide-on-key, ADS resize, the macOS accessibility flow, the single-instance lock, auto-update, inline SVG rendering, drag-and-drop, the crosshair gallery, app size modes, the full tray menu, E2E tests, and the move to Electron 40 and `uiohook-napi`. Treat anything older than the header date as unverified.

---

## 1. Verdict

v4 is at parity on everything a v3 user touches, except the five rows in §3.

v4 is a rewrite, not a port, so some v3 behaviours are intentionally absent rather than missing. Those are in §6 and are not rollout blockers. Only §3 blocks.

Everything in §3 and §4 is free in v3 and stays free in v4. Rotation and the secondary crosshair are the only Pro features.

---

## 2. Stack

| | v3 | v4 |
|---|---|---|
| Language | JavaScript (CommonJS) | TypeScript |
| Renderer | Vanilla JS + HTML/SCSS | React 18 + React Router |
| Settings UI | `electron-preferences` built-in window | React SPA in its own BrowserWindow |
| Store | `electron-preferences` → `preferences.json` | `electron-store` → `config.json`, JSON-Schema validated |
| Electron | ^14 | ^40 |
| Input hook | `uiohook-napi` | `uiohook-napi` |
| Updates | `electron-updater` | `electron-updater` |
| Tests | Playwright E2E | Playwright E2E + Jest unit |
| Licensing | none (all free) | Polar.sh; rotation and secondary crosshair are Pro |

Both ship the same crosshair assets: 200 Kenney SVGs plus the named sets.

---

## 3. Gaps — v3 has it, v4 does not

| Feature | v3 source | Note |
|---|---|---|
| First-run onboarding overlay | `199a36e` | Four-step walkthrough on first launch. Needs a React overlay and a design pass, so it is tracked on its own issue rather than batched here |
| Circle reticle thickness | `crosshair.circleThickness` | v4 has SVG stroke width but no circle-reticle thickness. `migrate-v3.ts` skips the key |
| Developer alert system | `src/main/alert.js` | v3 fetches an urgent-notice file from GitHub and shows it. No v4 equivalent |
| Windows Store auto-launch | `electron-winstore-auto-launch` | Only affects the AppX/Store build |

---

## 4. Ported in this pass (LAC-5182)

| Feature | v3 source | Where it landed in v4 |
|---|---|---|
| Deny-all browser permission handlers | `dadbd47` + `5ccbf06` | `src/main/session-permissions.ts`, deferred behind `app.whenReady()` |
| Portable build keeps `userData` next to the exe | `04d6493` | `src/main/portable.ts`, imported first in `main.ts` |
| Notify when `globalShortcut.register()` fails | `bc6c7fc` | `src/main/keyboard.ts` + `$notifications.shortcutConflict` |
| Release the input hook before quit | `e53d988` | `releaseInput()` in `src/main/app-listeners.ts` |
| `--reset` CLI flag with forced safe GPU | `6b5a1d2` | `isResetRequested()` in `src/main/command-line-flags.ts` |
| Kenney crosshairs as SVG | `244f26b` + `3fa218b` | `assets/crosshairs/Kenney/*.svg` |
| Master switch to disable all keybinds | `e1158af` | Settings → Keyboard |
| Hide from screen recording | `4ac2cdf` | Settings → App |
| Show-on-ADS (inverted auto-hide) | `12400e4` | Settings → Bindings, "Invert" under Auto-Hide |
| Toggle Reticle keybind (`Ctrl+Shift+Alt+S`) | `24593f8` | Settings → Keyboard |
| Confirmation before reset | `cf72e19` | Reset dialog: tray and Advanced |

The v3 importer now carries `app.hideFromScreenCapture`, `actions.showOnMouseInvert` and `keybinds.hideReticle` across instead of dropping them.

### Ported since (LAC-5973)

| v3 fix | Where it landed in v4 |
|---|---|
| #580 / GH #546: crosshair did not draw over a macOS fullscreen game | `dock.setVisible(false)` moved above `new BrowserWindow()` in `src/main/create-window.ts`. macOS only floats a window over another app's fullscreen Space when the process was already a UIElement when that window was created |
| #571 / GH #456: native Wayland cannot grab a global hotkey, silently | `src/main/wayland.ts` `detect()`, called from `startup()`; the notice fires from `keyboard.ts` |
| #577 / GH #456: relaunch once on Ozone/X11 so the hotkeys work | `relaunchOnX11()` in `src/main/wayland.ts`, called first in `ready()`. Live code in v4 where it was dead in v3: v3 ships Electron 14, v4 ships 40. Behind the `relaunchOnX11` setting (Settings -> Advanced, Linux only, defaults on) because overlay transparency on Ozone/X11 under a Wayland compositor has no hardware in the fleet to confirm it |

Unlike v3, v4 defaults `showDockIcon` to true, which looked like it would cost the
fullscreen fix: a process with a dock icon is not a UIElement. Measured on macOS
26.7.1 with Electron 40, it does not. Only the state at creation matters, so
hiding the dock, creating the window and putting the icon straight back keeps
both. `src/__tests__/macos-fullscreen.test.ts` pins that order.

---

## 5. Not applicable — a v3 fix for a bug v4 never had

| v3 fix | Why it does not apply |
|---|---|
| `489579c` lock state lost on restart (Windows) | v3 restored lock through a 400ms timeout, later a `did-finish-load` event. v4 applies lock synchronously in the `BrowserWindow` constructor (`focusable`, `movable`) plus `setIgnoreMouseEvents`, and exposes `startLocked`. There is no timeout to fix |
| `c385610` ADS resize button check | The v3 bug was `parseInt('toggle')` → `NaN` after the preference changed from a number to a mode string. v4 stores `adsResizeButton` (number) and `adsResizeBehavior` (string) separately |
| `6b5a1d2` lingering process after quit | v4 already force-exits in `before-quit`. Only the input-hook teardown was missing; that part is in §4 |
| `52424ab`, `fe19c0e` accessibility permission flow | Already present as `src/main/accessibility.ts`: request dialog, restart prompt, skip path, and the `needsAccessibilityCheck` recheck after restart |
| `87150c9`, `4ba9b35` destroyed-window null guards | v4 guards its `webContents.send` and `setBounds` call sites with `isDestroyed()` |
| `dcd21cf`, `4eccdf8` `electron-preferences` defaults and debounce | Specific to `electron-preferences`, which v4 does not use |

The remaining ~30 v3 "auto commit" commits between 3.3.0 and 3.4.2 touch only test artifacts, crosshair assets, `package.json` churn, and SCSS that has no v4 counterpart.

---

## 6. By design — v3 behaviour v4 deliberately dropped

Not gaps. Re-adding any of these needs a reason.

| v3 behaviour | v4 instead |
|---|---|
| Crosshair chooser in a separate popup window | Visual gallery inside the settings SPA (`CrosshairGallery.tsx`) |
| Shadow windows clone the main window | Every window keeps fully independent state, keyed by UUID |
| Shadow windows get a random background colour | Nothing. It identified cloned windows, which no longer exist |
| 14-window cap (`MAX_SHADOW_WINDOWS`) | No cap. The cap existed because shadows were cheap clones; per-window state makes any fixed number arbitrary. See §8.4 |
| Second instance creates a shadow window | Second instance focuses the running one and exits (#54) |
| `hidden.disableSafetyKeybinds` escape hatch | Not ported. Lock and Reset always survive the master switch, so the app can never be stranded locked |
| Hide keybind only works while locked | Works always |
| Reticle-hidden state persists across restart | Transient, like the hide-app state. Toggle Reticle is a mid-match action, and v3 had no UI for the flag, so persisting it meant relaunching into a missing reticle with nothing anywhere to explain why |

---

## 7. v4-only

Listed so the banner copy does not undersell the upgrade.

- Per-window independent crosshair, size, opacity, rotation and reticle
- 35+ reticle shapes (v3 has 4)
- Crosshair and reticle rotation (Pro)
- Secondary crosshair on a bind (Pro)
- Tilt bound to mouse buttons as well as keys
- Command-line flag UI (9 switches)
- App size modes: normal, resizable, fullscreen
- `crossover://` protocol handler and checkout deep link
- v3 settings import on first run (`import-v3.ts`)
- Opt-in Aptabase analytics
- Sound library for UI actions
- Configurable transition duration
- Dock, taskbar and tray icon toggles; quit-on-close
- macOS notarization and a universal (Intel + Apple Silicon) build

---

## 8. Known rough edges in v4

Found while auditing. None block the rollout; each needs its own issue.

1. `src/renderer/components/pages/settings/appearance/SettingsSVG.tsx` is orphaned. Nothing imports it, its controls are commented out, and it reads `settings.*` for fields that live on window state. The live SVG fill and stroke controls are in `SettingsCrosshair.tsx`.
2. `DEFAULT_KEYBINDS.closeAll` (`Ctrl+Shift+Alt+W`) has no entry in `keyboardShortcuts`, so it is never registered and never shown in the keybinds UI. Dead config.
3. `focusNextWindow()` cycles through every `BrowserWindow`, settings window included. The fix is commented out in `window-utils.ts`.
4. No window cap at all. 14 was the wrong number, but unbounded windows are still a resource risk.
5. `webSecurity: !is.development` in `create-window.ts`.
6. Reset from settings does not restart the app. The author's TODO in `main.ts` notes this.
7. `main.ts` carries a long freeform TODO comment block; several entries in it are now done.

---

## 9. How to re-verify

```bash
# v3 feature commits for one area
git -C ~/repo/crossover log --oneline -- src/main/iohook.js

# does v4 have the setting?
grep -rn "<settingName>" ~/repo/xover/src/config/settings.ts

# what the v3 importer drops on the floor
grep -n "skip(" ~/repo/xover/src/main/migrate-v3.ts
```

The `skip()` calls in `migrate-v3.ts` are the most reliable parity signal in the repo: each one is a v3 preference with no v4 home.
