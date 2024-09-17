import Logger from 'electron-log';
import { startIOHook, stopIOHook } from '../iohook';
import sounds from '../sounds';
import { getSettings, setSettings } from '../store-actions';
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

	const { followMouseEnabled, isSettingsWindowOpen, isLocked } = getSettings();
	const isLocking = !isLocked;
	// todo
	// iohook
	// if unlock + follow mouse = reset position
	// unregister iohook
	// enable move listener (save position)

	Logger.status(`App is ${isLocking ? 'locked' : 'unlocked'}`);

	forEachWindow((window) => {
		// window.closable = !isLocking;
		// window.minimizable = !isLocking;
		// window.movable = !isLocking;
		window.setMovable(!isLocking);
		window.setFocusable(!isLocking);
		window.setIgnoreMouseEvents(isLocking);
	});

	if (isLocking) {
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

	setSettings({ isLocked: isLocking });
};
