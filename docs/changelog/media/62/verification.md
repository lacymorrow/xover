# LAC-5972 / PR #62 — v4 actions parity, hand verification

Evidence for the four v3 actions fixes ported to v4. The code landed on `main`
as `bac2a14` (see "How this landed" below); this PR carries the media and the
write-up that commit should have shipped with.

All app runs are on the QA Mac (graphite), never on the work machine, per
`CLAUDE.md`. Each run is a production build (`npm run build`, launched as
`release/app`) with a throwaway `--user-data-dir`, so the store starts empty and
the capture is not reading someone else's saved settings.

- **after** = the port applied, now `bac2a14` on `main`. Captured.
- **before** = `2dbee7d`, the commit the port was written on top of. Not
  captured, see "The before shot" at the bottom.

## 1. #573 — the keyboard hide bind was hold-only

v4's Bindings panel has offered **Hold to hide** and **Press to toggle** since v4
shipped, and `registerHideOnKey` never read the setting: it registered
keydown-hides / keyup-shows unconditionally. Choosing "Press to toggle" on a
keyboard bind did nothing at all.

Capture opens the real Settings window through the crosshair's own gear button,
sets Auto-Hide on with `hideOnKeyBind: 'keyboard:Alt'`, and opens the Hide bind
behavior menu.

`after-hide-behavior-options.png` is the open menu, and
`after-hide-behavior-options.json` is the same list read out of the DOM:

```json
["Hold to hide", "Press to toggle", "Press to hide until the next ADS click"]
```

Before, at `2dbee7d`, the same control offered two:

```tsx
items={[
    { label: 'Hold to hide', value: 'hold' },
    { label: 'Press to toggle', value: 'toggle' },
]}
```

and neither did anything on a keyboard bind, because `registerHideOnKey` never
read the setting.

The third option is the new one, ported from v3 #573 / #340: drop the crosshair
for first-person and get it back on the next ADS click, without holding a key.
It is offered only for a keyboard bind, since press mode needs a button to come
back on, and a bind switched to a mouse button while it is selected falls back
to hold.

`after-bindings-pane.png` is the whole pane in that state, for context.

## 2. #542 — Follow Mouse froze while a mouse button was held

Not capturable as a screenshot: the symptom is a crosshair that stops moving
while the cursor keeps going, and the QA box has no Screen Recording permission
(see `media/59/verification.md` for the same constraint). The evidence is the
cause, which is readable off `uiohook-napi`'s own types:

```ts
export declare enum EventType {
    EVENT_KEY_PRESSED = 4,
    ...
    EVENT_MOUSE_MOVED = 9,
    EVENT_MOUSE_WHEEL = 11   // no 10
}
```

Type 10 is `EVENT_MOUSE_DRAGGED`. The library's event switch has no case for it,
so `mousemove` goes silent for as long as any button is down.
`registerFollowMouse` now also listens on the catch-all `input` event and
forwards type 10 to the same handler.

Pinned by `src/__tests__/iohook-actions.test.ts`:
*moves the crosshair on a drag, which never reaches mousemove*.

## 3. #563 and #559 — v4 already acts on every crosshair

v3's bug was that `hideWindow()`, `resizeOnADS()` and `tiltCrosshair()` wrote CSS
variables to `windows.win` and nothing else, so duplicates ignored them. v4
cannot have it: the hook never touches a window, it sets a key on shared action
state, and `setActionStateKey` pushes every key to every window.

No media, because there is no behavior change to show. The claim is a test
rather than a reading: `src/__tests__/action-state-broadcast.test.ts` stands up a
main crosshair, two duplicates and the settings window, and asserts `hidden`,
`adsActive` and `tilt` all reach every one.

#559's second half — ADS resize must not restore an opacity that hide set — is
structural too. Resize drives `adsActive` -> `--crosshair-scale`, hide drives
`hidden` -> `--overlay-opacity`: separate keys, separate properties. Pinned in
`crosshair-vars.test.ts` as *stays hidden while ADS resize is active too*.

#559's third item was the false "CrossOver Actions do not work on Apple Silicon"
note in v3's Preferences. `grep -ri "apple silicon" src docs` on v4 returns
nothing, so there is nothing to port.

## Tests

On `main` at `bac2a14`:

```
Test Suites: 14 passed, 14 total
Tests:       109 passed, 109 total
```

`npx tsc --noEmit` clean.

The new tests are regression tests, not tautologies. With `src/main/iohook.ts`
reverted to its pre-port state and the rest in place, 5 of the 13 in
`iohook-actions.test.ts` fail, and they are exactly the ones pinning the bugs:

```
x moves the crosshair on a drag, which never reaches mousemove
x toggles on press and stays hidden through the release
x re-arms on release so the next press still fires
x hides on the key and shows again on the ADS button
x watches the bound ADS button, not just the right one
```

## No Pro gate

Everything free in v3 stays free in v4. The new mode sits under the existing
Auto-Hide controls, outside any `isPremium()` check.

## How this landed

The port was committed as `f46d33d` on `LAC-5972/actions-parity` and pushed, but
a follow-on branch for an unrelated fix (`fix/show-app-no-crosshair`) was cut
from it instead of from `main`. Squash-merging that branch as #60 carried all
six of the port's files into `main` under #60's title, and no PR of its own was
ever opened for the port. The code on `main` is the reviewed-by-tests version
and is green; what was lost was the write-up and this media, which is what this
PR restores. Reverting and re-landing was considered and not done: the net diff
would be zero and `main` would spend the interval without the fixes.

## The before shot

The before half of item 1 is source and failing tests, not a screenshot. A
production build of `2dbee7d` brings its crosshair window up blank under the
Playwright harness on graphite: `window.electron` is undefined on the page, so
`useGlobalContext` throws and nothing renders, including the gear button the
capture clicks.

That is not specific to `2dbee7d`. A clean `npm ci && npm run build` of
`bac2a14` (current `main`) behaves the same way, and 5 of the repo's own 26 e2e
specs now fail on this box, among them *App launches successfully* and
*Crosshair wrapper is present*. The same harness drove the same `release/app`
build path successfully about an hour earlier in this ticket's work, which is
what the after shots are, so something on the QA box changed rather than
something in the tree. Filed for triage rather than guessed at here, because if
it is the tree and not the box it is a beta.6 blocker, not a media problem.
