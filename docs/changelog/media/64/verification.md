# LAC-5725 / PR #64: dock hidden unconditionally, `showDockIcon` removed

Measured on **graphite**, macOS 26.7.1, Electron 40, real app (not a bare-window
probe), branch `LAC-5725/remove-show-dock-icon` at `7d32661`, stacked on #61.

Reuses #61's harness in `../61/harness/` unchanged: `app-check.sh` builds the
tree, launches the app with a throwaway user-data dir, drives Safari into a
native fullscreen Space over the accessibility API, and reads on-screen window
state from `CGWindowListCopyWindowInfo`. `dock-icon-check.sh` reads the process
activation policy. Only the upgrade case needed a new script, in `harness/`.

## 1. The crosshair still draws over a fullscreen Space

```
dockless:
  desktop Space:    1 crosshair window(s) [(3630, 1001)]
  fullscreen Space: 1 crosshair window(s) [(3630, 1001)]
  VERDICT: the crosshair DRAWS over the fullscreen Space
```

Same window id in both lists, so it is one window that followed the Space, not a
second one created later. Raw: `evidence/app-winlist-dockless.json`,
`evidence/app-winlist-dockless-desktop.json`.

## 2. The dock icon is gone, which is the intended change

Fresh user-data dir, so nothing stored can influence it:

```
--- activation policy of the app process 9105 (0 regular/dock icon, 1 accessory/hidden)
{"pid":9105,"policy":1}
```

Policy 1 is accessory/UIElement: no dock icon, no CMD+Tab entry. On #61 the same
check returns `0`, because `showDockIcon` still defaulted to on there and the
icon was restored after the window was created. That contrast is the whole
behaviour change in this PR. Raw: `evidence/dock-icon-check-dockless.out`.

## 3. An upgraded store cannot put the icon back

The real risk in deleting a setting is the key that is already sitting in
`config.json` on someone's machine: `electron-store` validates `settings`
against a schema that no longer declares it. Seeded `showDockIcon: true` into a
config written by a previous run, then launched:

```
seeded stale showDockIcon: True
--- crosshair on screen, app process 11358
--- activation policy (0 regular/dock icon, 1 accessory/hidden)
{"pid":11358,"policy":1}
--- stale key still in the store after boot?
showDockIcon present: True
```

So the app boots, the crosshair is on screen, the icon stays hidden, and the
stale key is ignored rather than rejected: the schema sets no
`additionalProperties: false`, so it is left in the file harmlessly instead of
tripping `clearInvalidConfig` and wiping the user's settings. Re-run with
`harness/migration-check.sh`. Raw: `evidence/winlist-upgrade.json`.

## 4. Unit tests

`npx jest src/__tests__` — 134 passed, 17 suites. `src/__tests__/dock-always-hidden.test.ts`
adds 3 cases covering the three ways the setting could come back: a stale value
read out of an upgraded store, the unhide path restoring the icon, and the
setting being redeclared in `DEFAULT_SETTINGS`. All 3 fail on this branch's
parent. `src/__tests__/macos-fullscreen.test.ts` from #61 still passes, with its
expected sequence updated to drop the `dock:initialize` that no longer runs after
the constructor.

`tsc --noEmit` clean. `eslint` 0 errors on every changed file (the two
`APP_HEIGHT`/`APP_WIDTH` unused-import warnings in `create-window.ts` predate
this branch and are filed separately).

## 5. What v3 actually does with the dock icon

Read from `lacymorrow/crossover` `main`, since "v3 hid the dock unconditionally
for years" was load-bearing for the decision and turned out to be wrong:

| where | code | effect |
|---|---|---|
| `src/main/windows.js:172` | `dock.setVisible( false )` after `new BrowserWindow` | hides the icon at window creation (and is the v3 ordering bug, LAC-5608) |
| `src/main/crossover.js:425` | `dock.setVisible( !lock )` inside `lockWindow()` | **unlocking shows the icon, locking hides it** |
| `src/main/preferences.js:83` | `locked: false` | v3 starts unlocked, so a fresh install shows a dock icon |

So v3 treats the dock icon as "the crosshair is in positioning mode": present
while you are moving it, gone once it is locked and live. It is not
unconditional, and a v3 user is not someone who went years without the icon.

That makes removing `showDockIcon` strictly less than both v3 and current v4 on
macOS, rather than a return to v3 behaviour. It does not make the removal wrong,
but it does make it a pure preference with no precedent behind it, which is a
different decision from the one the ruling described.
