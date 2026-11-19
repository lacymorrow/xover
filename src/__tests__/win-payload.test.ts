/**
 * @jest-environment node
 *
 * Regression for LAC-8625: `Build` went red on `main` the moment koffi landed
 * (e6bddb5, PR #87) and no v4 beta could be cut for two days.
 *
 * `assert-win-arch.js` already knew that a per-platform prebuild directory
 * only has to be loadable on the platform it names, but it recognised exactly
 * one layout for them, node-gyp-build's `prebuilds/<platform>-<arch>/`. koffi
 * uses `build/koffi/<platform>_<arch>/` instead -- different parent,
 * underscore instead of a hyphen -- so the four sibling-platform koffi
 * binaries that ride along in the x64 Windows package looked like binaries the
 * app loads, and the guard correctly observed that a Mach-O file is not a PE.
 *
 * The fix is the narrow one. Pruning them out of `build.files` instead is
 * tempting and wrong twice over: `files` is shared by every platform, so
 * excluding `darwin*` would break the macOS package, and an arch check over
 * the files that are present cannot tell that the one the app loads has gone
 * missing. So this file pins both halves: the sibling platforms are ignored,
 * and `win32-<arch>` going missing is a failure.
 *
 * Layouts and separators verified against the published tarballs:
 *   koffi 2.16.4         build/koffi/{darwin_arm64,darwin_x64,win32_arm64,
 *                        win32_ia32,win32_x64,...}/koffi.node
 *   uiohook-napi 1.5.4   prebuilds/{darwin-arm64,darwin-x64,linux-arm64,
 *                        linux-x64,win32-x64}/node.napi.node
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

const SCRIPT = path.join(
	__dirname,
	'..',
	'..',
	'.erb',
	'scripts',
	'win-payload.js',
);

// eslint-disable-next-line global-require, import/no-dynamic-require
const { classifyAddons, prebuildTarget } = require(SCRIPT) as {
	classifyAddons: (
		resources: string,
		arch: string,
	) => { load: string[]; failures: string[] };
	prebuildTarget: (file: string) => string | null;
};

const PE_MACHINE: Record<string, number> = {
	x64: 0x8664,
	arm64: 0xaa64,
	ia32: 0x014c,
};

/** The smallest byte sequence `peMachine` will read an arch out of. */
const peBytes = (arch: string): Buffer => {
	const buf = Buffer.alloc(0x80);
	buf.write('MZ', 0, 'ascii');
	buf.writeUInt32LE(0x40, 0x3c); // e_lfanew
	buf.write('PE\0\0', 0x40, 'ascii');
	buf.writeUInt16LE(PE_MACHINE[arch], 0x44);
	return buf;
};

/** A 64-bit Mach-O magic, which is what the darwin koffi prebuilds really are. */
const machOBytes = (): Buffer => {
	const buf = Buffer.alloc(0x80);
	buf.writeUInt32BE(0xfeedfacf, 0);
	return buf;
};

const write = (file: string, bytes: Buffer) => {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, new Uint8Array(bytes));
};

/**
 * A `resources/` tree shaped like the real x64 Windows package: both native
 * modules, every prebuild each one publishes, as the real file formats.
 */
const packageTree = (skip: string[] = []): string => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'win-payload-'));
	const modules = path.join(root, 'app.asar.unpacked', 'node_modules');

	const koffi = path.join(modules, 'koffi', 'build', 'koffi');
	const uiohook = path.join(modules, 'uiohook-napi', 'prebuilds');

	const files: Record<string, Buffer> = {
		[path.join(koffi, 'darwin_arm64', 'koffi.node')]: machOBytes(),
		[path.join(koffi, 'darwin_x64', 'koffi.node')]: machOBytes(),
		[path.join(koffi, 'win32_arm64', 'koffi.node')]: peBytes('arm64'),
		[path.join(koffi, 'win32_ia32', 'koffi.node')]: peBytes('ia32'),
		[path.join(koffi, 'win32_x64', 'koffi.node')]: peBytes('x64'),
		[path.join(uiohook, 'darwin-arm64', 'node.napi.node')]: machOBytes(),
		[path.join(uiohook, 'darwin-x64', 'node.napi.node')]: machOBytes(),
		[path.join(uiohook, 'win32-x64', 'node.napi.node')]: peBytes('x64'),
	};

	Object.entries(files)
		.filter(([file]) => !skip.some((part) => file.includes(part)))
		.forEach(([file, bytes]) => write(file, bytes));

	return root;
};

