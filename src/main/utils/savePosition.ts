import { BrowserWindow } from 'electron';
import Logger from 'electron-log';
import { debounce } from '../../utils/debounce';
import { setWindowState } from '../store-actions';
import windows from '../windows';

export const saveWindowPosition = (window: BrowserWindow, id: string) => {
	if (!window || window.isDestroyed()) {
		return;
	}

	Logger.info('Saving window position', window?.getTitle());
	const position = window.getBounds();

	if (window === windows.settingsWindow) {
		setWindowState('settings', {
			...position,
		});
		return;
	}

	setWindowState(id, position);
};

export const savePosition = debounce(saveWindowPosition, 1000);

export const addWindowMovedListeners = () => {
	Object.entries(windows.crosshairWindows).forEach(([id, window]) => {
		window?.on('moved', () => savePosition(window, id));
	});
};

export const removeWindowMovedListeners = () => {
	Object.entries(windows.crosshairWindows).forEach(([id, window]) => {
		window?.removeListener('moved', () => savePosition(window, id));
	});
};
