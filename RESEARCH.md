# CrossOver / XOver — GitHub Research Report

> **Generated:** 2026-03-07  
> **Data sources:** GitHub Issues, PRs, Releases, API stats for `lacymorrow/crossover` and `lacymorrow/xover`  
> **Companion document:** [ANALYSIS.md](./ANALYSIS.md) — code-level comparative analysis

---

## Table of Contents

1. [Issue Analysis](#1-issue-analysis)
2. [User Request Patterns](#2-user-request-patterns)
3. [Bug Patterns](#3-bug-patterns)
4. [PR History](#4-pr-history)
5. [Gaps](#5-gaps)
6. [Community Insights](#6-community-insights)
7. [Updated Recommendations](#7-updated-recommendations)

---

## 1. Issue Analysis

### Overview

| Metric | crossover | xover |
|---|---|---|
| **Total issues (API)** | 200+ (478 total, API returns 200) | 3 |
| **Open issues** | 90 | 9 (including PRs) |
| **Stars** | 1,130 | 0 |
| **Forks** | 118 | 0 |
| **Last updated** | 2026-03-03 | 2025-06-05 |
| **Releases** | 20+ (v1.x through v3.4.3 draft) | 0 |

### Crossover Issues by Category

From analyzing all 100 most recent issues (out of 478+ total):

#### Feature Requests (labeled `enhancement` or `[REQUEST]`)
~29 issues labeled enhancement across 200 most recent. Key requests:

| # | Title | Status | Significance |
|---|---|---|---|
| #475 | Center crosshair on game window | Open | **High** — 4K/multi-window users need this |
| #418 | Dynamic crosshair (color changes based on background) | Closed | Frequently requested, novel |
| #416 | Vulkan support (fullscreen overlay) | Open | Would enable true fullscreen |
| #400 | Allow physically huge image overlays (full-screen rangefinders) | Closed | Niche but creative use case |
| #396 | Don't lock when holding mouse button (follow mouse while shooting) | Open | FPS gameplay UX |
| #391 | Reset all settings too easy to accidentally click (tray menu) | Open | UX/safety concern |
| #382 | Show crosshair on ADS (inverse of hide) | Closed | Popular inverse-ADS request |
| #373 | Alt+Enter fullscreen support | Open | Performance-focused users |
| #367 | Self-contained/portable install | Open | Distribution concern |
| #362 | Add specific crosshair (Khanada from Fortnite) | Open | Community crosshair requests |
| #351 | Fullscreen mode for Fortnite | Closed | Recurring fullscreen request |
| #308 | Show crosshair on ADS (instead of hide) | Open | **10 comments** — inverse ADS |
| #127 | Detect focused window to show/hide + per-game settings | Open | **10 comments** — very popular |
| #108 | Crosshair lean/tilt on keypress | Closed (implemented) | **18 comments** — was top request |
| #64 | CrossOver doesn't work in fullscreen mode | Open | **19 comments** — fundamental limitation |
| #61 | Toggle between two crosshairs | Open | Per-game/per-weapon |
| #433 | Circle reticle with adjustable diameter/thickness | Closed (implemented) | Geometric reticle shapes |
| #458 | Shortcut for show/hide reticle | Closed (implemented) | Quick implemented fix |
| #449 | Compatibility with Lossless Scaling | Open | Window ordering conflict |

#### Bugs (labeled `bug` or error reports)

**Most common bug categories:**

1. **`setBadge` TypeError** (~20+ reports): `Cannot read property 'setBadge' of undefined` in `dock.js` during auto-update. Affects CrossOver 3.0.0 on Windows. This is the single most reported error — users on older versions get this when the auto-updater tries to download v3.4.1 and the dock badge API fails on Windows.

2. **Auto-update 404 errors** (~6 reports): `Cannot download .../v3.4.1/CrossOver-3.4.1.exe, status 404`. Release artifacts missing from GitHub. Issues #466, #472, #477, #478.

3. **EPERM preferences.json** (~5 reports): `Error: EPERM: operation not permitted, rename 'preferences.json'` on Windows. File locking issue during settings save. Issues #354, #398, #403, #408, #452.

4. **macOS crashes** (#474, #432): Random crashes on macOS, including Apple Silicon M2/M3 (SIGBUS/EXC_BAD_ACCESS in CrBrowserMain). Related to old Electron 11.5.0.

5. **macOS "damaged" app** (#422): `"CrossOver" is damaged and can't be opened` on M3 Mac — code signing/notarization issue.

6. **Linux transparency/black background** (#24, #302, #347, #355, #361, #468): Persistent cross-distro issue. Black background instead of transparent overlay. Affects KDE/Wayland, Cinnamon, Arch, Nobara, i3. **29 comments** on #68 (Transparency Issues). The #1 Linux complaint.

7. **Linux keyboard shortcuts broken** (#384, #420, #456): Shortcuts don't work on various Linux distros, particularly KDE Plasma/Wayland.

8. **Game-specific incompatibilities** (#401 Hunt: Showdown, #455 Arena Breakout Infinite, #410 ABI): Overlay hidden by specific games or IOHook actions not registering while game is focused.

9. **Memory leak** (#353): Extremely high memory usage that keeps growing, eventually crashing games. Windows 11.

10. **GPU crash on Linux** (#450): `--reset` doesn't work; segfault on `GPU process isn't usable`. Fedora/KDE/Wayland.

#### Discussion / Support Questions

| # | Title | Comments | Theme |
|---|---|---|---|
| #47 | List of Games (that work/don't work) | **45** | Community-maintained compatibility list |
| #136 | TESTERS NEEDED | 13 | Beta testing coordination |
| #245 | [POLL] Rename the project? | 13 | Trademark concern (CodeWeavers' CrossOver) |
| #399 | How does window stay on top of games? | Open | Technical curiosity |
| #393 | "Lock the crosshair to the mouse cursor" confusion | Open | UX terminology confusion |
| #419 | CS2 VAC challenge timeout | Open | Anti-cheat detection |
| #359 | Can't record gameplay with GeForce while using crossover | Open | Screen recording conflict |
| #356 | Not work on Counter-Strike Nexon | Open | Game compatibility |
| #355 | Does the app work in Archlinux? | Open | Linux distro support |
| #79 | Bannable? (no) | Open | Anti-cheat safety question |

### XOver Issues

Only **1 real issue** exists in lacymorrow/xover:

| # | Title | Status | Description |
|---|---|---|---|
| #3 | Resetting bg color should reset foreground/accent color | Open | UI state bug — buttons become invisible with wrong color combo |

The xover repo is essentially dormant from a community perspective — 0 stars, 0 forks, no releases, last updated June 2025.

---

## 2. User Request Patterns

### Most Requested Features (by frequency & engagement)

**Tier 1 — Repeatedly requested, high engagement:**

1. **Fullscreen/exclusive mode support** (39 related issues)
   - Issues: #1, #64 (19 comments), #351, #373, #416
   - Users consistently want overlays in true fullscreen games
   - This is a fundamental Electron limitation — the overlay window can't draw over exclusive fullscreen
   - Vulkan support (#416) proposed as a potential solution
   - **Status in XOver:** Not addressed

2. **Game-aware behavior** (per-game settings, auto-show/hide)
   - Issues: #127 (10 comments), #61
   - Users want: auto-hide on Alt+Tab, per-game crosshair profiles, detect focused window
   - **Status in XOver:** Not addressed

3. **ADS (Aim Down Sight) actions** — hide, resize, show
   - Hide on ADS: Implemented in Crossover, **missing in XOver**
   - Show on ADS (inverse): #308 (10 comments), #382 — not in either version
   - Resize on ADS: Implemented in Crossover, **missing in XOver**
   - **Status in XOver:** Missing entirely

4. **Linux transparency** (39 Linux issues total, 8 Wayland-specific)
   - The perennial Linux problem. Black background, no transparency
   - Compositor-dependent, DE-dependent, Wayland increasingly broken
   - **Status in XOver:** Unknown/untested

5. **Anti-cheat compatibility** (14 related issues)
   - CS2 VAC (#419), concerns about bans (#79), game-specific blocks (#455, #410)
   - Users need reassurance + actual compatibility testing
   - **Status in XOver:** Not addressed

**Tier 2 — Multiple requests, moderate engagement:**

6. **More crosshair shapes/assets** (#362, #433, #191, #400)
   - Specific crosshair requests (Fortnite styles, circle reticle, huge overlays)
   - PR #444 added Kenney.nl sprite pack (140+ SVGs)
   - **Status in XOver:** Has 35+ reticle styles, good coverage

7. **Better custom image support** (#400, custom drag-drop)
   - Large images, rangefinder overlays, full-screen HUDs
   - **Status in XOver:** Partial — no drag-drop, no large image support

8. **Dynamic/adaptive crosshair** (#418)
   - Auto-change color based on what's behind it
   - Complex but creative request
   - **Status in XOver:** Not addressed

9. **Toggle between multiple crosshairs** (#61, per-game profiles)
   - Quick-switch between saved crosshair configs
   - **Status in XOver:** Per-window state exists, but no "profiles" system

10. **Self-contained/portable install** (#367, #379)
    - Portable EXE still writes to AppData
    - **Status in XOver:** Not addressed

**Tier 3 — Single requests, interesting ideas:**

11. **Center on game window** (#475) — crosshair follows windowed game position
12. **Lossless Scaling compatibility** (#449) — window ordering conflict
13. **Don't lock while shooting** (#396) — follow mouse even during mouse button hold
14. **Rename the project** (#245) — trademark concern with CodeWeavers' CrossOver

---

## 3. Bug Patterns

### By Platform

| Platform | Issue Count | Key Problems |
|---|---|---|
| **Windows** | ~104 issues | `setBadge` crash, EPERM file locking, auto-update 404s, memory leak |
| **Linux** | ~39 issues | Transparency/black background (dominant), shortcuts broken on Wayland, GPU crashes |
| **macOS** | ~28 issues | Random crashes (Intel + Apple Silicon), "damaged" app dialog, quit-as-crash |

### Recurring Bug Clusters

#### 1. Auto-Update Pipeline (CRITICAL — ~25+ reports)
The auto-update system is the single largest source of user-facing errors:
- **`setBadge` TypeError**: Windows users on v3.0.0 get this error repeatedly because `app.dock` is undefined on Windows. ~15+ separate issue reports.
- **404 download errors**: Release artifacts for v3.4.1 are missing from GitHub, causing download failures for anyone on older versions.
- **NSIS `illegal chars` error** (#469): Special characters in Windows username paths break the updater.
- **Impact**: Users on v3.0.0/v3.0.1 are permanently stuck — can't auto-update, and the error dialog pops up repeatedly.

#### 2. Linux Compositor Issues (CHRONIC — ~15+ reports)
- Transparency requires a compositor (not all Linux DEs have one)
- KDE Plasma + Wayland: shortcuts broken, transparency broken
- Snap/AppImage packaging issues
- i3, Cinnamon, GNOME all have varying degrees of support
- Some users need `--no-sandbox` flag

#### 3. macOS Stability (GROWING — ~5 reports)
- EXC_BAD_ACCESS crashes on Apple Silicon (Electron 11.5.0 is pre-M1)
- "Damaged" app message — code signing issue
- Quit registers as crash (crash report dialog on normal exit)
- Accessibility permissions not properly handled

#### 4. Game Compatibility (PERSISTENT — varies)
- Overlay hidden by specific games' rendering engines
- IOHook actions not firing when game has focus
- Anti-cheat false positives (CS2 VAC)
- Screen recording software conflicts (GeForce Experience)

#### 5. Preferences File Corruption (Windows — ~5 reports)
- `EPERM: operation not permitted` when renaming `preferences.json`
- Likely caused by antivirus or concurrent file access
- Can leave settings in corrupted state

---

## 4. PR History

### Crossover — Significant Merged PRs

#### Feature PRs (chronological)

| PR | Date | Title | Significance |
|---|---|---|---|
| #18 | 2020-05 | Adding IrisFlame crosshair assets | Crosshair chooser window created |
| #25 | 2020-06 | Drag and drop custom images | Drag-drop support added |
| #38 | 2020-12 | Center crosshair keybind + 32-bit build | Ctrl+Alt+Shift+C shortcut |
| #49 | 2021-01 | CrossOver 1.0 STABLE | Linux transparency fix, Snap/RPM packages |
| #55 | 2021-02 | Allow two instances of the app | Second instance → shadow window |
| #63 | 2021-03 | Correctly center crosshair | Fix multi-display centering, drag-drop fix |
| #90 | 2021-07 | CrossOver 2.0.21 | Major release fixing #20, #70, #84, #85, #86, #88 |
| #91 | 2021-07 | Add `followMouse` feature | Follow mouse cursor mode (#87) |
| #96 | 2021-08 | Dev | General development updates |
| #116 | 2021-11 | Enable tilt on keypress; hide on keypress | Tilt feature (#108) + hide on key |
| #123 | 2021-12 | Enable toggle to tilt | Tilt toggle mode |
| #141 | 2022-03 | Prefs for noti/sound; progress bar; update badge | Notification/sound toggles, update UX |
| #143 | 2022-03 | Add CLI debug/reset/version | Command-line flags |
| #150 | 2022-04 | Refactor | Major code reorganization |
| #185 | 2022-05 | **Added ADS** | ADS hide/resize on right-click — **5 comments**, major feature |
| #217 | 2022-10 | Fix off-screen window prevention for secondary screen | Multi-monitor fix (#212) |
| #252 | 2023-06 | Linux: Mention compositors in README | Documentation for Linux transparency |
| #256 | 2023-06 | Use CSS instead of iohook where possible | Reduce iohook dependency |
| #258 | 2023-06 | Fix not quitting properly in Linux (#226) | Linux quit bug fix |
| #259 | 2023-06 | Sync light/dark modes | Theme synchronization |
| #261 | 2023-08 | **Prepare for v4.0.0** | XOver genesis! Branch for the rebuild |
| #264 | 2023-06 | Delete global menu accelerators | Fix double-registration of shortcuts |
| #265 | 2023-06 | Allow changing/deleting reset bind (#195) | Fix accidental reset |
| #266 | 2023-06 | Fix toggle to show settings after hiding (#133, #200) | Settings window visibility fix |
| #267 | 2023-06 | Add next-window focus | Cycle through crosshair windows |
| #272 | 2023-06 | Hidden by fullscreen apps on Linux (doc) | Workaround documentation for #249 |
| #429 | 2025-05 | Add GitHub Action to auto-merge Dependabot PRs | CI/CD improvement |
| #442 | 2025-08 | Scan for bugs and errors | ESLint fixes in accessibility.js |
| #444 | 2025-08 | **Add Kenney.nl as SVG files** | 140+ new crosshair SVGs from Kenney.nl sprite pack |
| #448 | 2025-08 | Release | v3.4.0 release |
| #463 | 2025-12 | Fix #458 (show/hide reticle shortcut) | Quick community request fix |
| #464 | 2025-12 | Auto commit (v3.4.1 release) | Latest stable release |

#### Dependency/Security PRs (notable)
- #290: Bumped Electron 11.5.0 → 22.3.25 (security fixes, **but this was for crossover not xover**)
- #457, #462, #443: js-yaml, min-document, form-data security bumps (Dec 2025)

### XOver — Merged PRs

Only **5 merged PRs**, all generic:

| PR | Date | Title |
|---|---|---|
| #1 | 2024-02-10 | Dev |
| #2 | 2024-02-10 | Dev |
| #4 | 2024-02-10 | Dev |
| #6 | 2024-03-14 | main→dev |
| #7 | 2024-09-17 | Dev |

All PRs are author-only development pushes with no descriptions. No community contributions. Last PR was September 2024.

### Key Observations from PR History

1. **ADS (PR #185)** was one of the most important feature additions — users had been requesting it, and it got meaningful engagement.
2. **Kenney.nl SVGs (PR #444)** was a community contribution that added 140+ crosshair assets — this is already available for XOver to leverage.
3. **PR #261 "Prepare for v4.0.0"** was the bridge to XOver — this PR exists in the crossover repo, suggesting the rebuild was originally planned as a v4 of crossover.
4. **The v3.4.0-v3.4.1 releases (2025)** were the last active development on crossover, fixing community requests and merging dependency bumps.
5. **Crossover got an Electron bump to 22.x** in the dependency PRs, but XOver is still on Electron 12.x — crossover is actually on a newer Electron than XOver.

---

## 5. Gaps — Crossover Issues NOT Addressed in XOver

Cross-referencing the issue analysis with ANALYSIS.md's feature matrix, these are features/fixes users have requested that remain unaddressed in XOver:

### Critical Gaps (Most Requested, Missing in XOver)

| Priority | Issue(s) | Feature | Comments | In Crossover? |
|---|---|---|---|---|
| 🔴 | #64, #1, #373, #416 | **Fullscreen overlay support** | 39 issues, 19 comments on #64 | ❌ Neither version |
| 🔴 | #185 (PR), many requests | **ADS hide/resize** | Core gaming feature | ✅ Yes, **missing in XOver** |
| 🔴 | #116 (PR) | **Hide on keypress** | Hold-to-hide | ✅ Yes, **missing in XOver** |
| 🔴 | #308, #382 | **Show on ADS (inverse)** | 10 comments | ❌ Neither version |
| 🔴 | Auto-update pipeline | **Working auto-update** | 25+ error reports | ✅ Yes (broken), **disabled in XOver** |

### Important Gaps

| Priority | Issue(s) | Feature | In Crossover? |
|---|---|---|---|
| 🟡 | #127 | **Per-game profiles / detect focused window** | ❌ Neither |
| 🟡 | #24, #68, #302 | **Linux transparency** | ⚠️ Partial in Crossover |
| 🟡 | #456, #420, #384 | **Linux/Wayland keyboard shortcuts** | ⚠️ Broken in Crossover too |
| 🟡 | #474, #432, #422 | **macOS stability (Apple Silicon)** | ⚠️ Old Electron causes crashes |
| 🟡 | #391 | **Tray menu safety (reset too easy to click)** | ✅ Fixed in Crossover, XOver has minimal tray |
| 🟡 | #419, #79, #455 | **Anti-cheat compatibility documentation** | ❌ Neither |
| 🟡 | #418 | **Dynamic/adaptive crosshair color** | ❌ Neither |
| 🟡 | #47 | **Game compatibility list** | ✅ In Crossover README |

### Nice-to-Have Gaps

| Priority | Issue(s) | Feature |
|---|---|---|
| 🟢 | #475 | Center on game window (not just screen center) |
| 🟢 | #449 | Lossless Scaling compatibility |
| 🟢 | #367, #379 | True portable mode |
| 🟢 | #359 | Screen recording compatibility (hide from capture) |
| 🟢 | #396 | Follow mouse even while holding mouse button |
| 🟢 | #61 | Toggle between two saved crosshair configs |
| 🟢 | #245 | Rename project (trademark concern with CodeWeavers) |
| 🟢 | #191 | Star/favorite crosshairs |
| 🟢 | #286 | Save/load duplicate window configurations |
| 🟢 | #237 | Manually input X/Y position values |

---

## 6. Community Insights

### Stars & Activity

| Metric | crossover | xover |
|---|---|---|
| Stars | **1,130** | 0 |
| Forks | 118 | 0 |
| Open issues | 90 | 9 |
| Watchers | 1,130 | 0 |
| Last push | 2026-03-03 | 2025-06-05 |

CrossOver has a solid user base (1,130 stars is significant for a niche desktop tool). XOver has zero community presence — it's never been publicly announced or released.

### Release History

CrossOver has had consistent releases:
- **v1.x** (2020): Basic overlay
- **v2.x** (2021-2022): IOHook features, follow mouse, tilt, ADS
- **v3.0-v3.1.5** (2022-04): Major UI overhaul, dark mode, sounds
- **v3.2.0-v3.3.4** (2022-2023): Bug fixes, stability
- **v3.4.0** (2025-08): Kenney.nl SVGs, accessibility fixes
- **v3.4.1** (2025-12): Latest stable (though v3.4.2/v3.4.3 are draft)
- **v4.0.0-alpha.1/2** (2024-02/04): XOver alphas (published under crossover releases!)

XOver v4.0.0-alpha.1 and alpha.2 were released under the **crossover** repo's releases (not xover's), suggesting they were intended as the next major version of CrossOver.

### Most Active Discussions

| # | Title | Comments | Theme |
|---|---|---|---|
| #47 | List of Games (that work/don't work) | **45** | Community compatibility list |
| #68 | Transparency Issues | **29** | Linux transparency megathread |
| #64 | Fullscreen mode | **19** | Fundamental limitation discussion |
| #24 | Linux/Debian black window | **19** | Early Linux transparency issue |
| #108 | Crosshair tilt/lean | **18** | Feature request → implemented |
| #5 | Cross-platform issues | **16** | Early multi-platform discussion |
| #302 | Black background | **14** | More Linux transparency |
| #216 | Show/Hide only hides | **14** | Toggle behavior bug |
| #128 | Tarkov not working | **14** | Game-specific compatibility |
| #245 | Rename project? | **13** | Trademark discussion |

### Recurring Complaints (Themes)

1. **"It doesn't work in fullscreen"** — The #1 user frustration. Electron overlays can't render over exclusive fullscreen games. Users keep reporting it despite it being a known limitation.

2. **"The error keeps popping up"** — The `setBadge` auto-update error. Users who installed v3.0.0 get an error dialog every 20 minutes. This is driving negative perception.

3. **"It doesn't work on Linux"** — Transparency issues make the app essentially non-functional on many Linux setups. Wayland support is increasingly critical.

4. **"How do I lock/hide the background?"** — UX confusion. New users don't understand the lock mechanism. Issues #406, #461, #393 are all users confused by basic functionality.

5. **"My antivirus/anti-cheat flags it"** — Windows Defender false positives (#80), CS2 VAC timeouts (#419). Trust/safety concern.

### User Demographics (Inferred)

Based on issue content:
- **Primary users**: FPS gamers (Fortnite, CS2, Valorant, Tarkov, Hunt: Showdown, Sea of Thieves)
- **Platform split**: ~60% Windows, ~20% Linux, ~15% macOS, ~5% multi-platform
- **Skill level**: Ranges from very technical (Linux users filing detailed bug reports) to very casual (users filing empty bug reports with no information)
- **Geographic**: Global — issues in English, Portuguese, French, Spanish, German, Korean, Russian, Italian, Turkish, Arabic
- **International**: Many non-English-speaking users file gibberish-titled issues because the crash reporter auto-submits

---

## 7. Updated Recommendations

Combining issue research with the code analysis from ANALYSIS.md, here's a prioritized roadmap for XOver:

### Phase 0 — Foundation (Do First)

These are blocking issues that prevent any meaningful release:

1. **Upgrade Electron** (12.2.3 → 33+)
   - Fixes: macOS Apple Silicon crashes (#432, #474), security vulnerabilities, modern API access
   - Required for: `uiohook-napi` compatibility, modern Wayland support
   - Crossover already bumped to Electron 22.x via Dependabot; XOver is further behind

2. **Migrate `iohook` → `uiohook-napi`**
   - Fixes: All IOHook-dependent features being unreliable
   - Required for: ADS hide, hide on key, resize on ADS, tilt
   - The old `iohook` won't even compile against modern Electron

3. **Enable auto-update**
   - Lesson from Crossover: The broken update pipeline generated 25+ bug reports and left users stuck on broken versions
   - XOver has the code commented out — un-comment, test, and ensure release artifacts are properly published

4. **Implement single-instance lock**
   - Without this, users can accidentally run multiple instances
   - Crossover uses second-instance to create shadow windows — replicate this behavior

### Phase 1 — Feature Parity (Core Gaming)

These are the features Crossover users expect and XOver is missing:

5. **Hide crosshair on mouse button (ADS hide)**
   - The most important gaming feature Crossover has that XOver doesn't
   - Support: toggle/hold modes, configurable button
   - Also implement the **inverse** (#308): show crosshair only when ADS button is held

6. **Hide crosshair on keypress**
   - Hold-to-hide with configurable key
   - Simple to implement once IOHook is working

7. **Resize crosshair on ADS**
   - Right-click resize with configurable ADS size
   - Toggle/hold modes

8. **SVG inline rendering**
   - Without this, SVG customization (fill, stroke, stroke-width) is impossible
   - 140+ Kenney.nl SVGs were added to Crossover — make them fully customizable in XOver

9. **macOS accessibility permission flow**
   - IOHook features require accessibility permissions on macOS
   - Crossover has a comprehensive dialog flow; XOver has nothing

### Phase 2 — User Experience

Address the most common UX complaints from Crossover issues:

10. **Crosshair chooser gallery**
    - The small combobox is inadequate for 140+ crosshairs
    - Build a visual grid/gallery (modal or dedicated page in settings)

11. **Drag-and-drop custom images**
    - One of Crossover's most-loved features
    - Missing from XOver entirely

12. **Fix auto-update error handling**
    - Learn from Crossover's `setBadge` disaster: never call platform-specific APIs without checking platform first
    - Handle 404s gracefully, don't show error dialogs repeatedly

13. **Tray menu improvements**
    - Add: Show App, Choose Crosshair, Custom Image, Reset (with confirmation!)
    - Issue #391 specifically requested moving Reset away from Quit in the tray

14. **Game compatibility documentation**
    - Port Crossover's games list (#47, 45 comments) to XOver
    - Clearly document: works in windowed/borderless only, not exclusive fullscreen

### Phase 3 — Linux & Platform Support

Address the chronic Linux issues:

15. **Linux transparency investigation**
    - Test on: GNOME (X11+Wayland), KDE Plasma (X11+Wayland), Cinnamon, i3, Sway
    - Document compositor requirements
    - Consider alternative overlay approaches for Wayland

16. **Wayland keyboard shortcut support**
    - Electron's `globalShortcut` has known issues on Wayland
    - May need D-Bus or portal-based shortcut registration

17. **Snap/Flatpak packaging**
    - Users requested Snap updates (#415)
    - Flatpak was also requested (#225)

### Phase 4 — Differentiation

New features that would make XOver better than Crossover:

18. **Per-game profiles / detect focused window**
    - #127 (10 comments) — auto-show/hide based on active application
    - Switch crosshair settings per game
    - Use `electron.desktopCapturer` or native window enumeration

19. **Show on ADS (inverse mode)**
    - #308 (10 comments), #382 — keep crosshair hidden, show only when ADS is active
    - Novel feature not in any competitor

20. **Dynamic crosshair color**
    - #418 — change crosshair color based on what's behind it
    - Could use screen pixel sampling to pick contrasting color

21. **Center on game window**
    - #475 — for users playing windowed games on large monitors
    - Detect game window bounds and center crosshair there

22. **Crosshair profiles/presets**
    - Save/load configurations
    - Quick-switch between profiles via shortcut or tray
    - Export/share profiles

23. **Project rename consideration**
    - #245 (13 comments) — "CrossOver" conflicts with CodeWeavers' trademark
    - "XOver" is already a step in the right direction
    - Consider: XOver, CrossOverlay, or something unique

### Anti-Patterns to Avoid

Based on Crossover's issue history:

1. **Don't ship with broken auto-update** — The `setBadge` bug generated more noise than all other bugs combined. Test auto-update on all platforms before release.

2. **Don't call platform-specific APIs without guards** — `app.dock` doesn't exist on Windows. Always check `process.platform`.

3. **Don't put destructive actions near common actions in menus** — Reset next to Quit in the tray menu caused accidental data loss (#391).

4. **Don't auto-submit crash reports** — Many "issues" in the crossover repo are auto-generated crash reports with no context, cluttering the issue tracker.

5. **Clearly communicate the fullscreen limitation** — Users will keep reporting "doesn't work in fullscreen" unless it's prominently documented in the app itself, not just the README.

6. **Don't leave release artifacts missing** — Multiple 404 errors for v3.4.1 downloads. Validate release artifacts exist before publishing release notes.

---

## Appendix: Issue Statistics Summary

### Crossover Issues by Type (estimated from 200 most recent)
- **Auto-update errors**: ~25 (setBadge, 404, NSIS)
- **Bugs (labeled)**: ~30 (transparency, crashes, broken shortcuts)
- **Feature requests (labeled)**: ~29
- **Empty/spam reports**: ~15 (auto-crash-reports with no info)
- **Support questions**: ~20
- **Game-specific**: ~15
- **Platform-specific (Linux)**: ~20
- **Discussions**: ~10

### Platform Distribution of Issues
- Windows: 104 issues mentioning Windows
- Linux: 39 issues mentioning Linux
- macOS: 28 issues mentioning Mac/macOS
- Wayland: 8 issues specifically about Wayland
- Fullscreen: 39 issues about fullscreen mode
- Anti-cheat: 14 issues about anti-cheat/bans
