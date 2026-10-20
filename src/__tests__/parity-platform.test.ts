/**
 * @jest-environment node
 *
 * Regressions for the v3 features ported in LAC-5182 (platform batch).
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { mapCrosshairImage } from '../main/migrate-v3';

const setPath = jest.fn();
const disableHardwareAcceleration = jest.fn();
const appendSwitch = jest.fn();
const setPermissionRequestHandler = jest.fn();
const setPermissionCheckHandler = jest.fn();

let hasSwitchValue = false;
let readyResolve: () => void;
let readyPromise: Promise<void>;

jest.mock('electron', () => ({
	app: {
		setPath: (...args: unknown[]) => setPath(...args),
		disableHardwareAcceleration: () => disableHardwareAcceleration(),
		requestSingleInstanceLock: () => true,
		quit: jest.fn(),
		commandLine: {
			hasSwitch: () => hasSwitchValue,
			appendSwitch: (...args: unknown[]) => appendSwitch(...args),
		},
		whenReady: () => readyPromise,
	},
	session: {
		defaultSession: {
			setPermissionRequestHandler: (...args: unknown[]) =>
				setPermissionRequestHandler(...args),
			setPermissionCheckHandler: (...args: unknown[]) =>
				setPermissionCheckHandler(...args),
		},
	},
}));

jest.mock('electron-log', () => ({
	status: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

// electron-store resolves the real Electron binary at import time, which a unit
// test has no business launching. command-line-flags reaches it through
// store-actions, so a stub keeps the import graph loadable.
jest.mock('electron-store', () =>
	jest.fn().mockImplementation(() => ({
		get: jest.fn(() => ({})),
		set: jest.fn(),
		delete: jest.fn(),
		clear: jest.fn(),
	})),
);

const originalArgv = process.argv;
const originalEnv = process.env.CROSSOVER_RESET;
const originalPortableDir = process.env.PORTABLE_EXECUTABLE_DIR;

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	hasSwitchValue = false;
	process.argv = ['/bin/crossover'];
	delete process.env.CROSSOVER_RESET;
	delete process.env.PORTABLE_EXECUTABLE_DIR;
	readyPromise = new Promise<void>((resolve) => {
		readyResolve = resolve;
	});
});

afterAll(() => {
	process.argv = originalArgv;
	if (originalEnv === undefined) {
		delete process.env.CROSSOVER_RESET;
	} else {
		process.env.CROSSOVER_RESET = originalEnv;
	}
	if (originalPortableDir === undefined) {
		delete process.env.PORTABLE_EXECUTABLE_DIR;
	} else {
		process.env.PORTABLE_EXECUTABLE_DIR = originalPortableDir;
	}
});

// `crossover --reset` is the only way back when stored settings stop the app
// from launching (v3 6b5a1d2, #450/#486).
describe('isResetRequested', () => {
	const load = () =>
		// eslint-disable-next-line global-require
		require('../main/command-line-flags') as typeof import('../main/command-line-flags');

	it('is false on a normal launch', () => {
		expect(load().isResetRequested()).toBe(false);
	});

	it('reads the Chromium switch', () => {
		hasSwitchValue = true;
		expect(load().isResetRequested()).toBe(true);
	});

	it('reads the env var', () => {
		process.env.CROSSOVER_RESET = '1';
		expect(load().isResetRequested()).toBe(true);
	});

	// AppImage / Snap / Flatpak launchers can strip Chromium switches, so the
	// argv fallback is the one that actually fires on Linux.
	it.each(['--reset', '-reset', 'reset'])('reads %s from argv', (arg) => {
		process.argv = ['/bin/crossover', arg];
		expect(load().isResetRequested()).toBe(true);
	});

	it('forces safe GPU settings on a reset launch', () => {
		hasSwitchValue = true;
		load().default.initialize();

		expect(appendSwitch).toHaveBeenCalledWith('disable-gpu');
		expect(disableHardwareAcceleration).toHaveBeenCalled();
	});
});

// Portable builds have to keep their settings next to the exe, not in %APPDATA%
// (v3 04d6493, #521/#379).
describe('initPortablePaths', () => {
	const load = () =>
		// eslint-disable-next-line global-require
		require('../main/portable') as typeof import('../main/portable');

	it('does nothing for an installer build', () => {
		expect(load().initPortablePaths()).toBe(false);
		expect(setPath).not.toHaveBeenCalled();
	});

	it('redirects userData, logs and crashDumps next to the exe', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portable-'));
		process.env.PORTABLE_EXECUTABLE_DIR = dir;

		expect(load().initPortablePaths()).toBe(true);

		const data = path.join(dir, 'data');
		expect(setPath).toHaveBeenCalledWith('userData', data);
		expect(setPath).toHaveBeenCalledWith('logs', path.join(data, 'logs'));
		expect(setPath).toHaveBeenCalledWith(
			'crashDumps',
			path.join(data, 'crashDumps'),
		);
		expect(fs.existsSync(path.join(data, 'logs'))).toBe(true);

		fs.rmSync(dir, { recursive: true, force: true });
	});

	// The redirect only works if it runs before electron-store and electron-log
	// resolve userData, which they do at import time. Import statements evaluate
	// in source order, so main.ts has to require this module first. A future
	// import sort would silently break portable builds; this is the tripwire.
	it('is the first thing main.ts imports', () => {
		const main = fs.readFileSync(
			path.join(__dirname, '..', 'main', 'main.ts'),
			'utf8',
		);
		const firstImport = main
			.split('\n')
			.find((line) => line.trimStart().startsWith('import '));

		expect(firstImport).toContain('./portable');
	});

	it('falls back to the default paths when the folder is not writable', () => {
		// A portable copy on read-only media must still launch.
		process.env.PORTABLE_EXECUTABLE_DIR = path.join(
			path.sep,
			'proc',
			'self',
			'no-such-place',
		);

		// The fallback logs to console on purpose; don't spill it into the report.
		const consoleError = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});

		expect(load().initPortablePaths()).toBe(false);
		expect(setPath).not.toHaveBeenCalled();
		expect(consoleError).toHaveBeenCalled();

		consoleError.mockRestore();
	});
});

// Electron forwards permission requests to the OS without a handler, which is
// what showed a Windows location prompt (#471). Reading session.defaultSession
// before ready crashes the main process, which is what broke 3.4.x (#529).
describe('session permissions', () => {
	const load = () =>
		// eslint-disable-next-line global-require
		require('../main/session-permissions') as typeof import('../main/session-permissions');

	it('waits for the ready event before touching the session', async () => {
		const pending = load().initialize();
		expect(setPermissionRequestHandler).not.toHaveBeenCalled();

		readyResolve();
		await pending;

		expect(setPermissionRequestHandler).toHaveBeenCalled();
		expect(setPermissionCheckHandler).toHaveBeenCalled();
	});

	it('denies every request', async () => {
		const pending = load().initialize();
		readyResolve();
		await pending;

		const handler = setPermissionRequestHandler.mock.calls[0][0] as (
			contents: unknown,
			permission: string,
			callback: (granted: boolean) => void,
		) => void;
		const callback = jest.fn();
		handler({}, 'geolocation', callback);

		expect(callback).toHaveBeenCalledWith(false);
		expect(setPermissionCheckHandler.mock.calls[0][0]()).toBe(false);
	});
});

// A conflict makes globalShortcut.register() return false rather than throw, so
// the old try/catch never saw one and the keybind silently did nothing (#516).
describe('shortcut conflict notification', () => {
	it('names the combos and where to change them', () => {
		// eslint-disable-next-line global-require
		const { $notifications } = require('../config/strings');
		const message = $notifications.shortcutConflict(['Control+Shift+Alt+X']);

		expect(message.title).toBeTruthy();
		expect(message.body).toContain('Control+Shift+Alt+X');
		expect(message.body).toContain('Settings');
	});
});

// v3 ships the Kenney set as SVG. v4 shipped the older PNGs, so a v3 user's
// Kenney crosshair resolved to a file v4 didn't have and the import dropped it.
describe('Kenney crosshairs resolve on import from v3', () => {
	const crosshairsDir = path.join(
		__dirname,
		'..',
		'..',
		'assets',
		'crosshairs',
	);

	it('maps a v3 Kenney SVG to a bundled v4 file', () => {
		const result = mapCrosshairImage('../static/crosshairs/Kenney/0-0.svg', {
			crosshairsDir,
			fileExists: fs.existsSync,
		});

		expect(result).toEqual({
			image: path.join(crosshairsDir, 'Kenney', '0-0.svg'),
			custom: false,
		});
	});

	it('bundles the SVG demo crosshair v3 ships', () => {
		expect(
			fs.existsSync(path.join(crosshairsDir, 'SVG', 'circle-demo.svg')),
		).toBe(true);
	});
});
