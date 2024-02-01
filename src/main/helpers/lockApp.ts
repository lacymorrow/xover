import { app } from 'electron';
import Logger from 'electron-log';
import sounds from '../sounds';
import { getSetting, getSettings, setSettings } from '../store-actions';
import windows from '../windows';

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

	windows.childWindow?.hide(); // hide settings window
	windows.mainWindow.closable = !isLocked;
	// windows.mainWindow.minimizable = !isLocked;
	windows.mainWindow.movable = !isLocked;
	windows.mainWindow.setFocusable(!isLocked);
	windows.mainWindow.setIgnoreMouseEvents(isLocked);

	if (isLocked) {
		sounds.play('LOCK');

		windows.mainWindow.removeAllListeners('move');

		app.dock.hide();
	} else {
		sounds.play('UNLOCK');

		// move listener
		// windows.mainWindow.on('move', () => {
		// 	if (windows.mainWindow) {
		// 		const position = windows.mainWindow.getPosition();
		// 		setSettings({ position });
		// 	}
		// });

		if (followMouse) {
			// crossover.resetPosition();
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
