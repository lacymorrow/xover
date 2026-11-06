/**
 * @jest-environment node
 *
 * Regression for LAC-7272: v4 asked Windows for topmost exactly once.
 *
 * `create-window.ts` calls `setAlwaysOnTop(true, 'screen-saver', 1)` at window
 * creation and never again. On Windows that single call is one
 * `SetWindowPos(HWND_TOPMOST)`, and the topmost band is itself z-ordered by who
 * asserted last. So anything that asserts topmost after us -- a game's own
 * overlay, a launcher, an anti-cheat splash, or the shell after a resolution or
 * scaling change -- sits above the crosshair from then on, permanently, because
 * we never ask again.
 *
 * The LAC-5181 prototype that re-applied HWND_TOPMOST once a second stayed
 * visible in all five fullscreen games tested on otto, including the Vulkan
 * title behind GH #416. That probe was mislabelled "what v4 does today", which
 * is what sent pass 1 chasing UIAccess and Game Bar. The guard under test here
 * is what that probe actually did.
 *
 * It re-asserts on a 1s tick and on every display change, Windows only, and
 * holds off while one of our own windows has focus: Settings asks for
 * screen-saver level 2 so it is never hidden behind a crosshair, and Windows
 * ignores the level argument and keeps one flat topmost band, so re-asserting
 * under a focused Settings would bury it.
 */

// Keeps this file a module, so its helpers do not land in the global scope and
// collide with the same names in another suite (ts-jest type-checks the whole
// program, and `shortcut-targets.test.ts` also has a `makeWindow`).
export {};

type WindowStub = {
	id: string;
	visible: boolean;
	destroyed: boolean;
	isVisible: () => boolean;
	isDestroyed: () => boolean;
	setAlwaysOnTop: jest.Mock;
};

const makeWindow = (
	id: string,
	{ visible = true, destroyed = false } = {},
): WindowStub => {
	const stub: WindowStub = {
		id,
		visible,
		destroyed,
		isVisible: () => stub.visible,
		isDestroyed: () => stub.destroyed,
		setAlwaysOnTop: jest.fn(),
	};

	return stub;
};

let allWindows: WindowStub[] = [];
let focusedWindow: WindowStub | null = null;
let screenHandlers: Record<string, Array<() => void>> = {};

const originalPlatform = process.platform;

jest.mock('electron', () => ({
	app: {
		name: 'CrossOver',
		on: jest.fn(),
		dock: { hide: jest.fn() },
		releaseSingleInstanceLock: jest.fn(),
		getPath: jest.fn(() => '/tmp'),
	},
	shell: { openExternal: jest.fn() },
	BrowserWindow: {
		getAllWindows: () => allWindows,
		getFocusedWindow: () => focusedWindow,
	},
	screen: {
		getPrimaryDisplay: () => ({
			bounds: { x: 0, y: 0, width: 1920, height: 1080 },
			workArea: { x: 0, y: 0, width: 1920, height: 1040 },
		}),
		getAllDisplays: () => [],
		on: (event: string, handler: () => void) => {
			screenHandlers[event] = [...(screenHandlers[event] ?? []), handler];
		},
		removeListener: (event: string, handler: () => void) => {
			screenHandlers[event] = (screenHandlers[event] ?? []).filter(
				(entry) => entry !== handler,
			);
		},
	},
}));

jest.mock('electron-log', () => ({
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	status: jest.fn(),
}));

/** Load the guard fresh, with `is.windows` decided by `platform`. */
const loadGuard = (platform: string = 'win32') => {
	Object.defineProperty(process, 'platform', {
		value: platform,
		configurable: true,
	});
	jest.resetModules();

	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	const guard = require('../main/utils/always-on-top');
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	const windows = require('../main/windows').default;

	return { guard, windows };
};

const fire = (event: string) => {
	(screenHandlers[event] ?? []).forEach((handler) => handler());
};

const topmostCalls = (window: WindowStub) =>
	window.setAlwaysOnTop.mock.calls.filter(
		([flag, level, relative]) =>
			flag === true && level === 'screen-saver' && relative === 1,
	).length;

beforeEach(() => {
	jest.useFakeTimers();
	allWindows = [];
	focusedWindow = null;
	screenHandlers = {};
});

afterEach(() => {
	jest.useRealTimers();
	Object.defineProperty(process, 'platform', {
		value: originalPlatform,
		configurable: true,
	});
});

