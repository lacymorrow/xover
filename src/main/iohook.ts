import Logger from 'electron-log';
import { getSettings } from './store-actions';
import windows from './windows';

let iohook: any | null = null;

export const startIOHook = async () => {
	if (!windows.mainWindow) {
		return;
	}

	const { followMouse } = getSettings();

	if (followMouse) {
		// eslint-disable-next-line global-require
		iohook = iohook || require('iohook');

		const { width, height } = windows.mainWindow.getBounds();

		console.log('iohook', iohook);

		iohook.on('mousemove', (event: any) => {
			if (!windows.mainWindow) {
				return;
			}
			// Can't set fractional values
			windows.mainWindow.setBounds({
				x: event.x - Math.round(width / 2),
				y: event.y - Math.round(height / 2),
			});
		});

		Logger.status('Starting iohook');
		iohook.start();
	}
};

export const stopIOHook = async () => {
	if (!iohook) {
		return;
	}

	iohook.stop();
	iohook.removeAllListeners('mousedown');
	iohook.removeAllListeners('mouseup');
	iohook.removeAllListeners('mousemove');
};
