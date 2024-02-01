import { app } from 'electron';
import Logger from 'electron-log';
import sounds from '../sounds';
import { getSetting, setSettings } from '../store-actions';
import windows from '../windows';

export const setAppLock = (locked: boolean) => {
	Logger.status(`App is ${locked ? 'locked' : 'unlocked'}`);
	// hide settings
	if (!windows.mainWindow) {
		return;
	}

	windows.childWindow?.hide();
	windows.mainWindow.closable = !locked;
	windows.mainWindow.maximizable = !locked;
	windows.mainWindow.minimizable = !locked;
	windows.mainWindow.movable = !locked;
	windows.mainWindow.resizable = !locked;
	windows.mainWindow.setFocusable(!locked);
	windows.mainWindow.setIgnoreMouseEvents(locked);
	windows.mainWindow.removeAllListeners('move');

	if (locked) {
		sounds.play('LOCK');

		app.dock.hide();
	} else {
		sounds.play('UNLOCK');

		if (getSetting('followMouse')) {
			// crossover.resetPosition();
		}

		if (getSetting('showDockIcon')) {
			app.dock.show();
		}
	}
};

export const toggleAppLock = () => {
	const locked = !getSetting('locked');
	setAppLock(locked);
	setSettings({ locked });
};
