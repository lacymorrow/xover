# Electrobun Feasibility Research for XOver

**Date:** 2026-03-07  
**Researcher:** io (automated deep research)  
**Electrobun Version Assessed:** v1.15.1 (released 2026-03-06)  
**Repo:** https://github.com/blackboardsh/electrobun (8,747 stars, 194 forks)

---

## 1. Executive Summary

**Verdict: NOT YET — Wait or Skip**

Electrobun cannot replace Electron for XOver today. Two critical overlay features — **click-through/ignore mouse events** and **global keyboard/mouse shortcuts** — do not exist in Electrobun. Both are open feature requests with zero implementation. The transparent window support is recent (shipped in beta ~Feb 2026) and still has bugs (e.g., incorrect `devicePixelRatio`). There is no `globalShortcut` API equivalent, and Electrobun has no native global input hook system.

Electrobun is a promising framework for *standard* desktop apps, but XOver's overlay use case hits the exact gaps in its API surface. Migrating now would require forking Electrobun's native layer and implementing platform-specific window flags yourself — defeating the purpose of using a framework.

---

## 2. API Capability Matrix

| XOver Requirement | Electron API | Electrobun API | Status |
|---|---|---|---|
| **Always-on-top** | `alwaysOnTop: true`, `setAlwaysOnTop()` | `setAlwaysOnTop(true)` / `isAlwaysOnTop()` | ✅ **Supported** (added post-issue #94, now in docs) |
| **Transparent window** | `transparent: true` | `transparent: true` constructor option | ⚠️ **Partial** — shipped in beta Feb 2026. Bug #209: `devicePixelRatio` resets to 1. Backdrop-filter has rendering issues. |
| **Click-through / ignore mouse** | `setIgnoreMouseEvents(true, { forward: true })` | **Does not exist** | ❌ **Missing** — Issue #113 (feature request, open since Dec 2024, no implementation). Issue #263 (Mar 2026, same ask, no response yet). |
| **Frameless window** | `frame: false` | `titleBarStyle: "hidden"` + `styleMask: { Borderless: true, Titled: false }` | ✅ **Supported** |
| **Multi-monitor support** | `screen.getAllDisplays()`, `setPosition()` | `setPosition(x, y)`, `setFrame()`, `getFrame()` | ⚠️ **Partial** — positioning works, but no `screen` API to enumerate displays. Issue #91 mentions OOPIF positioning issues on Windows with multiple monitors. |
| **System tray** | `Tray` class | `Tray` class with `setMenu()`, events | ✅ **Supported** |
| **Global keyboard shortcuts** | `globalShortcut.register()` | **Does not exist** | ❌ **Missing** — Only app-menu `accelerator` (requires app focus). No `globalShortcut` module. No code in repo. |
| **Global mouse hooks** | `iohook` / `uiohook-napi` (addon) | **Does not exist** | ❌ **Missing** — Would need external native addon. Bun's N-API compat is partial; `uiohook-napi` untested on Bun. |
| **Auto-update** | `electron-updater` | Built-in bsdiff updater | ✅ **Supported** — actually superior (delta patches, ~14KB updates) |
| **Preload scripts** | `preload` option | `preload` option (inline JS or URL) | ✅ **Supported** |
| **IPC / RPC** | `ipcMain` / `ipcRenderer` | Typed RPC system | ✅ **Supported** — arguably better (typed, async) |
| **DevTools** | `webContents.openDevTools()` | Available but has bugs (#190, #197) | ⚠️ **Partial** |

### Summary: 4 supported, 3 partial, 3 missing (2 are showstoppers)

---

## 3. Showstoppers

### 🛑 Showstopper #1: No Click-Through / Ignore Mouse Events

This is the single biggest blocker. XOver's core function is a transparent overlay where clicks pass through to the game. Without `setIgnoreMouseEvents(true, { forward: true })` or equivalent, XOver cannot function.

- **Issue #113** (Dec 2024): Detailed feature request for `setIgnorePointerEvents`. Open, no comments from maintainer, no implementation.
- **Issue #263** (Mar 7, 2026 — literally yesterday): Another user asking for fullscreen transparent + click-through. Zero comments.
- **Code search**: No `ignoreMouseEvents`, `clickThrough`, or related strings in the Electrobun codebase.

This requires OS-level implementation:
- **macOS**: `NSWindow.ignoresMouseEvents = true` + `NSTrackingArea` for forward behavior
- **Windows**: `WS_EX_TRANSPARENT` + `WS_EX_LAYERED` extended window styles
- **Linux**: `input_shape` via X11 or compositor-specific Wayland protocols

None of this exists in Electrobun today.

### 🛑 Showstopper #2: No Global Shortcuts

XOver uses global keyboard shortcuts to toggle the overlay, cycle crosshairs, etc. without the app being focused. Electrobun only has menu `accelerator` which works when the app is focused.

- No `globalShortcut` module
- No code for platform-level hotkey registration
- Not even filed as an issue (surprisingly)

### ⚠️ Near-Showstopper: No Global Mouse Hooks

XOver uses iohook to detect mouse button presses for ADS hide/show. This would need to come from an external native addon. The question is whether `uiohook-napi` works under Bun.

---

## 4. System Webview Analysis

### macOS (WKWebView)

- **Transparent background**: Supported via `_setDrawsBackground:false` (private API, deprecated but functional) or `drawsBackground = false`. Electrobun now implements this.
- **Click-through**: WKWebView itself doesn't handle this — it's an NSWindow-level concern (`ignoresMouseEvents`). WKWebView transparent + NSWindow click-through = viable on macOS. But **Electrobun hasn't wired this up**.
- **Always-on-top over fullscreen games**: Requires `NSWindow.level = .screenSaver` or similar high level. Electrobun's `setAlwaysOnTop` likely uses `NSFloatingWindowLevel` which may not be sufficient for exclusive fullscreen games (borderless fullscreen should work).

### Windows (WebView2)

- **Transparent background**: WebView2 supports transparent via `COREWEBVIEW2_COLOR` with alpha=0. More complex than WKWebView but doable.
- **Click-through**: Requires `WS_EX_TRANSPARENT | WS_EX_LAYERED` on the HWND. WebView2 layered window support has been improved but is still tricky.
- **Always-on-top over games**: `HWND_TOPMOST` works for borderless fullscreen. Exclusive fullscreen (DirectX) will cover everything — this is an inherent OS limitation, same as Electron.

### Linux (WebKitGTK)

- **Transparent background**: Possible with RGBA visual + compositing. Requires a compositor (Wayland or X11 with compositing manager).
- **Click-through**: X11 `XShapeCombineRectangles` or `input_shape`. Wayland has no standard protocol for this — **click-through overlays on Wayland are essentially impossible** without compositor-specific extensions.
- **Reality**: Linux gaming overlays have always been the hardest. XOver already struggles here on Electron.

### Comparison: How Tauri Handles This

Tauri has `transparent: true` and `decorations: false`, but **also lacks proper click-through**:
- Tauri issue #2090 (June 2021): Request for forward option on `setIgnoreCursorEvents`. Still open after 4+ years.
- Tauri issue #6164: Same ask. Still open.
- Tauri issue #13070 (Mar 2025): Transparent click-through. Open.

**This is a hard problem across all non-Electron frameworks.** Electron solved it years ago because Chromium gives them full control over the window and input pipeline. System webview frameworks (Tauri, Electrobun) struggle because they're working with higher-level OS primitives.

---

## 5. CEF Analysis

Electrobun optionally bundles CEF (Chromium Embedded Framework) instead of the system webview.

### Potential Benefits for XOver
- CEF is essentially Chromium, which has proven transparent/click-through capability (Electron uses it)
- Off-screen rendering (OSR) mode in CEF supports transparent backgrounds natively
- More consistent rendering across platforms

### Current Reality
- CEF on Electrobun has bugs: Issue #237 (script tags don't execute on `views://` protocol on macOS)
- CEF mode does NOT expose additional window-level APIs — the `BrowserWindow` API is the same
- Even with CEF rendering, click-through is still an **OS window** concern, not a renderer concern
- Bundle size: CEF adds ~100-150MB to the app (vs ~12MB with system webview)

### Verdict
CEF mode wouldn't help with click-through. The transparent rendering might be more reliable, but the window-level input passthrough is the blocker, and that's independent of the renderer.

---

## 6. Global Input Hooks

### Current XOver Solution
XOver uses `iohook` (unmaintained) for global mouse/keyboard hooks. The modern replacement is `uiohook-napi`.

### Bun Compatibility

**`uiohook-napi` + Bun: Unknown/Risky**

- `uiohook-napi` uses Node-API (N-API) native addons
- Bun has partial N-API support (has been improving since 2023)
- No one has publicly tested `uiohook-napi` with Bun
- The addon uses `libuiohook` (C library) with N-API bindings — simpler N-API addons tend to work in Bun, but threading/callback patterns can break

### Alternative Approaches

1. **Bun FFI**: Bun has a built-in FFI system that could call native APIs directly
   - macOS: `CGEventTap` via CoreGraphics (requires accessibility permissions)
   - Windows: `SetWindowsHookEx` via user32.dll
   - This would require writing platform-specific Zig or C code
   
2. **Electrobun's Zig layer**: Since Electrobun's native bindings are in Zig, you could theoretically add global input hooks to Electrobun's native layer. But this means forking Electrobun.

3. **Separate helper process**: Run a Node.js subprocess with `uiohook-napi` and communicate via IPC. Ugly but pragmatic.

### Verdict
Global input hooks are solvable but would require significant custom work, regardless of framework choice. This isn't an Electrobun-specific problem — it's a gap that would need filling on any non-Electron platform.

---

## 7. Migration Path

### If Electrobun Added Missing Features Tomorrow

| Migration Task | Effort | Notes |
|---|---|---|
| BrowserWindow creation | Low | Config maps fairly well, styleMask instead of Electron options |
| IPC → RPC | Medium | Rewrite from ipcMain/ipcRenderer to Electrobun typed RPC. Actually an improvement. |
| Tray | Low | Similar API concept |
| Menu | Low | Similar API |
| Preload scripts | Low | Direct equivalent exists |
| Auto-update | Medium | Replace electron-updater with Electrobun's bsdiff updater. Different paradigm but better. |
| Click-through overlay | **Blocked** | No API exists |
| Global shortcuts | **Blocked** | No API exists |
| Global mouse hooks | High | Would need custom native solution (FFI, addon, or helper process) |
| Build/packaging | Medium | Switch from electron-builder to Electrobun's build system |
| **Total estimated effort** | **3-5 weeks** | *Assuming* all APIs exist. Currently blocked. |

### What Maps 1:1
- Window creation, positioning, sizing
- Tray icon and menu
- Transparent windows (mostly)
- App menu with accelerators
- Preload scripts

### What Needs Rewriting
- All IPC → typed RPC (improvement)
- Build pipeline
- Auto-updater integration
- Any Electron-specific APIs (screen, shell, dialog — some have Electrobun equivalents)

### What Has No Equivalent
- `setIgnoreMouseEvents()` — **dealbreaker**
- `globalShortcut` — **dealbreaker**
- `screen.getAllDisplays()` — inconvenient but workable
- Native addon loading (iohook) — uncertain Bun compatibility

---

## 8. Risks

### Maturity
- **Version**: v1.15.1 (just hit v1 recently — announced on HN ~2 weeks ago with 171 points)
- **Age**: Repo created Feb 2024, so ~2 years old
- **Stars**: 8,747 — decent traction but small compared to Electron (115k) or Tauri (88k)
- **Open issues**: 105 — many are feature requests, several are bugs

### Bus Factor
- **Primary maintainer**: Yoav (YoavCodes) — appears to be the sole core contributor
- He's responsive on issues and actively developing (released v1.15.1 on Mar 6)
- But this is a **bus factor of 1** for a framework with native code across 3 platforms
- His company (Blackboard) uses Electrobun commercially (Co(lab) product), which helps sustainability

### Missing Features Beyond XOver's Needs
- No `dialog.showOpenDialog()` equivalent (Issue #233 — saveFileDialog requested)
- No `shell.openExternal()` equivalent documented
- No `screen` module for display enumeration
- No `powerMonitor` or `powerSaveBlocker`
- Application menu not supported on Linux
- Window drag has jitter issues (#145)

### Platform Support
- **macOS 14+**: Official, most mature
- **Windows 11+**: Official but has more bugs (installer stalls #249, maximize goes fullscreen #226)
- **Linux (Ubuntu 22.04+)**: Official but least stable (GTK resize bug #188, session/cookies broken #186, build issues #236)

### Community
- Discord exists but size unknown
- HN reception positive but cautious
- No known gaming/overlay projects built with Electrobun
- One commercial app publicly reported (from HN comment — a macOS utility)

---

## 9. Recommendation

### For XOver specifically: **Skip Electrobun for now.**

The two features XOver absolutely requires — click-through overlay and global shortcuts — don't exist and aren't being actively worked on. Even Tauri, a much more mature project with a larger team, hasn't solved click-through in 4+ years of open issues.

### What XOver Should Do Instead

1. **Stay on Electron** — it's the only framework that fully supports overlay apps. The `setIgnoreMouseEvents(true, { forward: true })` API is unique to Electron among web-based desktop frameworks.

2. **Upgrade Electron** — v12.2.3 is ancient (Apr 2021). Upgrade to latest Electron (v33+) for security, performance, and updated Chromium.

3. **Replace iohook** — Switch to `uiohook-napi` which is maintained and works with modern Electron. This solves XOver's most pressing dependency problem.

4. **Consider Tauri only if** — Tauri eventually ships click-through support (issues #2090, #6164, #13070). Tauri's Rust backend + Webview2/WKWebView would give smaller bundles. But this has been requested since 2021 with no resolution.

### When to Revisit Electrobun

Re-evaluate if/when:
- Issue #113 (ignore pointer events) is closed with an implementation
- A global shortcuts API is added
- Electrobun reaches v2+ with broader API surface
- Someone ships a gaming overlay with Electrobun (proving the pattern works)

**Estimated timeline for these features:** 6-18 months, if prioritized. Currently no indication they're on the roadmap.

---

## Appendix: Key GitHub Issues

| # | Title | State | Relevance |
|---|---|---|---|
| [#113](https://github.com/blackboardsh/electrobun/issues/113) | Feature request: Ignore pointer events | OPEN | **Critical** — click-through |
| [#263](https://github.com/blackboardsh/electrobun/issues/263) | Fullscreen Transparent Background with Mouse ClickThrough | OPEN | **Critical** — exact XOver use case |
| [#94](https://github.com/blackboardsh/electrobun/issues/94) | Missing alwaysOnTop/setWindowLevel functionality | OPEN | Implemented in API but issue not closed |
| [#52](https://github.com/blackboardsh/electrobun/issues/52) | Transparent app | CLOSED | Shipped in beta, now in stable |
| [#209](https://github.com/blackboardsh/electrobun/issues/209) | incorrect devicePixelRatio when using transparent window | OPEN | Bug in transparent windows |
| [#123](https://github.com/blackboardsh/electrobun/issues/123) | Feature Request: Native Window Vibrancy & Acrylic Support | OPEN | Related to transparent UX |
| [#91](https://github.com/blackboardsh/electrobun/issues/91) | OOPIF Positioning issue on Windows with multiple monitors | OPEN | Multi-monitor concern |
| [#59](https://github.com/blackboardsh/electrobun/issues/59) | Hidden/Headless BrowserView Mode | OPEN | Related to tray hide behavior |
