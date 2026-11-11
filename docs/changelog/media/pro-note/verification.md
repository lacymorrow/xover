# LAC-7622 / PR #81 — Lacy's Pro note on the License pane

Evidence that the approved note renders as approved. Captured 2026-11-11 on the
QA Mac (graphite), never the work machine, per `CLAUDE.md`.

- `pro-note-license-pane.png` — the whole License pane, free state
- `pro-note-closeup.png` — the note by itself
- `capture.mjs` — the script that made them

## How these were captured, and why not through Electron

The convention in `media/62/verification.md` is a production build driven by
Playwright. The production build part held: `npm run build` on graphite, green.
Driving it did not.

**The shared harness cannot launch the app right now.** `test/helpers.ts` does
`electron.launch({ args: ['.'] })`, which loads `src/main/main.ts` through an
ESM loader that rejects extensionless relative imports:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '/Users/lacy/repo/xover/src/main/portable'
  imported from /Users/lacy/repo/xover/src/main/main.ts
```

`src/main/portable.ts` exists. The import on `main.ts:46` is
`import { isPortable } from './portable'`, with no extension, which Node's ESM
resolver will not resolve. Every spec using the harness dies in `beforeAll`,
including `launch.spec.ts` itself, which is 8 tests that never run. This looks
like the root cause behind LAC-5198 / LAC-5722 and is filed separately.

Launching `release/app` directly gets past that, because the packaged entry is
the webpack bundle. The app starts and the crosshair window appears, but
Settings would not open from the test: the packaged renderer carries no
`data-testid` attributes, so the gear button is not addressable, and
`ipcMain.emit('open-settings')` from `app.evaluate` never produced a second
window within 20 seconds.

So the capture renders the **real production renderer bundle** in Chromium and
stubs the preload bridge:

```
file://.../release/app/dist/renderer/index.html#/license
```

`index.html` is the settings window's entry and the router is `createHashRouter`,
so `#/license` lands on the License pane. `window.electron` is stubbed with a
Proxy, and `getLicenseStatus` returns the free state, which is the state the
note shows in. Everything on screen is the shipped bundle's own markup and CSS.

**What this does and does not prove.** The pixels are the real component,
styles and layout, which is what the note needed checking for. It does not
exercise Electron window creation or live IPC; `pro-note.test.ts` covers the
wiring, and the Settings window is unchanged by this PR anyway.

Re-run it with:

```sh
cd ~/repo/xover && npm run build
node capture.mjs ~/repo/xover <output-dir>
```
