# PR #61 verification — macOS fullscreen overlay + Wayland shortcuts (LAC-5973)

Measured on **graphite**, macOS 26.7.1, Electron 40, branch head `f421482`.

## Why there are no screenshots

The thing to show is a crosshair sitting on **another app's** native fullscreen
Space. Capturing that needs Screen Recording permission, and graphite has none:
`screencapture -x` over SSH answers `could not create image from display`, and
`kCGWindowName` comes back withheld. So the evidence here is the on-screen
window list itself, read through `CGWindowListCopyWindowInfo`, which answers
"is this window on this Space" with no permission at all.

That is a stronger claim than a photo anyway: the crosshair window is the only
CrossOver window above layer 100 (it sits at the screen-saver level), so
presence of that window id in the fullscreen Space's list is the fix working.

Everything below re-runs from `harness/`. `app-check.sh <branch> <label>` builds
the tree, launches the real app, drives Safari into a native fullscreen Space,
and dumps the window list in both Spaces.

## 1. The real app, before and after

```
before (origin/main):
  desktop Space:    1 crosshair window(s) [(3433, 1001)]
  fullscreen Space: 0 crosshair window(s) []
  VERDICT: the crosshair is GONE on the fullscreen Space

after (this branch):
  desktop Space:    1 crosshair window(s) [(3478, 1001)]
  fullscreen Space: 1 crosshair window(s) [(3478, 1001)]
  VERDICT: the crosshair DRAWS over the fullscreen Space
```

Same window id in both lists on the fixed build. Raw lists:
`evidence/app-winlist-{before,after}{,-desktop}.json`.

## 2. Why the fix is ordering, not a setting

`showDockIcon` defaults to `true`, which looked like it made the fix impossible
(see LAC-5725). It does not. Three bare `BrowserWindow`s, each created under a
different activation policy, against the same fullscreen Space:

```
regular-at-create                desktop only: does NOT float
uielement-at-create              FLOATS over the fullscreen Space
uielement-then-restored          FLOATS over the fullscreen Space
hidden-create-restored-same-tick FLOATS over the fullscreen Space
```

Only the policy **at window creation** counts. Restoring the dock icon
afterwards does not take the float away, so the fix hides the dock, creates the
window, and restores the icon in the same tick. Nothing is taken from the user
and no setting changes. Raw ids: `evidence/ids-*.json`.

## 3. The dock icon survives

Re-measured on the branch head. The app must end up a regular app (activation
policy 0) even though the crosshair was created while the process was a
UIElement:

```
--- f421482 fix(shortcuts): explain and fix dead hotkeys on Wayland (LAC-5973)
--- activation policy of the app process 41210 (0 regular/dock icon, 1 accessory/hidden)
{"pid":41210,"policy":0}
```

`evidence/dock-icon-check.out`, window list in `evidence/winlist-dock.json`.

## 4. Wayland: unverified by measurement, and deliberately so

**There is no Linux hardware in the fleet.** The notice (#571) is pure string +
platform check and is covered by unit tests. The X11 relaunch (#577) is argued,
not measured: GH #450's black overlay was an X11 session with *no* compositing
manager, and a Wayland session always runs a compositor that composites
XWayland surfaces, so the ARGB visual is there by construction. That is an
argument. The mitigation is the `relaunchOnX11` setting (Settings → Advanced,
Linux only, defaults on): anyone it breaks turns it off and keeps a working
overlay.

## 5. Automated coverage

`src/__tests__/macos-fullscreen.test.ts` (3 cases, all fail on `main`) and
`src/__tests__/wayland.test.ts` (19 cases). Full suite 131 passed across 16
suites; `tsc` 0 errors; `npm run lint` 0 errors. CI green on all three runners.