describe('always-on-top guard', () => {
	it('puts every visible crosshair back on top once a second', () => {
		const main = makeWindow('main');
		const duplicate = makeWindow('duplicate');
		allWindows = [main, duplicate];

		const { guard } = loadGuard();
		guard.startAlwaysOnTopGuard();

		expect(topmostCalls(main)).toBe(0);

		jest.advanceTimersByTime(guard.REASSERT_INTERVAL_MS);
		expect(topmostCalls(main)).toBe(1);
		expect(topmostCalls(duplicate)).toBe(1);

		jest.advanceTimersByTime(guard.REASSERT_INTERVAL_MS * 3);
		expect(topmostCalls(main)).toBe(4);
		expect(topmostCalls(duplicate)).toBe(4);

		guard.stopAlwaysOnTopGuard();
	});

	it('leaves the settings window alone', () => {
		const main = makeWindow('main');
		const settings = makeWindow('settings');
		allWindows = [main, settings];

		const { guard, windows } = loadGuard();
		windows.settingsWindow = settings;
		guard.startAlwaysOnTopGuard();

		jest.advanceTimersByTime(guard.REASSERT_INTERVAL_MS);

		expect(topmostCalls(main)).toBe(1);
		expect(settings.setAlwaysOnTop).not.toHaveBeenCalled();

		guard.stopAlwaysOnTopGuard();
	});

	it('skips a hidden or destroyed crosshair', () => {
		const hidden = makeWindow('hidden', { visible: false });
		const destroyed = makeWindow('destroyed', { destroyed: true });
		allWindows = [hidden, destroyed];

		const { guard } = loadGuard();
		guard.startAlwaysOnTopGuard();

		jest.advanceTimersByTime(guard.REASSERT_INTERVAL_MS * 2);

		expect(hidden.setAlwaysOnTop).not.toHaveBeenCalled();
		expect(destroyed.setAlwaysOnTop).not.toHaveBeenCalled();

		guard.stopAlwaysOnTopGuard();
	});

	it('holds off while one of our own windows has focus', () => {
		const main = makeWindow('main');
		const settings = makeWindow('settings');
		allWindows = [main, settings];

		const { guard, windows } = loadGuard();
		windows.settingsWindow = settings;
		focusedWindow = settings;
		guard.startAlwaysOnTopGuard();

		jest.advanceTimersByTime(guard.REASSERT_INTERVAL_MS * 2);
		expect(topmostCalls(main)).toBe(0);

		// Click back into the game and the guard resumes
		focusedWindow = null;
		jest.advanceTimersByTime(guard.REASSERT_INTERVAL_MS);
		expect(topmostCalls(main)).toBe(1);

		guard.stopAlwaysOnTopGuard();
	});

	it('re-asserts on a display change without waiting for the tick', () => {
		const main = makeWindow('main');
		allWindows = [main];

		const { guard } = loadGuard();
		guard.startAlwaysOnTopGuard();

		fire('display-metrics-changed');
		expect(topmostCalls(main)).toBe(1);

		fire('display-added');
		fire('display-removed');
		expect(topmostCalls(main)).toBe(3);

		guard.stopAlwaysOnTopGuard();
	});

	it('does nothing off Windows, where the window keeps the level we set', () => {
		const main = makeWindow('main');
		allWindows = [main];

		const { guard } = loadGuard('darwin');
		guard.startAlwaysOnTopGuard();

		jest.advanceTimersByTime(guard.REASSERT_INTERVAL_MS * 5);
		fire('display-metrics-changed');

		expect(main.setAlwaysOnTop).not.toHaveBeenCalled();
		expect(screenHandlers['display-metrics-changed'] ?? []).toHaveLength(0);
	});

	it('starts at most one tick, however many times it is started', () => {
		const main = makeWindow('main');
		allWindows = [main];

		const { guard } = loadGuard();
		guard.startAlwaysOnTopGuard();
		guard.startAlwaysOnTopGuard();
		guard.startAlwaysOnTopGuard();

		jest.advanceTimersByTime(guard.REASSERT_INTERVAL_MS);
		expect(topmostCalls(main)).toBe(1);
		expect(screenHandlers['display-metrics-changed']).toHaveLength(1);

		guard.stopAlwaysOnTopGuard();
	});

	it('stop drops the tick and the display listeners', () => {
		const main = makeWindow('main');
		allWindows = [main];

		const { guard } = loadGuard();
		guard.startAlwaysOnTopGuard();
		guard.stopAlwaysOnTopGuard();

		jest.advanceTimersByTime(guard.REASSERT_INTERVAL_MS * 5);
		fire('display-metrics-changed');

		expect(main.setAlwaysOnTop).not.toHaveBeenCalled();
		expect(screenHandlers['display-metrics-changed'] ?? []).toHaveLength(0);

		// And it can be started again afterwards
		guard.startAlwaysOnTopGuard();
		jest.advanceTimersByTime(guard.REASSERT_INTERVAL_MS);
		expect(topmostCalls(main)).toBe(1);
		guard.stopAlwaysOnTopGuard();
	});
});

describe('app wiring', () => {
	it('starts the guard when the app is ready and stops it on quit', () => {
		Object.defineProperty(process, 'platform', {
			value: 'win32',
			configurable: true,
		});
		jest.resetModules();

		const start = jest.fn();
		const stop = jest.fn();

		jest.doMock('../main/utils/always-on-top', () => ({
			startAlwaysOnTopGuard: start,
			stopAlwaysOnTopGuard: stop,
			reassertAlwaysOnTop: jest.fn(),
			REASSERT_INTERVAL_MS: 1000,
		}));
		jest.doMock('../main/create-window', () => ({
			createCrosshairWindow: jest.fn(),
		}));
		jest.doMock('../main/iohook', () => ({ stopIOHook: jest.fn() }));
		jest.doMock('../main/keyboard', () => ({
			__esModule: true,
			default: { unregisterAll: jest.fn() },
		}));
		jest.doMock('../main/utils/window-closed', () => ({
			windowClosed: jest.fn(),
		}));
		jest.doMock('../main/utils/settingsWindow', () => ({
			showApp: jest.fn(),
			closeSettingsWindow: jest.fn(),
		}));

		// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
		const appListeners = require('../main/app-listeners').default;
		// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
		const { app } = require('electron');

		appListeners.register();
		expect(start).not.toHaveBeenCalled();

		appListeners.ready();
		expect(start).toHaveBeenCalledTimes(1);

		const willQuit = (app.on as jest.Mock).mock.calls.find(
			([event]: [string]) => event === 'will-quit',
		);
		expect(willQuit).toBeDefined();
		willQuit[1]();
		expect(stop).toHaveBeenCalled();
	});
});
