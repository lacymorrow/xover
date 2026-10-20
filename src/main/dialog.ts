import { app, dialog as electronDialog } from 'electron';
import path from 'path';
import { $dialog } from '../config/strings';
import { debugInfo, is } from './util';

const validButtonIndex = (result: any) =>
	result?.response && typeof result.response === 'number'
		? result.response
		: result;

// export const openMediaDialog = () => {
// 	return electronDialog
// 		.showOpenDialog({
// 			title: $dialog.add.title,
// 			buttonLabel: $dialog.add.buttonLabel,
// 			// defaultPath: app.getPath('home'),
// 			properties: [
// 				// 'dontAddToRecent',
// 				'openFile',
// 				// 'openDirectory',
// 				// 'multiSelections',
// 			],
// 			filters: [
// 				{
// 					name: 'Media',
// 					extensions: VALID_FILETYPES,
// 				},
// 			],
// 		})
// 		.then((response) => {
// 			if (!response.canceled) {
// 				response.filePaths.forEach((filepath: string) => {
// 					// do something with the file
// 				});
// 			}
// 			return [];
// 		})
// 		.catch(Logger.error);
// };

const showAboutWindow = (options: any = {}) => {
	// TODO: When https://github.com/electron/electron/issues/18918 is fixed,
	// these defaults should not need to be set for Linux.
	// TODO: The defaults are standardized here, instead of being set in
	// Electron when https://github.com/electron/electron/issues/23851 is fixed.

	const appName = app.getName();
	const appVersion = app.getVersion();

	const aboutPanelOptions: any = {
		applicationName: appName,
		applicationVersion: appVersion,
	};

	if (options.icon) {
		aboutPanelOptions.iconPath = options.icon;
	}

	if (options.copyright) {
		aboutPanelOptions.copyright = options.copyright;
	}

	if (options.text) {
		aboutPanelOptions.copyright = `${options.copyright || ''}\n\n${
			options.text
		}`;
	}

	if (options.website) {
		aboutPanelOptions.website = options.website;
	}

	app.setAboutPanelOptions(aboutPanelOptions);
	app.showAboutPanel();
};

const openAboutDialog = () => {
	showAboutWindow({
		icon: path.join(__dirname, 'static', 'icons', 'icon.png'),
		copyright: `🎯 CrossOver ${app.getVersion()} | Copyright © Lacy Morrow`,
		text: `A crosshair overlay for any screen. Feedback and bug reports welcome. Created by Lacy Morrow. Crosshairs thanks to /u/IrisFlame. ${
			is.development && ` | ${debugInfo()}`
		} GPU: ${app.getGPUFeatureStatus().gpu_compositing}`,
	});
};

// const openAlertDialog = async (message: string) => {
// 	await electronDialog
// 		.showMessageBox({
// 			type: 'info',
// 			title: 'CrossOver: Developer Update',
// 			message,
// 			buttons: ['Turn off alerts', 'Open in browser...', 'Dismiss'],
// 		})
// 		.then((result) => {
// 			const buttonIndex = validButtonIndex(result);

// 			if (buttonIndex === 0) {
// 				setSettings({ showAppDeveloperMessages: false })
// 			}

// 			if (buttonIndex === 1) {
// 				return shell.openExternal(HOMEPAGE_URL);
// 			}
// 		});
// };

const openUpdateDialog = async (action: Function) => {
	await electronDialog
		.showMessageBox({
			type: 'info',
			title: 'CrossOver Update Available',
			message: '',
			buttons: ['Update', 'Ignore'],
		})
		.then((result) => {
			const buttonIndex = validButtonIndex(result);
			if (buttonIndex === 0 && typeof action === 'function') {
				action();
			}
		});
};

/**
 * Ask before throwing the user's settings away. Reset sits next to Quit in the
 * tray menu, and #391 was someone who aimed for one and hit the other.
 * Cancel is the default button, so a stray Return cancels. Ported from v3
 * cf72e19.
 */
const confirmResetSettings = async (): Promise<boolean> => {
	const { response } = await electronDialog.showMessageBox({
		type: 'warning',
		title: $dialog.reset.title,
		message: $dialog.reset.message,
		detail: $dialog.reset.detail,
		buttons: [$dialog.reset.cancel, $dialog.reset.confirm],
		defaultId: 0,
		cancelId: 0,
	});

	return response === 1;
};

export default {
	// openMediaDialog,
	openAboutDialog,
	// openAlertDialog,
	openUpdateDialog,
	confirmResetSettings,
};
