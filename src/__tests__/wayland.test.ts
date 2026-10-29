/**
 * @jest-environment node
 *
 * Regressions for GH #456: shortcuts registered without error on KDE Plasma
 * Wayland and then never fired, because a native Wayland compositor refuses the
 * X11 input grab `globalShortcut` needs. Ported from v3 #571 (the notice) and
 * #577 (the relaunch).
 *
 * These tests read the backend off a faked command line, the way the module
 * does, because Chromium has already locked its backend in by the time our main
 * script runs. Appending a switch at that point is a no-op, so every case also
 * asserts that we never append one.
 *
 * Every case also records whether the relaunch fired, since firing it in the
 * wrong session is worse than the bug it fixes.
 */

interface Harness {
	appended: string[];
	backend: string | null;
	blocked: string | null;
	debugInfo: string;
	exits: number[];
	relaunchArgs: string[] | null;
	relaunched: boolean;
	relaunchedAgain: boolean;
	relaunches: number;
	usingX11: boolean;
	wayland: boolean;
}

interface Session {
	argv?: string[];
	electron?: string;
	platform?: string;
	/** `undefined` is a store written before the setting existed. */
	relaunchSetting?: boolean | undefined;
	switchesStripped?: boolean;
}

let switches: Record<string, string> = {};
const appended: string[] = [];
const relaunches: { args: string[] }[] = [];
const exits: number[] = [];
let relaunchSetting: boolean | undefined = true;

jest.mock('electron', () => ({
	app: {
		commandLine: {
			hasSwitch: (key: string) => key in switches,
			getSwitchValue: (key: string) => switches[key] ?? '',
			appendSwitch: (key: string, value?: string) => {
				switches[key] = value ?? '';
				appended.push(value === undefined ? `--${key}` : `--${key}=${value}`);
			},
		},
		relaunch: (options: { args: string[] }) => {
			relaunches.push(options);
		},
		exit: (code: number) => {
			exits.push(code);
		},
	},
}));

jest.mock('electron-log', () => ({
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	status: jest.fn(),
}));

jest.mock('../main/store-actions', () => ({
	getSetting: (key: string) =>
		key === 'relaunchOnX11' ? relaunchSetting : undefined,
}));

const SESSION_VARS = [
	'XDG_SESSION_TYPE',
	'WAYLAND_DISPLAY',
	'DISPLAY',
	'ELECTRON_OZONE_PLATFORM_HINT',
	'CROSSOVER_RELAUNCHED_X11',
];

const WAYLAND_WITH_XWAYLAND = {
	XDG_SESSION_TYPE: 'wayland',
	WAYLAND_DISPLAY: 'wayland-0',
	DISPLAY: ':0',
};
const WAYLAND_NO_XWAYLAND = {
	XDG_SESSION_TYPE: 'wayland',
	WAYLAND_DISPLAY: 'wayland-0',
};
const X11_SESSION = { XDG_SESSION_TYPE: 'x11', DISPLAY: ':0' };

// What v4 ships.
const ELECTRON_40 = '40.0.0';
// A distro repackage against a system Electron old enough to have no Ozone. The
// #456 reporter runs exactly this kind of build, which is why the version gates
// are live code rather than decoration.
const ELECTRON_14 = '14.2.9';

const savedEnv = { ...process.env };
const savedArgv = process.argv;
const savedPlatform = process.platform;
const savedElectron = process.versions.electron;

const setPlatform = (platform: string) => {
	Object.defineProperty(process, 'platform', {
		value: platform,
		configurable: true,
	});
};

const setElectron = (version: string | undefined) => {
	if (version === undefined) {
		delete (process.versions as Record<string, unknown>).electron;
		return;
	}

	Object.defineProperty(process.versions, 'electron', {
		value: version,
		configurable: true,
		enumerable: true,
		writable: true,
	});
};

/**
 * Load wayland.ts against a faked session and report every decision it made.
 *
 * `argv` becomes the process command line, parsed into switches the same way
 * Chromium parses it, so `app.commandLine` answers about real arguments rather
 * than ones the module appended. `switchesStripped` is the AppImage/Snap/Flatpak
 * case `command-line-flags.ts` already works around for `--reset`: the arguments
 * reach argv but never reach Chromium.
 */
