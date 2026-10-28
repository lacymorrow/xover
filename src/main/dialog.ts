import { BrowserWindow, app, dialog as electronDialog } from 'electron';
import path from 'path';
import { $dialog } from '../config/strings';
import { debugInfo, is } from './util';
import windows from './windows';

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

/**
 * Put CrossOver in front and hand back the window to parent a modal dialog to.
 *
 * A dialog with no parent is app-modal, and an app that was not frontmost when
 * it opened one leaves it stranded behind whatever the user is looking at: both
 * the tray and the Settings > Advanced reset confirmations came up invisible
 * (LAC-5839). Only the settings window is ever used as the parent. A crosshair
 * window is transparent, frameless and `focusable: false` while locked, so a
 * sheet attached to one cannot be read or clicked.
 */
const focusForDialog = (): BrowserWindow | undefined => {
	// Steal focus from the frontmost app. Without it the dialog opens behind.
	if (is.macos) {
		app.focus({ steal: true });
	} else {
		app.focus();
	}

	const { settingsWindow } = windows;

	// Nothing to parent to when Settings is closed, as it is for the tray path.
	// The dialog stays app-modal there, and the focus above is what brings it
	// forward. Opening Settings just to host a dialog would leave it on screen
	// afterwards, out of step with `isSettingsWindowOpen`.
	if (
		!settingsWindow ||
		settingsWindow.isDestroyed() ||
		!settingsWindow.isVisible()
	) {
		return undefined;
	}

	if (settingsWindow.isMinimized()) {
		settingsWindow.restore();
	}

	settingsWindow.show();
	settingsWindow.focus();

	return settingsWindow;
};

const openUpdateDialog = async (action: Function) => {
	// Same front-most handling as the reset confirmation: an update prompt the
	// user never sees is an update they never take (LAC-5839).
	const parent = focusForDialog();
	const options = {
		type: 'info' as const,
		title: 'CrossOver Update Available',
		message: '',
		buttons: ['Update', 'Ignore'],
	};

	const { response } = parent
		? await electronDialog.showMessageBox(parent, options)
		: await electronDialog.showMessageBox(options);

	// response, not a validButtonIndex() helper that fell back to the whole
	// result object for index 0: Update is index 0, so it never fired.
	if (response === 0 && typeof action === 'function') {
		action();
	}
};

/**
 * Ask before throwing the user's settings away. Reset sits next to Quit in the
 * tray menu, and #391 was someone who aimed for one and hit the other.
 * Cancel is the default button, so a stray Return cancels. Ported from v3
 * cf72e19.
 */
const confirmResetSettings = async (): Promise<boolean> => {
	const parent = focusForDialog();
	const options = {
		type: 'warning' as const,
		title: $dialog.reset.title,
		message: $dialog.reset.message,
		detail: $dialog.reset.detail,
		buttons: [$dialog.reset.cancel, $dialog.reset.confirm],
		defaultId: 0,
		cancelId: 0,
	};

	const { response } = parent
		? await electronDialog.showMessageBox(parent, options)
		: await electronDialog.showMessageBox(options);

	return response === 1;
};

export default {
	// openMediaDialog,
	openAboutDialog,
	// openAlertDialog,
	openUpdateDialog,
	confirmResetSettings,
};
