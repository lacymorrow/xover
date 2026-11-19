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
 *
 * The classification lives in `win-payload.js` so `npm test` can cover it
 * without a build (LAC-8625).
 */

import fs from 'fs';
import path from 'path';
import { build, productName } from '../../package.json';
import {
	PE_MACHINE,
	classifyAddons,
	machineName,
	peMachine,
} from './win-payload';

// electron-builder names the x64 output dir `win-unpacked` and every other
// arch `win-<arch>-unpacked`.
const unpackedDirFor = (arch) =>
	arch === 'x64' ? 'win-unpacked' : `win-${arch}-unpacked`;

const failures = [];
const checked = [];

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
	const payload = fs.existsSync(resources)
		? classifyAddons(resources, arch)
		: { load: [], failures: [] };

	failures.push(...payload.failures);
	payload.load.forEach((addon) => expectArch(addon, arch));

	// The global input hook is a native addon, so an app packaged without one
	// launches and then ignores every shortcut.
	if (payload.load.length === 0)
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
