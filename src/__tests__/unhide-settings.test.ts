/**
 * @jest-environment node
 *
 * Unhiding the app shows the crosshairs, and Settings only if it was open.
 * Showing every window popped a closed Settings up on unhide, already visible,
 * so showApp() skipped placing it beside the crosshairs.
 */
const crosshair = { show: jest.fn(), hide: jest.fn() };
const settingsWindow = { show: jest.fn(), hide: jest.fn() };
let isSettingsWindowOpen = false;

jest.mock('electron-log', () => ({ status: jest.fn() }));
jest.mock('../main/dock', () => ({
	__esModule: true,
	default: { setVisible: jest.fn() },
}));
jest.mock('../main/store-actions', () => ({
	getSetting: jest.fn(),
	getSettings: () => ({ isSettingsWindowOpen, showDockIcon: true }),
	setSettings: jest.fn(),
}));
jest.mock('../main/windows', () => ({
	__esModule: true,
	default: { settingsWindow },
}));
jest.mock('../main/utils/window-utils', () => ({
	forEachWindow: (cb: (w: unknown) => void) =>
		[crosshair, settingsWindow].forEach(cb),
	forEachCrosshairWindow: (cb: (w: unknown) => void) => [crosshair].forEach(cb),
}));

// eslint-disable-next-line import/first
import { setAppHide } from '../main/utils/hideApp';

beforeEach(() => {
	jest.clearAllMocks();
	isSettingsWindowOpen = false;
});

it('leaves a closed Settings closed on unhide', () => {
	setAppHide(false);

	expect(crosshair.show).toHaveBeenCalled();
	expect(settingsWindow.show).not.toHaveBeenCalled();
});

it('brings Settings back on unhide when it was open', () => {
	isSettingsWindowOpen = true;

	setAppHide(false);

	expect(settingsWindow.show).toHaveBeenCalled();
});

it('still hides every window, Settings included', () => {
	setAppHide(true);

	expect(crosshair.hide).toHaveBeenCalled();
	expect(settingsWindow.hide).toHaveBeenCalled();
});