describe('prebuildTarget', () => {
	it("reads node-gyp-build's prebuilds/<platform>-<arch>/ layout", () => {
		expect(
			prebuildTarget(
				path.join('x', 'uiohook-napi', 'prebuilds', 'win32-x64', 'n.node'),
			),
		).toBe('win32-x64');
	});

	it("reads koffi's build/koffi/<platform>_<arch>/ layout", () => {
		// The miss that made Build red: an underscore, and no `prebuilds`
		// segment anywhere in the path.
		expect(
			prebuildTarget(
				path.join('x', 'koffi', 'build', 'koffi', 'win32_x64', 'koffi.node'),
			),
		).toBe('win32-x64');
	});

	it('reads the sibling platforms koffi ships next to it', () => {
		const target = (dir: string) =>
			prebuildTarget(path.join('koffi', 'build', 'koffi', dir, 'koffi.node'));

		expect(target('darwin_arm64')).toBe('darwin-arm64');
		expect(target('linux_riscv64d')).toBe('linux-riscv64d');
		expect(target('musl_x64')).toBe('musl-x64');
	});

	it('returns null for an addon that is not in a per-platform directory', () => {
		// Those are the LAC-7453 case and have to stay arch-checked.
		expect(
			prebuildTarget(path.join('m', 'build', 'Release', 'thing.node')),
		).toBeNull();
	});
});

describe('classifyAddons on an x64 Windows package', () => {
	it('passes a package that carries every prebuild both modules publish', () => {
		// This is exactly what CI produced on 2026-11-19 and the guard rejected.
		expect(classifyAddons(packageTree(), 'x64').failures).toEqual([]);
	});

	it('arch-checks the koffi binary the app actually loads, not its siblings', () => {
		const { load } = classifyAddons(packageTree(), 'x64');

		expect(
			load
				.filter((f) => f.includes('koffi'))
				.map((f) => path.basename(path.dirname(f))),
		).toEqual(['win32_x64']);
	});

	it('arch-checks the input hook prebuild for this arch and no other', () => {
		const { load } = classifyAddons(packageTree(), 'x64');

		expect(
			load
				.filter((f) => f.includes('uiohook-napi'))
				.map((f) => path.basename(path.dirname(f))),
		).toEqual(['win32-x64']);
	});

	it('leaves the other Windows arches koffi ships alone', () => {
		// A prebuild directory is picked by platform and arch together, so
		// `win32_arm64` is no more loadable here than `darwin_x64` is. Both are
		// weight in the installer, which is a separate job (LAC-8627).
		const { load, failures } = classifyAddons(packageTree(), 'x64');

		expect(failures).toEqual([]);
		expect(load.filter((f) => /win32_(arm64|ia32)/.test(f))).toEqual([]);
	});

	it('names the module, not just the file, when the prebuild it needs is gone', () => {
		const { failures } = classifyAddons(packageTree(['win32_x64']), 'x64');

		expect(failures).toHaveLength(1);
		expect(failures[0]).toContain(
			`${path.join('koffi', 'build', 'koffi')}: has prebuilds for ` +
				`darwin-arm64, darwin-x64, win32-arm64, win32-ia32 and none ` +
				`for win32-x64`,
		);
	});

	it('fails when the prebuild the app loads has been pruned away', () => {
		// The dangerous fix for LAC-8625: tighten the `build.files` globs by one
		// character too many and the app installs, launches, and dies on its
		// first koffi call. Reading the arch of the files that are there cannot
		// see this, so assert the directory is present.
		const { failures } = classifyAddons(packageTree(['win32_x64']), 'x64');

		expect(failures).toHaveLength(1);
		expect(failures[0]).toMatch(/koffi/);
		expect(failures[0]).toMatch(/win32-x64/);
	});

	it('fails when the input hook prebuild has been pruned away', () => {
		// Same shape, and this one costs every global shortcut.
		const { failures } = classifyAddons(packageTree(['win32-x64']), 'x64');

		expect(failures).toHaveLength(1);
		expect(failures[0]).toMatch(/uiohook-napi/);
	});

	it('fails when a module the app loads brought no addon at all', () => {
		// The per-directory checks can only see a module that left something
		// behind. `!node_modules/koffi/build` prunes every trace of it, and the
		// app would install, launch, and lose auto profiles with no error.
		const { failures } = classifyAddons(packageTree(['koffi']), 'x64');

		expect(failures).toEqual([
			'koffi: the package contains no addon from it at all, so auto ' +
				'profiles silently stop (it reads the foreground window)',
		]);
	});

	it('arch-checks an addon that sits outside any per-platform directory', () => {
		const root = packageTree();
		const loose = path.join(root, 'app.asar.unpacked', 'build', 'bad.node');
		write(loose, machOBytes());

		expect(classifyAddons(root, 'x64').load).toContain(loose);
	});
});
