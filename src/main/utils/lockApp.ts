import Logger from 'electron-log';
import { startIOHook, stopIOHook } from '../iohook';
import sounds from '../sounds';
import { getSetting, getSettings, setSettings } from '../store-actions';
import windows from '../windows';
import { restoreWindowPosition } from './restoreWindowPosition';
import {
	addWindowMovedListeners,
	removeWindowMovedListeners,
} from './savePosition';
import { forEachWindow } from './window-utils';

export const toggleAppLock = () => {
	if (!windows.mainWindow || windows.mainWindow.isDestroyed()) {
		return;
	}
	const isLocked = !getSetting('isLocked');

	const { followMouseEnabled, isSettingsWindowOpen } = getSettings();
	// todo
	// iohook
	// if unlock + follow mouse = reset position
	// unregister iohook
	// enable move listener (save position)

	Logger.status(`App is ${isLocked ? 'locked' : 'unlocked'}`);

	forEachWindow((window) => {
		// window.closable = !isLocked;
		// window.minimizable = !isLocked;
		window.movable = !isLocked;
		window.setFocusable(!isLocked);
		window.setIgnoreMouseEvents(isLocked);
	});

	if (isLocked) {
		sounds.play('LOCK');
		windows.settingsWindow?.hide(); // hide settings window

		removeWindowMovedListeners();

		startIOHook();
	} else {
		stopIOHook();

		sounds.play('UNLOCK');

		if (followMouseEnabled) {
			restoreWindowPosition(windows.mainWindow);
		}

		if (isSettingsWindowOpen) {
			windows.settingsWindow?.show();
		}

		addWindowMovedListeners();
	}

	setSettings({ isLocked });
};
