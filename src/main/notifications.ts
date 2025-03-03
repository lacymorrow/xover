import { app, Notification } from 'electron';
import Logger from 'electron-log/main';
import { ipcChannels } from '../config/ipc-channels';
import { NotificationOptions } from '../types/notification';
import { getSetting } from './store-actions';
import windows from './windows';

export const mainNotification = (options: NotificationOptions) => {
	Logger.info(
		`Sending notification to main process: ${options.title} - ${options.body}`,
	);

	if (!app.isReady()) {
		Logger.warn('App is not ready, skipping notification');
		return;
	}

	new Notification(options).show();
};

export const rendererNotification = (options: NotificationOptions) => {
	Logger.info(
		`Sending notification to renderer process: ${options.title} - ${options.body}`,
	);

	let targetWindow = null;

	if (getSetting('isSettingsWindowOpen')) {
		targetWindow = windows.settingsWindow;
	} else {
		targetWindow = windows.mainWindow;
	}

	if (targetWindow && !targetWindow.isDestroyed()) {
		targetWindow.webContents.send(ipcChannels.APP_NOTIFICATION, options);
	} else {
		Logger.warn('Window is destroyed or does not exist, skipping notification');
	}
};

export const notification = (options: NotificationOptions) => {
	// Use either the system notification or the renderer notification
	if (getSetting('allowNotifications')) {
		const type = getSetting('notificationType');
		if (type === 'system' || type === 'all') {
			mainNotification(options);
		}

		if (type === 'all' || type !== 'system') {
			rendererNotification(options);
		}
	} else {
		Logger.info(`Notification not sent: ${options.title} - ${options.body}`);
	}
};
