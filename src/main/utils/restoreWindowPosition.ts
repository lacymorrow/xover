import { BrowserWindow } from 'electron';

export const restoreWindowPosition = (window: BrowserWindow) => {
	console.log('Restoring position', window.getPosition());
};
