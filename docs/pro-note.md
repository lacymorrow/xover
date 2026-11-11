# Lacy's Pro note

This is the copy the v4 release notes are built from. It also ships on the
in-app Pro screen, which reads it from `src/config/pro-note.ts`.

Approved verbatim by Lacy on LAC-7622, 2026-11-11. `src/__tests__/pro-note.test.ts`
keeps this file and the constant identical, so editing one without the other
fails the build. Do not reword without his say so.

<!-- BEGIN PRO NOTE -->
I started CrossOver in October 2019 and it's been free the whole time, every feature, no paywall. I want to keep it that way, so v4 adds Pro at $9.99 once. That covers the Apple notarization, the code signing certificate, the store fees, and the hours that go into keeping Windows, macOS and Linux all working.

Everything that was free in v3 is still free. Pro doesn't take anything away from you.
<!-- END PRO NOTE -->

## Before this ships

The note says $9.99. The live Polar product charged $4.99 when this was
written, so the price has to be corrected first or the app states a price it
does not charge. LAC-7720 owns that, along with the founding-user code (50%
off, 30 days, created **at** the release so the clock does not start early).
