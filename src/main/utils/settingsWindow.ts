import { globalShortcut } from 'electron';
import Logger from 'electron-log';
import { getSettings, setSettings } from '../store-actions';
import windows from '../windows';
import { focusNextWindow } from './window-utils';

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

export const openSettingsWindow = () => {
	const { isSettingsWindowOpen, isLocked } = getSettings();

	// Prevent opening the settings window when the app is locked
	if (
		isLocked ||
		!windows.settingsWindow ||
		windows.settingsWindow.isDestroyed()
	) {
		return;
	}

	// If the settings window is not open, show it
	if (!isSettingsWindowOpen) {
		windows.settingsWindow.show();
		registerEscapeKey();
		setSettings({ isSettingsWindowOpen: true });
		return;
	}

	// If the settings window is open but not centered, center it
	// if (!isWindowCentered(windows.settingsWindow)) {
	// 	centerWindow({ window: windows.settingsWindow, animated: true });
	// 	return;
	// }

	// If the settings window is open and not focused, focus it
	if (!windows.settingsWindow?.isFocused()) {
		windows.settingsWindow?.focus();
		return;
	}

	closeSettingsWindow();
};
