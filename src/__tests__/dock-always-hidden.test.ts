/**
 * @jest-environment node
 *
 * The dock icon is not a setting any more (LAC-5725).
 *
 * Hiding the dock is a TransformProcessType to UIElement, and that transform is
 * what lets the crosshair float over another app's fullscreen Space. But
 * `macos-fullscreen.test.ts` pins the part that actually matters: the transform
 * only has to happen before `new BrowserWindow`, and restoring the icon
 * afterwards does not cost the float.
 *
 * So removing the setting is not a correctness fix, and it is not v3 parity
 * either: v3 shows the icon while the crosshair is unlocked and hides it once
 * locked. It is one fewer setting, decided at LAC-5749. These cases exist to
 * make the decision hold once it is made rather than to defend it.
 *
 * These cases pin the three ways the setting could come back: a stale value in
 * an upgraded store, the unhide path putting the icon back, and the setting
 * itself being redeclared.
 */
const dockShow = jest.fn();
const dockHide = jest.fn();

jest.mock('electron', () => ({
	app: {
		name: 'CrossOver',
		dock: { show: dockShow, hide: dockHide, setBadge: jest.fn() },
	},
}));

jest.mock('../main/util', () => ({ is: { macos: true } }));

jest.mock('electron-log', () => ({
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	status: jest.fn(),
}));

// An upgraded user still has showDockIcon: true sitting in config.json. Nothing
// is allowed to read it back out and re-show the icon.
const staleSettings: Record<string, unknown> = {
	showDockIcon: true,
	isSettingsWindowOpen: false,
	isHidden: false,
};

jest.mock('../main/store-actions', () => ({
	getSetting: (key: string) => staleSettings[key],
	getSettings: () => staleSettings,
	setSettings: jest.fn(),
}));

jest.mock('../main/windows', () => ({
	__esModule: true,
	default: { mainWindow: undefined, settingsWindow: undefined },
}));

jest.mock('../main/utils/window-utils', () => ({
	forEachWindow: jest.fn(),
}));

beforeEach(() => {
	jest.clearAllMocks();
});

it('hides the dock on initialize even when a stale showDockIcon survives the upgrade', () => {
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	const dock = require('../main/dock').default;

	dock.initialize();

	expect(dockHide).toHaveBeenCalled();
	expect(dockShow).not.toHaveBeenCalled();
});

it('leaves the dock hidden when the app is unhidden', () => {
	// setAppHide(false) used to restore the icon for anyone with the setting on.
	// With the dock always hidden there is nothing to restore, and restoring it
	// would transform the process back mid-session.
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	const { setAppHide } = require('../main/utils/hideApp');

	setAppHide(false);

	expect(dockShow).not.toHaveBeenCalled();
});

it('no longer declares showDockIcon as a setting', () => {
	// The store schema, the menu checkbox and the Settings switch all hang off
	// this key. If it comes back, so does the trap.
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	const { DEFAULT_SETTINGS } = require('../config/settings');

	expect('showDockIcon' in DEFAULT_SETTINGS).toBe(false);
});