const inSession = (
	env: Record<string, string>,
	{
		argv = [],
		electron = ELECTRON_40,
		platform = 'linux',
		relaunchSetting: relaunchOnX11 = true,
		switchesStripped = false,
	}: Session = {},
): Harness => {
	switches = {};
	if (!switchesStripped) {
		argv.forEach((argument) => {
			const [key, value] = argument.replace(/^--/, '').split('=');
			switches[key] = value ?? '';
		});
	}

	appended.length = 0;
	relaunches.length = 0;
	exits.length = 0;
	relaunchSetting = relaunchOnX11;

	process.argv = ['electron', ...argv];
	setPlatform(platform);
	setElectron(electron);

	SESSION_VARS.forEach((key) => {
		delete process.env[key];
	});
	Object.assign(process.env, env);

	jest.resetModules();
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	const wayland = require('../main/wayland').default;

	const state = wayland.detect();
	const relaunched = wayland.relaunchOnX11();
	// Called twice on purpose: no session may ever relaunch more than once.
	const relaunchedAgain = wayland.relaunchOnX11();

	return {
		appended: [...appended],
		backend: state.backend,
		blocked: wayland.shortcutsBlockedReason(),
		debugInfo: wayland.debugInfo(),
		exits: [...exits],
		relaunchArgs: relaunches[0]?.args ?? null,
		relaunched,
		relaunchedAgain,
		relaunches: relaunches.length,
		usingX11: state.usingX11,
		wayland: state.wayland,
	};
};

afterEach(() => {
	process.argv = savedArgv;
	setPlatform(savedPlatform);
	setElectron(savedElectron);
	Object.keys(process.env).forEach((key) => {
		delete process.env[key];
	});
	Object.assign(process.env, savedEnv);
});

