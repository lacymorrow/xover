import { app, session } from 'electron';
import Logger from 'electron-log';

/**
 * CrossOver renders local files and needs no browser permissions. Without a
 * handler Electron forwards permission requests (geolocation, notifications,
 * camera) to the OS, which showed an unexpected Windows location prompt (#471).
 *
 * Reading session.defaultSession before the app is ready throws "Session can
 * only be received when app is ready" and takes the main process down with it,
 * which is what broke startup on 3.4.x (#529). Installation always defers behind
 * app.whenReady().
 */
export const initialize = () =>
	app
		.whenReady()
		.then(() => {
			session.defaultSession.setPermissionRequestHandler(
				(_webContents, _permission, callback) => {
					callback(false);
				},
			);

			session.defaultSession.setPermissionCheckHandler(() => false);
		})
		.catch((error: Error) => {
			Logger.error('Could not install session permission handlers', error);
		});
