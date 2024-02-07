import { BrowserWindow } from 'electron';
import Logger from 'electron-log';

export const savePosition = (window: BrowserWindow) => {
	Logger.info('Saving window position', window.getTitle());
	const position = window.getPosition();
	const size = window.getSize();

	// const isMaximized = window.isMaximized();
	// const isFullScreen = window.isFullScreen();

	// windows.mainWindow?.webContents.send('save-position', {
	// 	position,
	// 	size,
	// 	isMaximized,
	// 	isFullScreen,
	// });
};
