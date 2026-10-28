/**
 * @jest-environment node
 *
 * Reset means back to defaults, and the default position is centered. It also
 * has to be the same reset from all three entry points: the tray and Settings >
 * Advanced used to call resetStoreSettings() directly, which skips the sound,
 * the image rescan and the transient state (LAC-5839 item 3).
 */
import { DEFAULT_SETTINGS, SettingsType } from '../config/settings';

const centerWindow = jest.fn();
const resetStoreSettings = jest.fn();
const setSettings = jest.fn();
const setActionStateKey = jest.fn();
const scanImages = jest.fn();
const play = jest.fn();

const display = { workArea: { x: 0, y: 0, width: 1920, height: 1080 } };
const crosshairA = {
	id: 2,
	isDestroyed: () => false,
	getBounds: () => ({ x: 10, y: 20, width: 200, height: 130 }),
};
const crosshairB = {
	id: 3,
	isDestroyed: () => false,
	getBounds: () => ({ x: 3000, y: 20, width: 200, height: 130 }),
};

let settings: SettingsType = { ...DEFAULT_SETTINGS };
let crosshairs: any[] = [];

jest.mock('electron', () => ({
	app: { getVersion: () => '4.0.0-beta.6' },
	screen: { getDisplayNearestPoint: () => display },
}));

jest.mock('electron-log', () => ({
	status: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

jest.mock('../main/command-line-flags', () => ({
	isResetRequested: () => false,
}));

jest.mock('../main/sounds', () => ({
	__esModule: true,
	default: { play: (...args: unknown[]) => play(...args) },
}));

jest.mock('../main/utils/getImages', () => ({ scanImages }));

jest.mock('../main/store-actions', () => ({
	getSettings: () => settings,
	resetStore: jest.fn(),
	resetStoreSettings: () => resetStoreSettings(),
	setActionStateKey: (...args: unknown[]) => setActionStateKey(...args),
	setSettings: (...args: unknown[]) => setSettings(...args),
}));

jest.mock('../main/utils/window-utils', () => ({
	centerWindow: (...args: unknown[]) => centerWindow(...args),
	forEachCrosshairWindow: (cb: (win: any) => void) => crosshairs.forEach(cb),
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	settings = { ...DEFAULT_SETTINGS };
	crosshairs = [crosshairA, crosshairB];
});

describe('resetSettings', () => {
	it('re-centers every crosshair window on the display it is on', () => {
		// eslint-disable-next-line global-require
		require('../main/reset').resetSettings();

		expect(centerWindow).toHaveBeenCalledTimes(2);
		expect(centerWindow).toHaveBeenCalledWith({
			window: crosshairA,
			display,
			animated: true,
		});
		expect(centerWindow).toHaveBeenCalledWith({
			window: crosshairB,
			display,
			animated: true,
		});
	});

	it('wipes the stored settings, plays the sound and rescans images', () => {
		// eslint-disable-next-line global-require
		require('../main/reset').resetSettings();

		expect(resetStoreSettings).toHaveBeenCalled();
		expect(play).toHaveBeenCalledWith('RESET');
		expect(scanImages).toHaveBeenCalled();
	});

	it('clears the transient state a reset should not keep', () => {
		// eslint-disable-next-line global-require
		require('../main/reset').resetSettings();

		expect(setSettings).toHaveBeenCalledWith(
			expect.objectContaining({
				isHidden: false,
				isReticleHidden: false,
				currentTilt: 0,
				isLocked: false,
			}),
		);
	});

	// refreshSettingsOnAppStart() used to end with `windows.crosshairWindows =
	// {}`. A no-op at startup, where it runs before any window exists, and a way
	// to lose track of every live crosshair window when a reset called it.
	it('keeps the crosshair window registry', () => {
		// eslint-disable-next-line global-require
		const windows = require('../main/windows').default;
		windows.crosshairWindows = { abc: crosshairA };

		// eslint-disable-next-line global-require
		require('../main/reset').resetSettings();

		expect(windows.crosshairWindows).toEqual({ abc: crosshairA });
	});
});
