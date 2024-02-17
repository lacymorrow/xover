import Logger from 'electron-log';
import dock from '../dock';
import { getSetting, getSettings, setSettings } from '../store-actions';
import windows from '../windows';
import { forEachWindow } from './window-utils';

export const setAppHide = (isHidden: boolean) => {
	if (!windows.mainWindow || windows.mainWindow.isDestroyed()) {
		return;
	}

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
		// Show all windows
		forEachWindow((window) => {
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
	const isHidden = !getSetting('isHidden');
	setAppHide(isHidden);
	setSettings({ isHidden });
};
