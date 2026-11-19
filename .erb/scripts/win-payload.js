/**
 * The pure half of the LAC-7453 Windows arch guard.
 *
 * `assert-win-arch.js` keeps the config reading, the `.exe` check and the
 * reporting. Everything in here is a function of a directory on disk, so
 * `npm test` can exercise it against a fake package tree instead of waiting
 * for a real Windows build to come out of CI (LAC-8625).
 *
 * Plain CommonJS on purpose, matching `release-notes.js`: the guard runs under
 * `ts-node` and the test requires the file directly.
 */

const fs = require('fs');
const path = require('path');

// IMAGE_FILE_MACHINE_*, winnt.h
const PE_MACHINE = {
	x64: 0x8664,
	arm64: 0xaa64,
	ia32: 0x014c,
};

/** Machine field of a PE file, or null if it is not a PE file at all. */
const peMachine = (file) => {
	const fd = fs.openSync(file, 'r');
	try {
		const head = Buffer.alloc(0x40);
		if (fs.readSync(fd, head, 0, head.length, 0) < head.length) return null;
		if (head.readUInt16LE(0) !== 0x5a4d) return null; // 'MZ'

		const peOffset = head.readUInt32LE(0x3c);
		const sig = Buffer.alloc(6);
		if (fs.readSync(fd, sig, 0, sig.length, peOffset) < sig.length) return null;
		if (sig.readUInt32LE(0) !== 0x00004550) return null; // 'PE\0\0'

		return sig.readUInt16LE(4);
	} finally {
		fs.closeSync(fd);
	}
};

const machineName = (machine) =>
	Object.keys(PE_MACHINE).find((arch) => PE_MACHINE[arch] === machine) ??
	`0x${(machine ?? 0).toString(16)}`;

/** Every `.node` addon under a directory, however deep. */
const addons = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return addons(full);
		return entry.name.endsWith('.node') ? [full] : [];
	});

/**
 * A per-platform prebuild directory. Two layouts ship in this tree and both
 * load only the directory naming the running platform, so every other
 * platform's copy rides along in the package and proves nothing about it:
 *
 *   uiohook-napi (node-gyp-build)  prebuilds/win32-x64/node.napi.node
 *   koffi                          build/koffi/win32_x64/koffi.node
 *
 * The parent differs and so does the separator, so match the directory name
 * itself. Recognising only the first of the two is what made `Build` red for
 * two days when koffi landed (LAC-8625).
 */
const PREBUILD_DIR =
	/^(aix|android|darwin|freebsd|linux|musl|openbsd|sunos|win32)[-_]([a-z0-9]+)$/;

/**
 * The platform and arch the directory an addon sits in is for, normalised to
 * `<platform>-<arch>`, or null when it is not in one of those at all. Those
 * are loaded unconditionally and have to be the right arch.
 */
const prebuildTarget = (file) => {
	const match = PREBUILD_DIR.exec(path.basename(path.dirname(file)));
	return match === null ? null : `${match[1]}-${match[2]}`;
};

/** The module directory a set of per-platform prebuild directories sits in. */
const prebuildRoot = (file) => path.dirname(path.dirname(file));

const inModule = (file, name) => file.split(path.sep).includes(name);

/**
 * The native modules the app loads on Windows, and what breaks when one is
 * not in the package. Both are pinned in `release/app/package.json`; the
 * third dependency there, `@aptabase/electron`, is pure JS.
 *
 * Named explicitly because the per-directory checks below can only see a
 * module that left something behind. Prune a module's prebuilds *all* the way
 * out and there is no directory left to notice.
 */
const REQUIRED_MODULES = {
	koffi: 'auto profiles silently stop (it reads the foreground window)',
	'uiohook-napi': 'every global shortcut is dead (it is the input hook)',
};

/**
 * Sorts every addon under `resources` into the ones that have to be loadable
 * on `arch`, and the reasons the payload is already wrong.
 *
 * A prebuild directory is picked by platform *and* arch, so anything other
 * than `win32-<arch>` is simply never loaded here: `win32-arm64` next to
 * `win32-x64` is dead weight in the installer, not a defect, and so is
 * `darwin-x64`. What matters is that `win32-<arch>` is there.
 *
 * That presence check is the half this guard was missing, and it is the half
 * the tempting fix for LAC-8625 needs. Pruning the sibling platforms out of
 * `build.files` is one glob away from pruning the one the app loads, and the
 * arch of the files still present says nothing about the file that is gone:
 * the app installs, launches, and dies on its first call into the module.
 */
const classifyAddons = (resources, arch) => {
	const failures = [];
	const load = [];
	const targetsByRoot = new Map();

	addons(resources).forEach((addon) => {
		const target = prebuildTarget(addon);

		// Outside a per-platform directory, so loaded whatever the platform:
		// read its arch out of the bytes. This is the LAC-7453 case.
		if (target === null) {
			load.push(addon);
			return;
		}

		const root = prebuildRoot(addon);
		if (!targetsByRoot.has(root)) targetsByRoot.set(root, new Set());
		targetsByRoot.get(root).add(target);

		if (target === `win32-${arch}`) load.push(addon);
	});

	const roots = [...targetsByRoot.keys()].sort();

	roots.forEach((root) => {
		const targets = [...targetsByRoot.get(root)].sort();
		if (targets.includes(`win32-${arch}`)) return;

		failures.push(
			`${root}: has prebuilds for ${targets.join(', ')} and none for ` +
				`win32-${arch}, so the module cannot load on Windows ${arch}`,
		);
	});

	// The complement of that check: a module that contributed no directory at
	// all, which the loop above cannot see.
	Object.entries(REQUIRED_MODULES).forEach(([name, breaks]) => {
		const seen =
			load.some((addon) => inModule(addon, name)) ||
			roots.some((root) => inModule(root, name));

		if (!seen)
			failures.push(
				`${name}: the package contains no addon from it at all, so ${breaks}`,
			);
	});

	return { load, failures };
};

module.exports = {
	PE_MACHINE,
	REQUIRED_MODULES,
	classifyAddons,
	machineName,
	peMachine,
	prebuildTarget,
};
