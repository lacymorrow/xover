# LAC-5839 / PR #59 — hand verification

Every item below was exercised in the real app, built from this branch
(`npm run build`, launched as `release/app`) on the QA Mac (macOS 26.7.1,
two displays, primary 1792x1120). Global shortcuts were fired as real OS key
events through System Events, not simulated in the renderer, because that is
the path the bug was in.

The QA box has no Screen Recording permission, so `screencapture` is not
available there. The shots that are about *where a window is* are composites:
each window captured from itself with `webContents.capturePage()` and placed at
its real screen coordinates on a grid the size of the display, with the window
bounds printed along the top. The dashed lines mark the centre of the display.
The shots that are about what a window *shows* are straight page screenshots.

## 1. Toggle Reticle keybind

Store seeded the way an upgrade from beta.4 leaves it: a `keybinds` object with
the other 14 actions and no `hideReticle`. Bound `Control+Option+Shift+G` in
Settings > Keyboard, switched to Crosshair, switched back.

| | |
| --- | --- |
| before the fix | `1-reticle-bind-before-fix-unbound.png` — "Unbound...", and the store still has no `hideReticle` |
| after | `1-reticle-bind-after-pane-switch.png` — the bind is still there, and the store holds it |

On the fixed build the seeded store is backfilled at launch:
`hideReticle = "Control+Shift+Alt+S"` before anything is bound.

## 2. Reset confirmation comes to the front

Settings open on Advanced, Finder brought to the front, then Reset clicked.

```
frontmost before the dialog: Finder
frontmost with the dialog open: Electron
sheet on window CrossOver at {496, 196}, buttons: Cancel, Reset
```

So the app takes the front and the dialog arrives as a sheet on the settings
window rather than stranded behind Finder. A native dialog cannot be captured
without Screen Recording permission, which is why this one is a log and not a
screenshot; the window-position evidence for item 3 below is the same dialog,
dismissed by clicking its Reset button through the accessibility API.

## 3. Reset re-centers the crosshair

| | |
| --- | --- |
| before | `3-reset-before-crosshair-bottom-left.png` — crosshair at `{120, 820}` |
| after | `3-reset-after-crosshair-centered.png` — `{792, 495}`, the centre of a 1792x1120 display for a 208x130 window |

## 4. Center Crosshair leaves the settings window alone

Settings focused at `{80, 120}`, crosshair at `{1400, 180}`, then a real
`Control+Shift+Alt+C`.

| | |
| --- | --- |
| before | `4-center-shortcut-before-settings-focused.png` |
| after | `4-center-shortcut-after-crosshair-centered.png` — crosshair `{792, 495}`, settings still `{80, 120}` |

## 5. About page

`5-about-page.png`. No "Hotplate" string anywhere on the page, the card points
at `lacymorrow/crossover`, and the two invented stats are gone. Window title
reads `CrossOver`.

## 6. Show App unlocks

Locked with `Control+Shift+Alt+X`, then launched the app a second time.

| | |
| --- | --- |
| locked | `6-locked-settings-hidden.png` — settings window not visible, `isLocked = true` |
| after the second launch | `6-after-second-launch-unlocked.png` — `isLocked = false`, `isHidden = false`, settings in front and focused |

## 7. Auto-Hide takes the reticle with it

Auto-Hide bound to a key so the trigger could be held down, crosshair locked so
the input hook runs, then the key held.

| | |
| --- | --- |
| before the fix | `7-ads-before-fix-reticle-still-on-screen.png` — crosshair image gone, reticle still there. This is beta.5 behaviour, and the answer to the question on the issue: Auto-Hide did not hide the reticle, on either platform, because the hide is pure renderer CSS |
| revealed | `7-ads-revealed.png` |
| hidden | `7-ads-hidden.png` — both gone |

Measured on the fixed build: `--overlay-opacity` 1 -> 0 -> 1 across hold and
release, with the wrapper opacity following it and both the reticle and the
crosshair off screen while held.
