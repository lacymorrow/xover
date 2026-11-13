/**
 * @jest-environment node
 *
 * Lacy approved this note's words once, verbatim, on LAC-7622 (2026-11-11):
 * "Ship it in the release notes and the Pro screen unchanged."
 *
 * "Once" is the problem these tests solve. The note ships in two places, it
 * makes a promise the product has already broken (LAC-7671 shipped two
 * v3-free features behind the paywall while the copy said nothing was taken
 * away), and it quotes a price the storefront does not currently charge
 * (LAC-7720). Any of those three can drift silently.
 *
 * So the approved wording is written out again here, by hand, rather than
 * imported and compared to itself. Changing the note means changing this file
 * too, which means someone has to decide to do it.
 */
import fs from 'fs';
import path from 'path';
import { PRO_NOTE, PRO_NOTE_TEXT, PRO_PRICE_USD } from '../config/pro-note';

/** Transcribed from reports/lac-7622-pro-note.md as Lacy approved it. */
const APPROVED = [
	"I started CrossOver in October 2019 and it's been free the whole time, every feature, no paywall. I want to keep it that way, so v4 adds Pro at $4.99 once. That covers the Apple notarization, the code signing certificate, the store fees, and the hours that go into keeping Windows, macOS and Linux all working.",
	"Everything that was free in v3 is still free. Pro doesn't take anything away from you.",
];

const DOC = path.join(__dirname, '..', '..', 'docs', 'pro-note.md');

describe('the Pro note ships as approved', () => {
	it('matches the approved wording exactly', () => {
		expect(PRO_NOTE).toEqual(APPROVED);
	});

	it('says October 2019, never "a decade"', () => {
		// The brief and knowledge/portfolio.md both said "over a decade". The
		// first commit is 2019-10-04, so that is six years, and this copy is
		// public. crossover@0058b63 already corrected one overstated claim in
		// this app's README.
		expect(PRO_NOTE_TEXT).toContain('October 2019');
		expect(PRO_NOTE_TEXT).not.toMatch(/decade/i);
	});

	it('keeps the promise the whole note rests on', () => {
		expect(PRO_NOTE_TEXT).toContain(
			'Everything that was free in v3 is still free',
		);
	});

	it('quotes the price the app is configured to charge', () => {
		// If the price ever changes, the sentence has to change with it. This
		// catches the note and the config disagreeing; LAC-7720 owns making
		// Polar agree with both.
		expect(PRO_NOTE_TEXT).toContain(`$${PRO_PRICE_USD.toFixed(2)}`);
	});
});

describe('the release-notes copy and the in-app copy are the same copy', () => {
	const doc = fs.readFileSync(DOC, 'utf8');

	it('docs/pro-note.md carries the note verbatim', () => {
		const match = doc.match(
			/<!-- BEGIN PRO NOTE -->\n([\s\S]*?)\n<!-- END PRO NOTE -->/,
		);
		expect(match).not.toBeNull();
		expect(match![1].trim()).toBe(PRO_NOTE_TEXT);
	});
});

describe('the Pro screen renders the note rather than paraphrasing it', () => {
	const screen = fs.readFileSync(
		path.join(
			__dirname,
			'..',
			'renderer',
			'components',
			'pages',
			'settings',
			'license',
			'SettingsLicense.tsx',
		),
		'utf8',
	);

	it('imports and renders PRO_NOTE', () => {
		expect(screen).toMatch(
			/import\s*\{\s*PRO_NOTE\s*\}\s*from\s*'@\/config\/pro-note'/,
		);
		expect(screen).toContain('PRO_NOTE.map');
	});

	it('no longer hardcodes the old paraphrase', () => {
		// Before this change the screen said "Pro is how CrossOver stays
		// maintained. Pay once." in its own words, which is the drift this
		// whole file exists to prevent.
		expect(screen).not.toContain('Pro is how CrossOver stays maintained');
	});
});