describe('detect', () => {
	it('lets a Wayland session on the X11 backend grab hotkeys', () => {
		const result = inSession(WAYLAND_WITH_XWAYLAND, {
			argv: ['--ozone-platform=x11'],
		});

		expect(result.wayland).toBe(true);
		expect(result.backend).toBe('x11');
		expect(result.usingX11).toBe(true);
		expect(result.blocked).toBeNull();
		expect(result.appended).toEqual([]);
	});

	it('says hotkeys need an X server when none is reachable', () => {
		const result = inSession(WAYLAND_NO_XWAYLAND, {
			argv: ['--ozone-platform=x11'],
		});

		expect(result.backend).toBe('x11');
		expect(result.usingX11).toBe(false);
		expect(result.blocked).toContain('X server');
		expect(result.appended).toEqual([]);
	});

	it('defaults to the Wayland backend in a Wayland session', () => {
		// From Electron 38 `--ozone-platform` defaults to `auto`, which takes
		// Wayland in a Wayland session. That is v4's own Linux build with no flags
		// at all, and every shortcut dies silently on it.
		const result = inSession(WAYLAND_WITH_XWAYLAND);

		expect(result.backend).toBe('wayland');
		expect(result.usingX11).toBe(false);
		expect(result.blocked).toContain('--ozone-platform=x11');
		expect(result.debugInfo).toContain('cannot be grabbed here');
	});

	it('ignores an ozone switch the running Electron cannot honor', () => {
		// Without UseOzonePlatform, an Electron with no Ozone stays on the legacy
		// X11 backend and hotkeys keep working, so there is nothing to warn about.
		const result = inSession(WAYLAND_WITH_XWAYLAND, {
			electron: ELECTRON_14,
			argv: ['--ozone-platform=wayland'],
		});

		expect(result.backend).toBe('x11');
		expect(result.blocked).toBeNull();
	});

	it('reads ELECTRON_OZONE_PLATFORM_HINT only where Electron honors it', () => {
		const env = {
			...WAYLAND_WITH_XWAYLAND,
			ELECTRON_OZONE_PLATFORM_HINT: 'wayland',
		};

		// The hint landed in Electron 27. An older build ignores it, so reading it
		// there would name a backend we are not on.
		expect(inSession(env, { electron: ELECTRON_14 }).blocked).toBeNull();

		const honored = inSession(env);
		expect(honored.backend).toBe('wayland');
		expect(honored.blocked).toContain('--ozone-platform=x11');
	});

	it('clears the verdict once the documented workaround is in place', () => {
		const fixed = inSession(WAYLAND_WITH_XWAYLAND, {
			argv: ['--ozone-platform=x11'],
		});

		expect(fixed.usingX11).toBe(true);
		expect(fixed.blocked).toBeNull();
	});

	it('leaves X11 sessions alone', () => {
		const result = inSession(X11_SESSION);

		expect(result.wayland).toBe(false);
		expect(result.blocked).toBeNull();
		expect(result.appended).toEqual([]);
	});

	it('does not touch macOS or Windows', () => {
		['darwin', 'win32'].forEach((platform) => {
			const result = inSession(WAYLAND_WITH_XWAYLAND, { platform });

			expect(result.wayland).toBe(false);
			expect(result.blocked).toBeNull();
			expect(result.appended).toEqual([]);
		});
	});

	it('recomputes every field on a module that is already loaded', () => {
		// Shortcuts re-register on every rebind and every lock toggle, so detect()
		// runs more than once. The second verdict must not inherit the first.
		process.argv = ['electron'];
		switches = {};
		setPlatform('linux');
		setElectron(ELECTRON_40);
		jest.resetModules();
		// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
		const wayland = require('../main/wayland').default;

		const session = (env: Record<string, string>) => {
			SESSION_VARS.forEach((key) => {
				delete process.env[key];
			});
			Object.assign(process.env, env);
			wayland.detect();
			return wayland.shortcutsBlockedReason();
		};

		expect(session(WAYLAND_WITH_XWAYLAND)).toContain('--ozone-platform=x11');
		expect(session(X11_SESSION)).toBeNull();
		expect(session(WAYLAND_WITH_XWAYLAND)).toContain('--ozone-platform=x11');
	});

	it('keeps both reasons short enough for a notification body', () => {
		// OS notifications truncate. This is the text the user actually reads.
		// One case per reason: no X server to move to, and a native Wayland
		// backend with one.
		const blockedSessions: Session[] = [{ argv: ['--ozone-platform=x11'] }, {}];
		const envs = [WAYLAND_NO_XWAYLAND, WAYLAND_WITH_XWAYLAND];

		envs.forEach((env, index) => {
			const result = inSession(env, blockedSessions[index]);

			expect(result.blocked).not.toBeNull();
			expect((result.blocked as string).length).toBeLessThan(110);
		});
	});
});

