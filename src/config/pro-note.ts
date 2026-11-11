/**
 * Lacy's note about why Pro exists.
 *
 * Approved by him verbatim on LAC-7622, 2026-11-11: "the Pro note is approved
 * as drafted [...] Ship it in the release notes and the Pro screen unchanged."
 *
 * It ships in two places, so it lives in one. The Pro screen imports
 * `PRO_NOTE`; `docs/pro-note.md` is the copy the v4 release notes are built
 * from. `src/__tests__/pro-note.test.ts` pins them to each other and to the
 * approved wording, because the whole point of this note is that it makes a
 * promise ("everything that was free in v3 is still free") that the product
 * has already broken once (LAC-7671).
 *
 * Do not reword any of this without Lacy saying so. Two details are load
 * bearing:
 *
 * - "October 2019" is deliberate. The brief and knowledge/portfolio.md both
 *   said "over a decade"; the repo's first commit is 2019-10-04, so that is
 *   six years. crossover@0058b63 was already one round of correcting an
 *   overstated public claim in this app's README, and this copy has a larger
 *   audience than the README.
 * - "$9.99" has to match what Polar actually charges. At the time of writing
 *   the live product charges $4.99 (LAC-7720), so the price has to be
 *   corrected before v4 ships or this note is a lie told by the app itself.
 *   The test pins the figure to PRO_PRICE_USD; LAC-7720 owns making Polar
 *   agree with it.
 */

/** The decided price, one-time. knowledge/portfolio.md, 2026-11-10. */
export const PRO_PRICE_USD = 9.99;

/** Paragraphs, so the UI can lay them out without parsing prose. */
export const PRO_NOTE: readonly string[] = [
	"I started CrossOver in October 2019 and it's been free the whole time, every feature, no paywall. I want to keep it that way, so v4 adds Pro at $9.99 once. That covers the Apple notarization, the code signing certificate, the store fees, and the hours that go into keeping Windows, macOS and Linux all working.",
	"Everything that was free in v3 is still free. Pro doesn't take anything away from you.",
];

/** The same note as one block, for release notes and anywhere prose is fine. */
export const PRO_NOTE_TEXT = PRO_NOTE.join('\n\n');
