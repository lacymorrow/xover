import { app } from 'electron';
import Logger from 'electron-log';
import sounds from '../sounds';
import { getSetting, getSettings, setSettings } from '../store-actions';
import windows from '../windows';
import { restoreWindowPosition } from './restoreWindowPosition';

export const setAppLock = (isLocked: boolean) => {
	const { followMouse, showDockIcon } = getSettings();
	// todo
	// iohook
	// if unlock + follow mouse = reset position
	// unregister iohook
	// enable move listener (save position)

	if (!windows.mainWindow) {
		return;
	}
	Logger.status(`App is ${isLocked ? 'locked' : 'unlocked'}`);

	windows.settingsWindow?.hide(); // hide settings window
	windows.mainWindow.closable = !isLocked;
	// windows.mainWindow.minimizable = !isLocked;
	windows.mainWindow.movable = !isLocked;
	windows.mainWindow.setFocusable(!isLocked);
	windows.mainWindow.setIgnoreMouseEvents(isLocked);

	if (isLocked) {
		sounds.play('LOCK');

		app.dock.hide();
	} else {
		sounds.play('UNLOCK');

		if (followMouse) {
			restoreWindowPosition(windows.mainWindow);
		}

		if (showDockIcon) {
			app.dock.show();
		}
	}
};

export const toggleAppLock = () => {
	const isLocked = !getSetting('isLocked');
	setAppLock(isLocked);
	setSettings({ isLocked });
};