describe('relaunchOnX11', () => {
	it('relaunches a native Wayland backend onto Ozone/X11', () => {
		// v4's own Linux build: Electron 40, no flags, XWayland present.
		const result = inSession(WAYLAND_WITH_XWAYLAND, {
			argv: ['--some-user-flag'],
		});

		expect(result.backend).toBe('wayland');
		expect(result.relaunched).toBe(true);
		expect(result.relaunches).toBe(1);
		expect(result.exits).toEqual([0]);

		// The user's own arguments survive, and the backend arrives on the new one.
		expect(result.relaunchArgs).toEqual([
			'--some-user-flag',
			'--enable-features=UseOzonePlatform',
			'--ozone-platform=x11',
		]);

		// This process is being replaced, not fixed: appendSwitch stays a no-op.
		expect(result.appended).toEqual([]);

		// And it never fires a second time in the same process.
		expect(result.relaunchedAgain).toBe(false);
	});

	it('keeps features the user already asked for', () => {
		// Chromium keeps only the last copy of a switch, so --enable-features has
		// to be merged. Overwriting it would silently drop whatever was there.
		const result = inSession(WAYLAND_WITH_XWAYLAND, {
			argv: ['--enable-features=WaylandWindowDecorations'],
		});

		expect(result.relaunched).toBe(true);
		expect(result.relaunchArgs).toEqual([
			'--enable-features=WaylandWindowDecorations,UseOzonePlatform',
			'--ozone-platform=x11',
		]);
	});

	it('never moves a build whose Electron has no Ozone', () => {
		// A repackage against an Electron where Ozone/X11 was still experimental
		// is the surface #450's black-overlay reports live on. Leave it be.
		const onWaylandBackend = inSession(WAYLAND_WITH_XWAYLAND, {
			electron: ELECTRON_14,
			argv: ['--enable-features=UseOzonePlatform', '--ozone-platform=wayland'],
		});

		expect(onWaylandBackend.backend).toBe('wayland');
		expect(onWaylandBackend.relaunched).toBe(false);
		expect(onWaylandBackend.relaunches).toBe(0);
		expect(onWaylandBackend.exits).toEqual([]);
	});

	it('leaves sessions that already work where they are', () => {
		// An X11 session is never on the wayland backend, so it is never moved.
		expect(inSession(X11_SESSION).relaunched).toBe(false);

		// Neither is a Wayland session already running through XWayland.
		const viaXWayland = inSession(WAYLAND_WITH_XWAYLAND, {
			argv: ['--ozone-platform=x11'],
		});
		expect(viaXWayland.usingX11).toBe(true);
		expect(viaXWayland.relaunched).toBe(false);

		// macOS and Windows have no backend to switch.
		['darwin', 'win32'].forEach((platform) => {
			const result = inSession(WAYLAND_WITH_XWAYLAND, { platform });
			expect(result.relaunched).toBe(false);
			expect(result.exits).toEqual([]);
		});
	});

	it('does not relaunch without an X server, and leaves the notice standing', () => {
		// Relaunching into x11 with no X server trades missing hotkeys for a window
		// that never appears.
		const result = inSession(WAYLAND_NO_XWAYLAND);

		expect(result.relaunched).toBe(false);
		expect(result.exits).toEqual([]);
		expect(result.backend).toBe('wayland');
		expect(result.blocked).toContain('--ozone-platform=x11');
	});

	it('honors an explicit --ozone-platform=wayland', () => {
		// Someone asked for this backend, possibly for the transparency in #450.
		// Leave them on it; the notice says what it costs.
		const result = inSession(WAYLAND_WITH_XWAYLAND, {
			argv: ['--ozone-platform=wayland'],
		});

		expect(result.backend).toBe('wayland');
		expect(result.relaunched).toBe(false);
		expect(result.blocked).toContain('--ozone-platform=x11');
	});

	it('does not loop when the relaunch did not take effect', () => {
		// Guard one: the env var we set on the process we spawn.
		const guarded = inSession({
			...WAYLAND_WITH_XWAYLAND,
			CROSSOVER_RELAUNCHED_X11: '1',
		});
		expect(guarded.backend).toBe('wayland');
		expect(guarded.relaunched).toBe(false);
		expect(guarded.exits).toEqual([]);

		// Guard two: our own switch sitting in argv on a launcher that strips
		// arguments before Chromium parses them, where the env var may not survive
		// either.
		const stripped = inSession(WAYLAND_WITH_XWAYLAND, {
			argv: ['--enable-features=UseOzonePlatform', '--ozone-platform=x11'],
			switchesStripped: true,
		});
		expect(stripped.backend).toBe('wayland');
		expect(stripped.relaunched).toBe(false);
		expect(stripped.exits).toEqual([]);
	});

	it('still relaunches for a store written before the setting existed', () => {
		// electron-store's schema default only fires when `settings` is missing
		// altogether, so an upgraded config has no key here. Reading that as off
		// would leave every existing Linux user with the bug.
		const result = inSession(WAYLAND_WITH_XWAYLAND, {
			relaunchSetting: undefined,
		});

		expect(result.relaunched).toBe(true);
		expect(result.exits).toEqual([0]);
	});

	it('stays on Wayland when the setting is off', () => {
		// v4's escape hatch, which v3 did not need: v3 is Electron 14, so its users
		// could never reach this code. Overlay transparency after the backend
		// switch is unverified, so the user keeps a way to refuse it.
		const result = inSession(WAYLAND_WITH_XWAYLAND, {
			relaunchSetting: false,
		});

		expect(result.backend).toBe('wayland');
		expect(result.relaunched).toBe(false);
		expect(result.exits).toEqual([]);

		// And the notice from #571 stands, so the user is not left guessing.
		expect(result.blocked).toContain('--ozone-platform=x11');
	});
});
