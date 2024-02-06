import { app } from 'electron';
import Logger from 'electron-log';
import { getSetting, setSettings } from '../store-actions';
import windows from '../windows';

export const setAppHide = (isHidden: boolean) => {
	if (!windows.mainWindow) {
		return;
	}

	Logger.status(`App is ${isHidden ? 'hidden' : 'unhidden'}`);

	const showDockIcon = getSetting('showDockIcon');

	if (isHidden) {
		windows.mainWindow.hide();

		// Hide settings window
		windows.settingsWindow?.hide();
		setSettings({ isSettingsWindowOpen: false });

		// Hide dock icon
		app.dock.hide();
	} else {
		windows.mainWindow.show();

		if (showDockIcon) {
			app.dock.show();
		}
	}
};

export const toggleAppHide = () => {
	const isHidden = !getSetting('isHidden');
	setAppHide(isHidden);
	setSettings({ isHidden });
};
