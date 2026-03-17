import { app, dialog, shell, systemPreferences } from 'electron';
import Logger from 'electron-log';
import { is } from './util';
import { getSetting, setSettings } from './store-actions';
import { notification } from './notifications';

let accessibilityCheckPromise: Promise<boolean> | null = null;

/**
 * Check if accessibility permissions are granted on macOS.
 * Returns true on non-macOS platforms.
 */
export const checkAccessibilityPermissions = (): boolean => {
	if (!is.macos) {
		return true;
	}

	try {
		return systemPreferences.isTrustedAccessibilityClient(false);
	} catch (error) {
		Logger.warn('Error checking accessibility permissions:', error);
		return false;
	}
};

/**
 * Request accessibility permissions with user dialog.
 */
export const requestAccessibilityPermissions = async (): Promise<boolean> => {
	if (!is.macos) {
		return true;
	}

	if (accessibilityCheckPromise) {
		return accessibilityCheckPromise;
	}

	try {
		if (systemPreferences.isTrustedAccessibilityClient(false)) {
			return true;
		}

		accessibilityCheckPromise = new Promise<boolean>((resolve, reject) => {
			(async () => {
				const result = await dialog.showMessageBox({
					type: 'info',
					title: 'Accessibility Permission Required',
					message:
						'CrossOver needs accessibility permissions to capture mouse and keyboard events.',
					detail:
						'This allows features like:\n• Mouse follow mode\n• Hide crosshair on mouse/key press\n• Resize crosshair when aiming\n• Tilt crosshair controls\n\nClick "Open System Preferences" to grant permissions, then restart CrossOver.',
					buttons: ['Open System Preferences', 'Skip for Now', 'Quit'],
					defaultId: 0,
					cancelId: 1,
				});

				switch (result.response) {
					case 0: {
						// Open System Preferences
						systemPreferences.isTrustedAccessibilityClient(true);

						try {
							await shell.openExternal(
								'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
							);
						} catch (error) {
							Logger.warn(
								'Could not open System Preferences directly:',
								error,
							);
						}

						// Follow-up dialog after a short delay
						setTimeout(async () => {
							try {
								const followUp = await dialog.showMessageBox({
									type: 'question',
									title: 'Restart Required',
									message:
										'After granting accessibility permissions in System Preferences, CrossOver needs to restart.',
									detail:
										'Have you granted accessibility permissions to CrossOver?',
									buttons: ['Restart Now', "I'll Restart Later"],
									defaultId: 0,
								});

								if (followUp.response === 0) {
									app.relaunch();
									app.quit();
								} else {
									setSettings({ needsAccessibilityCheck: true });
									resolve(false);
								}
							} catch (error) {
								reject(error);
							}
						}, 2000);
						break;
					}

					case 1:
						// Skip for Now
						setSettings({ accessibilitySkipped: true });
						resolve(false);
						break;

					case 2:
						// Quit
						app.quit();
						resolve(false);
						break;

					default:
						resolve(false);
				}
			})().catch(reject);
		});

		const result = await accessibilityCheckPromise;
		accessibilityCheckPromise = null;
		return result;
	} catch (error) {
		Logger.error('Error requesting accessibility permissions:', error);
		accessibilityCheckPromise = null;
		return false;
	}
};

/**
 * Initialize accessibility check on app startup.
 */
export const initializeAccessibilityCheck = async (): Promise<boolean> => {
	if (!is.macos) {
		return true;
	}

	// Recheck after restart if flagged
	if (getSetting('needsAccessibilityCheck')) {
		setSettings({ needsAccessibilityCheck: false });

		if (checkAccessibilityPermissions()) {
			notification({
				title: 'Accessibility Enabled',
				body: 'CrossOver can now use advanced input features!',
			});
			return true;
		}
	}

	// If user hasn't skipped and permissions aren't granted, ask
	if (!getSetting('accessibilitySkipped') && !checkAccessibilityPermissions()) {
		return requestAccessibilityPermissions();
	}

	return checkAccessibilityPermissions();
};
