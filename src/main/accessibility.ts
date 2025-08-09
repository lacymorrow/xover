import { app, dialog, Notification, shell, systemPreferences } from 'electron';
import Logger from 'electron-log';
import { is } from './util';

let accessibilityCheckPromise: Promise<boolean> | null = null;

const checkAccessibilityPermissions = (): boolean => {
  if (!is.macos) return true;
  try {
    return systemPreferences.isTrustedAccessibilityClient(false);
  } catch (error) {
    Logger.warn('Error checking accessibility permissions:', error);
    return false;
  }
};

const showAccessibilityDisabledNotification = () => {
  if (!Notification.isSupported()) return;
  const n = new Notification({
    title: 'Accessibility Features Disabled',
    body: 'Some CrossOver features require accessibility permissions. Enable them in System Settings → Privacy & Security → Accessibility.',
  });
  n.show();
};

const requestAccessibilityPermissions = async (): Promise<boolean> => {
  if (!is.macos) return true;
  if (accessibilityCheckPromise) return accessibilityCheckPromise;

  try {
    if (systemPreferences.isTrustedAccessibilityClient(false)) {
      return true;
    }

    accessibilityCheckPromise = new Promise<boolean>((resolve) => {
      (async () => {
        const result = await dialog.showMessageBox({
          type: 'info',
          title: 'Accessibility Permission Required',
          message: 'CrossOver needs accessibility permissions to capture mouse and keyboard events.',
          detail:
            'This enables features like:\n• Mouse follow mode\n• Hide crosshair on mouse/key press\n• Resize crosshair when aiming\n• Tilt crosshair controls\n\nClick "Open System Settings" to grant permissions, then restart CrossOver.',
          buttons: ['Open System Settings', 'Skip for Now', 'Quit'],
          defaultId: 0,
          cancelId: 1,
        });

        switch (result.response) {
          case 0:
            try {
              systemPreferences.isTrustedAccessibilityClient(true);
              await shell.openExternal(
                'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
              );
            } catch (error) {
              Logger.warn('Could not open System Settings directly:', error);
            }

            setTimeout(async () => {
              const followUp = await dialog.showMessageBox({
                type: 'question',
                title: 'Restart Required',
                message:
                  'After granting accessibility permissions in System Settings, CrossOver needs to restart.',
                buttons: ['Restart Now', 'I\'ll Restart Later'],
                defaultId: 0,
              });

              if (followUp.response === 0) {
                app.relaunch();
                app.quit();
              }
              resolve(false);
            }, 2000);
            break;
          case 1:
            resolve(false);
            break;
          case 2:
            app.quit();
            resolve(false);
            break;
          default:
            resolve(false);
        }
      })();
    });

    const granted = await accessibilityCheckPromise;
    accessibilityCheckPromise = null;
    return granted;
  } catch (error) {
    Logger.error('Error requesting accessibility permissions:', error);
    accessibilityCheckPromise = null;
    return false;
  }
};

const initializeAccessibilityCheck = async () => {
  if (!is.macos) return true;
  if (checkAccessibilityPermissions()) return true;
  showAccessibilityDisabledNotification();
  return requestAccessibilityPermissions();
};

export default {
  checkAccessibilityPermissions,
  requestAccessibilityPermissions,
  showAccessibilityDisabledNotification,
  initializeAccessibilityCheck,
};


