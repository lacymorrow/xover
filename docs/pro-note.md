# Lacy's Pro note

This is the copy the v4 release notes are built from. It also ships on the
in-app Pro screen, which reads it from `src/config/pro-note.ts`.

`.erb/scripts/release-notes.js` reads the block below at release time and
prints the GitHub release body; `release-v4.yml` in lacymorrow/crossover runs
it and sets the body with `gh release edit`. Before that job existed every v4
pre-release body on GitHub was empty (LAC-7622).

Approved by Lacy 2026-11-19 (replaces the 2026-11-11 wording; public copy no longer mentions v3). `src/__tests__/pro-note.test.ts`
keeps this file and the constant identical, so editing one without the other
fails the build. Do not reword without his say so.

<!-- BEGIN PRO NOTE -->
I started CrossOver in October 2019, and the crosshair has been free ever since. It stays free. CrossOver 4 adds Pro for $4.99, once.

Pro saves a crosshair for every game and switches to it the moment that game is in front. It also pays for the code signing, the store fees and the hours that keep CrossOver working on Windows, macOS and Linux.
<!-- END PRO NOTE -->

## Before this ships

The price is $4.99 one-time everywhere: this note, the Polar product, and the
Mac App Store in-app purchase (Lacy, 2026-11-13). Change all three together or
none. No launch discount (Lacy, 2026-11-13).
