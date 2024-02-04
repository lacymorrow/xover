import { BrowserWindow } from 'electron';

export const savePosition = (window: BrowserWindow) => {
	console.log('Saving position', window.getPosition());
};
