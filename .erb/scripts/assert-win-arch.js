/**
 * Regression guard for LAC-7453.
 *
 * The Windows targets used to name no arch, so electron-builder took the arch
 * of the build host. CI packaged Windows on macOS/arm64 and shipped an
 * `app-arm64.7z` payload: the installer exited 0 on an x64 box, wrote an
 * uninstall entry, and installed no application at all. Nothing failed loudly,
 * so it went unnoticed through eight betas.
 *
 * This reads the arch straight out of the packaged bytes rather than trusting
 * the config, so it also catches a cross-build that gets the Electron shell
 * right and the native modules wrong. Every `package*` script runs it right
 * after electron-builder:
 *
 *   npm run assert:win-arch
 */

import fs from 'fs';
import path from 'path';
import { build, productName } from '../../package.json';

// IMAGE_FILE_MACHINE_*, winnt.h
const PE_MACHINE = {
	x64: 0x8664,
	arm64: 0xaa64,
	ia32: 0x014c,
};

// electron-builder names the x64 output dir `win-unpacked` and every other
// arch `win-<arch>-unpacked`.
const unpackedDirFor = (arch) =>
	arch === 'x64' ? 'win-unpacked' : `win-${arch}-unpacked`;

const failures = [];
const checked = [];

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

const expectArch = (file, arch) => {
	const machine = peMachine(file);

	if (machine === null) {
		failures.push(`${file}: not a PE binary`);
	} else if (machine !== PE_MACHINE[arch]) {
		failures.push(
			`${file}: built for ${machineName(machine)}, expected ${arch}`,
		);
	} else {
		checked.push(file);
	}
};

/** Every `.node` addon under a directory, however deep. */
const addons = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return addons(full);
		return entry.name.endsWith('.node') ? [full] : [];
	});

/**
 * The `prebuilds/<platform>-<arch>/` directory an addon sits in, if any.
 * node-gyp-build loads the one matching the running platform at runtime, so
 * the other platforms' copies ride along in the package and prove nothing.
 */
const prebuildTarget = (file) => {
	const parts = file.split(path.sep);
	const at = parts.lastIndexOf('prebuilds');
	return at >= 0 ? parts[at + 1] : null;
};

/** The Windows addons that should be loadable on `arch`, flagging the rest. */
const windowsAddonsIn = (resources, arch) =>
	addons(resources)
		.filter((addon) => {
			const prebuild = prebuildTarget(addon);
			return prebuild === null || prebuild.startsWith('win32-');
		})
		.filter((addon) => {
			const prebuild = prebuildTarget(addon);
			if (prebuild === null || prebuild === `win32-${arch}`) return true;

			failures.push(`${addon}: a Windows prebuild for the wrong arch`);
			return false;
		});

const checkArch = (arch) => {
	if (!PE_MACHINE[arch]) {
		failures.push(`build.win.target names unknown arch "${arch}"`);
		return;
	}

	const unpacked = path.join(build.directories.output, unpackedDirFor(arch));
	if (!fs.existsSync(unpacked)) {
		failures.push(`${unpacked}: missing, so nothing was packaged for ${arch}`);
		return;
	}

	expectArch(path.join(unpacked, `${productName}.exe`), arch);

	// A cross-build can get the Electron shell right and still bundle the
	// host's native modules, which fails at runtime instead of at build.
	const resources = path.join(unpacked, 'resources');
	const found = fs.existsSync(resources)
		? windowsAddonsIn(resources, arch)
		: [];
	found.forEach((addon) => expectArch(addon, arch));

	// The global input hook is a native addon, so an app packaged without one
	// launches and then ignores every shortcut.
	if (found.length === 0)
		failures.push(`${unpacked}: no win32-${arch} native addon in the package`);
};

const archs = [...new Set(build.win.target.flatMap((t) => t.arch ?? []))];

if (archs.length === 0) {
	console.error(
		'build.win.target names no arch, so electron-builder would inherit the ' +
			'build host. Name it (see LAC-7453).',
	);
	process.exit(1);
}

archs.forEach(checkArch);

// An arch nobody asked for means the config and the output have drifted apart.
Object.keys(PE_MACHINE)
	.filter((arch) => !archs.includes(arch))
	.map((arch) => ({
		arch,
		dir: path.join(build.directories.output, unpackedDirFor(arch)),
	}))
	.filter(({ dir }) => fs.existsSync(dir))
	.forEach(({ arch, dir }) =>
		failures.push(`${dir}: packaged ${arch}, which no target asked for`),
	);

if (failures.length > 0) {
	console.error(
		`Windows payload arch check failed (expected ${archs.join(', ')}):`,
	);
	failures.forEach((failure) => console.error(`  ${failure}`));
	process.exit(1);
}

console.log(
	`Windows payload is ${archs.join(', ')}: ${checked.length} binaries checked`,
);
checked.forEach((file) => console.log(`  ${file}`));
