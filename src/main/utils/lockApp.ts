import { app } from 'electron';
import Logger from 'electron-log';
import { startIOHook, stopIOHook } from '../iohook';
import sounds from '../sounds';
import { getSetting, getSettings, setSettings } from '../store-actions';
import windows from '../windows';
import { restoreWindowPosition } from './restoreWindowPosition';
import { onWindowMoved } from './savePosition';
import { forEachWindow } from './window-utils';

export const setAppLock = async (isLocked: boolean) => {
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

	forEachWindow((window) => {
		window.closable = !isLocked;
		// window.minimizable = !isLocked;
		window.movable = !isLocked;
		window.setFocusable(!isLocked);
		window.setIgnoreMouseEvents(isLocked);
	});

	if (isLocked) {
		sounds.play('LOCK');
		windows.settingsWindow?.hide(); // hide settings window

		forEachWindow((window) => {
			window.removeAllListeners('moved');
		});

		app.dock.hide();

		if (followMouse) {
			startIOHook();
		}
	} else {
		sounds.play('UNLOCK');

		stopIOHook();

		if (followMouse) {
			restoreWindowPosition(windows.mainWindow);
		}

		if (showDockIcon) {
			app.dock.show();
		}

		forEachWindow((window) => {
			window.on('moved', () => onWindowMoved(window));
		});
	}
};

export const toggleAppLock = () => {
	const isLocked = !getSetting('isLocked');
	setAppLock(isLocked);
	setSettings({ isLocked });
};
