# Lacy's Pro note

This is the copy the v4 release notes are built from. It also ships on the
in-app Pro screen, which reads it from `src/config/pro-note.ts`.

`.erb/scripts/release-notes.js` reads the block below at release time and
prints the GitHub release body; `release-v4.yml` in lacymorrow/crossover runs
it and sets the body with `gh release edit`. Before that job existed every v4
pre-release body on GitHub was empty (LAC-7622).

Approved verbatim by Lacy on LAC-7622, 2026-11-11. `src/__tests__/pro-note.test.ts`
keeps this file and the constant identical, so editing one without the other
fails the build. Do not reword without his say so.

<!-- BEGIN PRO NOTE -->
I started CrossOver in October 2019 and it's been free the whole time, every feature, no paywall. I want to keep it that way, so v4 adds Pro at $4.99 once. That covers the Apple notarization, the code signing certificate, the store fees, and the hours that go into keeping Windows, macOS and Linux all working.

Everything that was free in v3 is still free. Pro doesn't take anything away from you.
<!-- END PRO NOTE -->

## Before this ships

The price is $4.99 one-time everywhere: this note, the Polar product, and the
Mac App Store in-app purchase (Lacy, 2026-11-13). Change all three together or
none. No launch discount (Lacy, 2026-11-13).
