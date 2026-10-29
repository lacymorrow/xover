import Logger from 'electron-log';
import dock from '../dock';
import { getSetting, getSettings, setSettings } from '../store-actions';
import windows from '../windows';
import { forEachCrosshairWindow, forEachWindow } from './window-utils';

export const setAppHide = (isHidden: boolean) => {
	Logger.status(`App is ${isHidden ? 'hidden' : 'unhidden'}`);

	const { isSettingsWindowOpen, showDockIcon } = getSettings();

	if (isHidden) {
		// Hide all windows
		forEachWindow((window) => {
			window.hide();
		});

		// Hide dock icon
		dock.setVisible(false);
	} else {
		// Show the crosshairs only. Settings comes back below if it was open;
		// showing every window popped a closed Settings up on unhide, already
		// visible, so showApp() skipped placing it beside the crosshairs.
		forEachCrosshairWindow((window) => {
			window.show();
		});

		// Restore settings window
		if (isSettingsWindowOpen) {
			windows.settingsWindow?.show();
		}

		// Show dock icon
		if (showDockIcon) {
			dock.setVisible(true);
		}
	}
};

export const toggleAppHide = () => {
	if (!windows.mainWindow || windows.mainWindow.isDestroyed()) {
		return;
	}

	const isHidden = !getSetting('isHidden');
	setAppHide(isHidden);
	setSettings({ isHidden });
};
