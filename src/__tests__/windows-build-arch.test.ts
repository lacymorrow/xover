/**
 * @jest-environment node
 *
 * Regression for LAC-7453: the Windows targets named no arch, so
 * electron-builder fell back to the arch of whatever machine happened to run
 * the build. `build.yml` packages Windows on `macos-latest` (Apple Silicon),
 * so the CI installer came out arm64. NSIS then shipped an `app-arm64.7z`
 * payload that an x64 Windows box cannot use: the installer exits 0, writes an
 * uninstall entry, and leaves no application behind.
 *
 * x64 is the only Windows arch CrossOver can ship today, because the native
 * input hook (`uiohook-napi`, pinned in `release/app/package.json`) publishes
 * prebuilds for `win32-x64` and nothing for `win32-arm64`. An arm64 build
 * would package with no hook and every global shortcut would be dead.
 *
 * These assertions are config-only on purpose: `npm test` runs on every push
 * and PR, with no build, so this is the cheap guard that catches the config
 * drifting back. The expensive guard that reads the real packaged bytes is
 * `.erb/scripts/assert-win-arch.js`, which every `package*` script runs.
 */

import packageJson from '../../package.json';

interface WinTarget {
	target: string;
	arch?: string[];
}

const SUPPORTED_WIN_ARCHS = ['x64'];

// `${arch}` as a regex so the literal never reads as a template string.
const ARCH_PLACEHOLDER = /\$\{arch\}/;

const winTargets = packageJson.build.win.target as unknown as WinTarget[];

describe('Windows build targets', () => {
	it('ships both the installer and the portable exe', () => {
		expect(winTargets.map((t) => t.target).sort()).toEqual([
			'nsis',
			'portable',
		]);
	});

	it.each(['nsis', 'portable'])(
		'names an explicit arch for the %s target instead of inheriting the build host',
		(name) => {
			const target = winTargets.find((t) => t.target === name);

			expect(target).toBeDefined();
			expect(Array.isArray(target?.arch)).toBe(true);
			expect(target?.arch?.length).toBeGreaterThan(0);
		},
	);

	it('names only archs the native input hook has a prebuild for', () => {
		winTargets.forEach((target) => {
			expect(target.arch).toEqual(SUPPORTED_WIN_ARCHS);
		});
	});

	it('keeps the artifact names arch-free only while a single arch is built', () => {
		// `CrossOver-Installer-${version}.exe` carries no arch, so two archs
		// would overwrite each other in release/build and in the GitHub release.
		// Add the arch to the nsis and portable artifactName in the same change
		// that adds a second arch.
		const archs = new Set(winTargets.flatMap((t) => t.arch ?? []));
		const needsArchInName = archs.size > 1;

		[
			packageJson.build.nsis.artifactName,
			packageJson.build.portable.artifactName,
		].forEach((name) => {
			expect(ARCH_PLACEHOLDER.test(name)).toBe(needsArchInName);
		});
	});
});
