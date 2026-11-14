/**
 * Prints the body of a CrossOver v4 GitHub release: Lacy's Pro note.
 *
 * LAC-7622 item 3 says the note ships in two places, the in-app Pro screen and
 * the release notes. The screen half landed in #81. The release notes had no
 * mechanism at all. v4 is published by `release-v4.yml` in
 * lacymorrow/crossover, which runs electron-builder and nothing else, so every
 * v4 pre-release body on GitHub is empty, while `docs/pro-note.md` claimed to
 * be "the copy the v4 release notes are built from".
 *
 * This is what builds them from it. The note is read out of that same file at
 * release time, so the words on the release page, the words on the Pro screen
 * and the words Lacy approved cannot drift apart.
 *
 * Plain CommonJS with no dependencies on purpose: the release job runs it with
 * bare `node` straight after `actions/checkout`, with no `npm install`.
 *
 *   node .erb/scripts/release-notes.js > body.md
 *   gh release edit "$TAG" --notes-file body.md
 *
 * No generated "What's Changed" list, deliberately: the release lives in
 * lacymorrow/crossover while the code lives here, so GitHub's generate-notes
 * would diff v3's history, and this repo has no v4 tag to diff against.
 *
 * `src/__tests__/release-notes.test.ts` pins the output to the wording Lacy
 * approved and to PRO_PRICE_USD.
 */
const fs = require('fs');
const path = require('path');

/** The one copy of the note. The Pro screen reads the same text. */
const DEFAULT_DOC = path.join(__dirname, '..', '..', 'docs', 'pro-note.md');

const NOTE_BLOCK = /<!-- BEGIN PRO NOTE -->\n([\s\S]*?)\n<!-- END PRO NOTE -->/;

/**
 * Pulls Lacy's note out of docs/pro-note.md.
 *
 * Throws rather than returning an empty string: a release that quietly ships
 * without the note is the failure this file exists to prevent, and a failed
 * release job is cheap next to a published page that says nothing.
 */
function readProNote(docPath = DEFAULT_DOC) {
	const match = fs.readFileSync(docPath, 'utf8').match(NOTE_BLOCK);
	if (!match || !match[1].trim()) {
		throw new Error(
			`${docPath} has no <!-- BEGIN PRO NOTE --> block to read. Refusing to publish a release with no note.`,
		);
	}
	return match[1].trim();
}

if (require.main === module) {
	process.stdout.write(readProNote());
}

module.exports = { readProNote };
