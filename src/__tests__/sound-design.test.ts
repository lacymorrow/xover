/**
 * @jest-environment node
 *
 * Sound design audit (LAC-6154). CrossOver plays over games, so a sound only
 * earns its place when it confirms something the person did blind. These
 * guards keep the set from growing back:
 *
 * 1. only the agreed names are mapped,
 * 2. every mapped file ships in assets/ (a rename can't silently go quiet),
 * 3. nothing in the source plays a name that isn't mapped (a leftover
 *    sounds.play('DONE') is a silent no-op at runtime, so only a test catches
 *    it),
 * 4. assets/sounds ships only the mapped files; the rest of the pack lives in
 *    src/static/sounds, which is not bundled.
 */
import fs from 'fs';
import path from 'path';

import { sounds } from '../renderer/lib/sounds';

const repoRoot = path.join(__dirname, '../..');
const shippedDir = path.join(repoRoot, 'assets/sounds');
const libraryDir = path.join(repoRoot, 'src/static/sounds');

const walk = (dir: string): string[] =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		return entry.isDirectory() ? walk(full) : [full];
	});

// The map stores urls, which are always forward-slashed. Windows walks the
// same files with backslashes.
const asUrl = (from: string, file: string) =>
	path.relative(from, file).split(path.sep).join('/');

const sourceFiles = (dir: string): string[] =>
	walk(dir).filter((file) => /\.(ts|tsx)$/.test(file));

describe('sound design', () => {
	it('maps only the sounds we decided to keep', () => {
		expect(Object.keys(sounds).sort()).toEqual([
			'CENTER',
			'HERO',
			'LOCK',
			'NOTIFICATION',
			'UNLOCK',
		]);
	});

	it('ships a file for every mapped sound', () => {
		Object.entries(sounds).forEach(([name, { url }]) => {
			expect({
				name,
				exists: fs.existsSync(path.join(shippedDir, ...url.split('/'))),
			}).toEqual({ name, exists: true });
		});
	});

	it('plays no sound name that is not mapped', () => {
		const plays = sourceFiles(path.join(repoRoot, 'src'))
			.filter((file) => !file.includes('__tests__'))
			.flatMap((file) => {
				const source = fs.readFileSync(file, 'utf8');
				return [
					...source.matchAll(/(?:sounds?\.play|playSound)\(\s*'([A-Z_]+)'/g),
				].map((match) => ({
					file: asUrl(repoRoot, file),
					name: match[1],
				}));
			});

		expect(plays.length).toBeGreaterThan(0);
		expect(plays.filter(({ name }) => !(name in sounds))).toEqual([]);
	});

	it('ships only the mapped files, keeping the rest of the pack out of the bundle', () => {
		const shipped = walk(shippedDir)
			.map((file) => asUrl(shippedDir, file))
			.sort();

		expect(shipped).toEqual(
			Object.values(sounds)
				.map(({ url }) => url)
				.sort(),
		);
		// The unused pack is still in the repo, just not in the build.
		expect(walk(libraryDir).length).toBeGreaterThan(shipped.length);
	});
});
