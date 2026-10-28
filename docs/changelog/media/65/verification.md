# LAC-5868 verification

Real app, dev build (`npm run build` + `release/app`) on graphite, Electron
40.8.0, macOS 25.6.0. Never launched on zero.

Screenshots are retina captures halved to 1x and compressed; `<pane>.png` is
the window at the size CrossOver actually opens it (800x600), `<pane>-full.png`
is the whole pane with every "More" opened.

## Panes

| Before (main, 9 panes) | After (this branch, 7 nav items) |
|---|---|
| `before-crosshair.png` / `-full` | `after-crosshair.png` / `-full` |
| `before-bindings.png` / `-full` | `after-in-game.png` / `-full` |
| `before-keyboard.png` / `-full` | `after-shortcuts.png` / `-full` |
| `before-app.png` / `-full` | `after-app.png` / `-full` |
| `before-appearance.png` / `-full` | folded into App (theme, both sizes) and Advanced (colors) |
| `before-notifications.png` / `-full` | folded into Advanced |
| `before-advanced.png` / `-full` | `after-advanced.png` / `-full` |
| `before-license.png` / `-full` | `after-license.png` / `-full` |
| `before-about.png` / `-full` | `after-about.png` / `-full` |

## Store keys

`git diff origin/main -- src/config/settings.ts src/main/store.ts
src/types/keyboard.ts` is empty. No key was added, removed or renamed.

`src/__tests__/settings-controls.test.ts` walks every key in
`DEFAULT_SETTINGS`, `DEFAULT_CROSSHAIR_WINDOW_STATE` and `DEFAULT_KEYBINDS`
and fails if it no longer has a control anywhere in the settings UI, with an
explicit list of the keys that deliberately have none. Verified it bites:
deleting the Tilt angle slider fails `settings.tiltAngle has a control`.

## Minimum window size

Measured in the running app with the minimum temporarily lifted
(`min-size/*.png`, 560/640/720 wide at 560 tall).

- Horizontal: nothing clips or wraps down to 360px. Nav labels never wrap
  (the nav sizes to its longest label, 122px, at every width) and
  `document.body` never overflows. At 560 the switch descriptions wrap to two
  lines and press against the control; 640 and 720 read cleanly. 720 leaves the
  content column at ~598px, comfortable for the 250px reticle combobox and the
  three-up theme row.
- Vertical: the nav is 352px tall. It is fully reachable without scrolling from
  500px of window height; 560 leaves headroom.

So `minWidth: 720, minHeight: 560`. The default (Electron's 800x600, since no
settings window size is persisted on first run) clears it.

## Checks

- `npx tsc --noEmit`: clean.
- `npm run lint`: 0 errors. The 44 warnings are pre-existing and none are in
  the changed files. Two unused `APP_WIDTH`/`APP_HEIGHT` imports in
  `create-window.ts` predated this branch and are removed here, since the file
  is already in the diff.
- `npm test`: 15 suites, 185 tests, all passing (76 of them the new suite).
