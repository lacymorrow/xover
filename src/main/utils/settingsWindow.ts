import { globalShortcut } from 'electron';
import Logger from 'electron-log';
import { getSettings, setSettings } from '../store-actions';
import windows from '../windows';
import { toggleAppHide } from './hideApp';
import { toggleAppLock } from './lockApp';
import { focusNextWindow, getNextCrosshairWindow } from './window-utils';

const unregisterEscapeKey = () => {
	globalShortcut.unregister('Escape');
};

const registerEscapeKey = () => {
	globalShortcut.register('Escape', () => {
		Logger.info('Escape key pressed');
		// eslint-disable-next-line no-use-before-define
		closeSettingsWindow();
	});
};

export const closeSettingsWindow = () => {
	const { isSettingsWindowOpen } = getSettings();

	if (isSettingsWindowOpen) {
		windows.settingsWindow?.hide();
		unregisterEscapeKey();
		focusNextWindow();
		setSettings({ isSettingsWindowOpen: false });
	}
};

/**
 * Show the settings window. Never toggles, unlike openSettingsWindow().
 */
const revealSettingsWindow = () => {
	const { settingsWindow } = windows;

	if (!settingsWindow || settingsWindow.isDestroyed()) {
		return;
	}

	if (settingsWindow.isMinimized()) {
		settingsWindow.restore();
	}

	settingsWindow.show();
	settingsWindow.focus();

	if (!getSettings().isSettingsWindowOpen) {
		registerEscapeKey();
		setSettings({ isSettingsWindowOpen: true });
	}
};

/**
 * Bring the app back to the user: unhide, unlock, show Settings.
 *
 * Show App, a second launch and the Settings shortcut are what someone reaches
 * for when the crosshair is locked and they cannot click it. All three left the
 * lock on, and a locked app refuses to open Settings, so the only way back was
 * the Lock keybind (LAC-5839).
 */
export const showApp = async () => {
	// Show App is also the way back when no crosshair is left: every crosshair
	// window closed (macOS keeps the app running), or `mainWindow` pointing at a
	// destroyed one, which threw "Object has been destroyed" from the tray in
	// beta.5. Repoint at a live crosshair, or create one the way the Dock icon
	// does, before unhiding and unlocking, which both act on `mainWindow`.
	if (!windows.mainWindow || windows.mainWindow.isDestroyed()) {
		windows.mainWindow = getNextCrosshairWindow() ?? null;
	}

	if (!windows.mainWindow) {
		// Required lazily: create-window imports modules that import this one.
		// eslint-disable-next-line global-require
		await require('../create-window').createCrosshairWindow();
	}

	const { isHidden, isLocked } = getSettings();

	if (isHidden) {
		toggleAppHide();
	}

	if (isLocked) {
		toggleAppLock();
	}

	revealSettingsWindow();
};

export const openSettingsWindow = () => {
	const { isSettingsWindowOpen, isLocked, isHidden } = getSettings();

	if (!windows.settingsWindow || windows.settingsWindow.isDestroyed()) {
		return;
	}

	// A locked or hidden app cannot show Settings, so treat the request as
	// "show me the app" and lift the lock first (LAC-5839). This used to return
	// and do nothing at all.
	if (isLocked || isHidden) {
		showApp();
		return;
	}

	// If the settings window is not open, show it
	if (!isSettingsWindowOpen) {
		revealSettingsWindow();
		return;
	}

	// If the settings window is open and not focused, focus it
	if (!windows.settingsWindow?.isFocused()) {
		windows.settingsWindow?.focus();
		return;
	}

	closeSettingsWindow();
};
