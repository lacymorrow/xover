import kb from '../keyboard';
import { getSettings, setSettings } from '../store-actions';
import windows from '../windows';

export const closeSettingsWindow = () => {
	const { isSettingsWindowOpen } = getSettings();

	if (isSettingsWindowOpen) {
		windows.settingsWindow?.hide();
		kb.unregisterEscapeKey();
		windows.mainWindow?.focus();
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
		kb.registerEscapeKey();
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
