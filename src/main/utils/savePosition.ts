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

// Store listener references so they can be properly removed
const movedListeners = new Map<string, () => void>();

export const addWindowMovedListeners = () => {
	Object.entries(windows.crosshairWindows).forEach(([id, window]) => {
		if (!window || window.isDestroyed()) return;

		// Remove existing listener for this window first to avoid duplicates
		const existing = movedListeners.get(id);
		if (existing) {
			window.removeListener('moved', existing);
			movedListeners.delete(id);
		}

		const listener = () => savePosition(window, id);
		movedListeners.set(id, listener);
		window.on('moved', listener);
	});
};

export const removeWindowMovedListeners = () => {
	Object.entries(windows.crosshairWindows).forEach(([id, window]) => {
		const listener = movedListeners.get(id);
		if (listener && window && !window.isDestroyed()) {
			window.removeListener('moved', listener);
		}
		movedListeners.delete(id);
	});
};
