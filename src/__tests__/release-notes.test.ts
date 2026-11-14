/**
 * @jest-environment node
 *
 * LAC-7622 item 3: "The Pro screen and the release notes carry a short
 * first-person note from Lacy."
 *
 * The screen half landed in #81. The release-notes half had no mechanism at
 * all: v4 is published by `release-v4.yml` in lacymorrow/crossover, which runs
 * electron-builder and nothing else, so every v4 pre-release body on GitHub is
 * empty, while `docs/pro-note.md` claimed to be "the copy the v4 release notes
 * are built from".
 *
 * `.erb/scripts/release-notes.js` is that mechanism. It is plain CommonJS on
 * purpose: the release job runs it with bare `node` after a checkout, with no
 * `npm install`.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { PRO_NOTE_TEXT, PRO_PRICE_USD } from '../config/pro-note';

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, '.erb', 'scripts', 'release-notes.js');
const DOC = path.join(ROOT, 'docs', 'pro-note.md');

// eslint-disable-next-line global-require, import/no-dynamic-require
const { readProNote } = require(SCRIPT);

describe('readProNote', () => {
	it('reads the note out of docs/pro-note.md, not out of a second copy', () => {
		// Same source the Pro screen uses, so the release page and the app can
		// never disagree about what Lacy said.
		expect(readProNote(DOC)).toBe(PRO_NOTE_TEXT);
	});

	it('throws when the markers are gone instead of publishing nothing', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pro-note-'));
		const tmp = path.join(dir, 'pro-note.md');
		fs.writeFileSync(tmp, '# note\n\nsomeone deleted the markers\n');
		expect(() => readProNote(tmp)).toThrow(/BEGIN PRO NOTE/);
	});
});

describe('the release job can run it with bare node', () => {
	const body = execFileSync(process.execPath, [SCRIPT], { encoding: 'utf8' });

	it('prints the note on stdout, and nothing else', () => {
		expect(body).toBe(PRO_NOTE_TEXT);
	});

	it('keeps the promise the note rests on', () => {
		expect(body).toContain('Everything that was free in v3 is still free');
	});

	it('quotes the price the app is configured to charge', () => {
		// The release page is where someone decides to pay. If it quotes a
		// price the app does not charge, this is the worst place for it.
		expect(body).toContain(`$${PRO_PRICE_USD.toFixed(2)}`);
	});
});
