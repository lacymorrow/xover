import { getSettings, setSettings } from '../store-actions';
import windows from '../windows';
import { centerWindow } from './centerWindow';
import { isWindowCentered } from './isWindowCentered';

export const openSettingsWindow = () => {
	const { isSettingsWindowOpen, isLocked } = getSettings();

	// Prevent opening the settings window when the app is locked
	if (isLocked) {
		return;
	}

	// If the settings window is not open, show it
	if (!isSettingsWindowOpen) {
		windows.settingsWindow?.show();
		setSettings({ isSettingsWindowOpen: true });
		return;
	}

	// If the settings window is open and not focused, focus it
	if (!windows.settingsWindow?.isFocused()) {
		windows.settingsWindow?.focus();
		return;
	}

	// If the settings window is open and focused, but not centered, center it
	if (!isWindowCentered(windows.settingsWindow)) {
		console.log('openSettingsWindow');
		centerWindow(windows.settingsWindow);
		return;
	}

	// If the settings window is open, centered, and focused, hide it
	windows.settingsWindow?.hide();
	setSettings({ isSettingsWindowOpen: false });
};
