import Logger from 'electron-log';
import accessibility from './accessibility';

import { iohookKeycodes } from '../config/keys';
import { $iohook } from '../config/strings';
import {
	getActionState,
	getSettings,
	setActionStateKey,
} from './store-actions';
import windows from './windows';
import { ipcChannels } from '../config/ipc-channels';

// Types for uiohook-napi events
interface UiohookKeyboardEvent {
	altKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	keycode: number;
}

interface UiohookMouseEvent {
	altKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	x: number;
	y: number;
	button: number;
	clicks: number;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { uIOhook } = require('uiohook-napi');

let isHookActive = false;

export const registerFollowMouse = () => {
	uIOhook.on('mousemove', (event: any) => {
		if (!windows?.mainWindow || windows.mainWindow.isDestroyed()) {
			return;
		}
		const { width, height } = windows.mainWindow.getBounds();
		// todo: fix this
		// Can't set fractional values
		windows.mainWindow.setBounds({
			x: event.x - Math.round(width / 2),
			y: event.y - Math.round(height / 2),
		});
	});
};

const registerToggleHoldShortcutAlt = (input: string, behavior: string) => {
	if (!(input in iohookKeycodes)) {
		return;
	}

	const trigger = parseInt(
		iohookKeycodes[input as keyof typeof iohookKeycodes],
		10,
	);

	if (behavior === 'toggle') {
		uIOhook.on('keydown', (event: UiohookKeyboardEvent) => {
			if (event.keycode === trigger) {
				setActionStateKey('secondary', !getActionState().secondary);
			}
		});
	} else if (behavior === 'hold') {
		uIOhook.on('keydown', (event: UiohookKeyboardEvent) => {
			if (event.keycode === trigger) {
				setActionStateKey('secondary', true);
			}
		});

		uIOhook.on('keyup', (event: UiohookKeyboardEvent) => {
			if (event.keycode === trigger) {
				setActionStateKey('secondary', false);
			}
		});
	}
};

const registerToggleHoldMouseAlt = (input: string, behavior: string) => {
	const button = parseInt(input, 10);

	if (behavior === 'toggle') {
		uIOhook.on('mousedown', (event: UiohookMouseEvent) => {
			if (event.button === button) {
				setActionStateKey('secondary', !getActionState().secondary);
			}
		});
	} else if (behavior === 'hold') {
		uIOhook.on('mousedown', (event: UiohookMouseEvent) => {
			if (event.button === button) {
				// MACOS Mousedown fired twice for middle mouse
				setActionStateKey('secondary', !getActionState().secondary);
			}
		});

		uIOhook.on('mouseup', (event: UiohookMouseEvent) => {
			if (event.button === button) {
				setActionStateKey('secondary', false);
			}
		});
	}
};

const registerToggleHoldShortcutTilt = (
	input: string,
	tiltAngle: number,
	tiltBehavior: string,
) => {
	if (!(input in iohookKeycodes)) {
		return;
	}

	const trigger = parseInt(
		iohookKeycodes[input as keyof typeof iohookKeycodes],
		10,
	);

	if (tiltBehavior === 'toggle') {
		uIOhook.on('keydown', (event: UiohookKeyboardEvent) => {
			if (event.keycode === trigger) {
				const currentTilt = getActionState().tilt;
				if (currentTilt && currentTilt !== tiltAngle) {
					setActionStateKey('tilt', 0);
				} else {
					setActionStateKey('tilt', tiltAngle);
				}
			}
		});
	} else if (tiltBehavior === 'hold') {
		uIOhook.on('keydown', (event: UiohookKeyboardEvent) => {
			if (event.keycode === trigger) {
				setActionStateKey('tilt', tiltAngle);
			}
		});

		uIOhook.on('keyup', (event: UiohookKeyboardEvent) => {
			if (event.keycode === trigger) {
				setActionStateKey('tilt', 0);
			}
		});
	}
};

const registerToggleHoldMouseTilt = (
	input: string,
	tiltAngle: number,
	tiltBehavior: string,
) => {
	const button = parseInt(input, 10);

	if (tiltBehavior === 'toggle') {
		uIOhook.on('mousedown', (event: UiohookMouseEvent) => {
			if (event.button === button) {
				const currentTilt = getActionState().tilt;
				if (currentTilt && currentTilt === tiltAngle) {
					setActionStateKey('tilt', 0);
				} else {
					setActionStateKey('tilt', tiltAngle);
				}
			}
		});
	} else if (tiltBehavior === 'hold') {
		uIOhook.on('mousedown', (event: UiohookMouseEvent) => {
			if (event.button === button) {
				const currentTilt = getActionState().tilt;
				if (currentTilt && currentTilt === tiltAngle) {
					setActionStateKey('tilt', 0);
				} else {
					setActionStateKey('tilt', tiltAngle);
				}
			}
		});

		uIOhook.on('mouseup', (event: UiohookMouseEvent) => {
			if (event.button === button) {
				setActionStateKey('tilt', 0);
			}
		});
	}
};

export const startIOHook = async () => {
	if (!windows?.mainWindow || windows.mainWindow.isDestroyed()) {
		return;
	}

  // macOS accessibility permissions are required for global input hooks
  if (!accessibility.checkAccessibilityPermissions()) {
    Logger.warn('iohook features require accessibility permissions');
    accessibility.showAccessibilityDisabledNotification();
    const granted = await accessibility.requestAccessibilityPermissions();
    if (!granted) {
      return;
    }
  }

	const {
		followMouseEnabled,
		secondaryBind,
		secondaryBehavior,
		secondaryActionEnabled,
		tiltActionEnabled,
		tiltAngle,
		tiltBehavior,
		tiltLeftBind,
    tiltRightBind,
    // new actions
    hideOnMouseBind,
    hideOnMouseBehavior,
    hideOnKeyBind,
    adsResizeEnabled,
    adsResizeBind,
    adsResizeBehavior,
    adsResizeSize,
	} = getSettings();

	// Validate tilt settings
	let tiltEnabled = false;
	if (tiltActionEnabled && (tiltLeftBind || tiltRightBind)) {
		tiltEnabled = true;
	}

	if (!followMouseEnabled && !secondaryBind && !tiltEnabled) {
    // still allow other features below
	}

	Logger.status($iohook.enabled);

	// FOLLOW MOUSE
	if (followMouseEnabled) {
		registerFollowMouse();
	}

	if (secondaryBind) {
		const [input, trigger] = secondaryBind.split(':');

		if (input === 'keyboard') {
			registerToggleHoldShortcutAlt(trigger, secondaryBehavior);
		} else if (input === 'mouse') {
			registerToggleHoldMouseAlt(trigger, secondaryBehavior);
		}
	}

	// TILT
	if (tiltEnabled) {
		if (tiltLeftBind) {
			const [input, trigger] = tiltLeftBind.split(':');

			if (input === 'keyboard') {
				registerToggleHoldShortcutTilt(trigger, tiltAngle * -1, tiltBehavior);
			} else if (input === 'mouse') {
				registerToggleHoldMouseTilt(trigger, tiltAngle * -1, tiltBehavior);
			}

  // HIDE ON MOUSE
  if (hideOnMouseBind) {
    const [input, trigger] = hideOnMouseBind.split(':');
    if (input === 'mouse') {
      if (hideOnMouseBehavior === 'toggle') {
        uIOhook.on('mousedown', (event: UiohookMouseEvent) => {
          if (event.button === parseInt(trigger, 10)) {
            const hidden = getActionState().secondary;
            setActionStateKey('secondary', !hidden);
            windows.mainWindow?.webContents.send(
              ipcChannels.SET_CROSSHAIR_OPACITY,
              !hidden ? 0 : 1,
            );
          }
        });
      } else {
        uIOhook.on('mousedown', (event: UiohookMouseEvent) => {
          if (event.button === parseInt(trigger, 10)) {
            setActionStateKey('secondary', true);
            windows.mainWindow?.webContents.send(
              ipcChannels.SET_CROSSHAIR_OPACITY,
              0,
            );
          }
        });
        uIOhook.on('mouseup', (event: UiohookMouseEvent) => {
          if (event.button === parseInt(trigger, 10)) {
            setActionStateKey('secondary', false);
            windows.mainWindow?.webContents.send(
              ipcChannels.SET_CROSSHAIR_OPACITY,
              1,
            );
          }
        });
      }
    }
  }

  // HIDE ON KEY (single key only)
  if (hideOnKeyBind) {
    const [input, trigger] = hideOnKeyBind.split(':');
    if (input === 'keyboard') {
      const keycode = parseInt(iohookKeycodes[trigger as keyof typeof iohookKeycodes] || '0', 10);
      if (keycode) {
        uIOhook.on('keydown', (event: UiohookKeyboardEvent) => {
          if (event.keycode === keycode) {
            setActionStateKey('secondary', true);
            windows.mainWindow?.webContents.send(
              ipcChannels.SET_CROSSHAIR_OPACITY,
              0,
            );
          }
        });
        uIOhook.on('keyup', (event: UiohookKeyboardEvent) => {
          if (event.keycode === keycode) {
            setActionStateKey('secondary', false);
            windows.mainWindow?.webContents.send(
              ipcChannels.SET_CROSSHAIR_OPACITY,
              1,
            );
          }
        });
      }
    }
  }

  // ADS RESIZE (mouse bind)
  if (adsResizeEnabled && adsResizeBind) {
    const [input, trigger] = adsResizeBind.split(':');
    if (input === 'mouse') {
      const newSize = adsResizeSize;
      if (adsResizeBehavior === 'toggle') {
        uIOhook.on('mousedown', (event: UiohookMouseEvent) => {
          if (event.button === parseInt(trigger, 10)) {
            const current = getActionState().tilt; // use action state as scratch if needed
            const toggled = current === -999 ? 0 : -999; // hacky toggle marker
            setActionStateKey('tilt', toggled);
            windows.mainWindow?.webContents.send(
              ipcChannels.SET_CROSSHAIR_SIZE,
              toggled === -999 ? newSize : undefined,
            );
          }
        });
      } else {
        uIOhook.on('mousedown', (event: UiohookMouseEvent) => {
          if (event.button === parseInt(trigger, 10)) {
            windows.mainWindow?.webContents.send(
              ipcChannels.SET_CROSSHAIR_SIZE,
              newSize,
            );
          }
        });
        uIOhook.on('mouseup', (event: UiohookMouseEvent) => {
          if (event.button === parseInt(trigger, 10)) {
            windows.mainWindow?.webContents.send(ipcChannels.SET_CROSSHAIR_SIZE);
          }
        });
      }
    }
  }
		}

		if (tiltRightBind) {
			const [input, trigger] = tiltRightBind.split(':');
			if (input === 'keyboard') {
				registerToggleHoldShortcutTilt(trigger, tiltAngle, tiltBehavior);
			} else if (input === 'mouse') {
				registerToggleHoldMouseTilt(trigger, tiltAngle, tiltBehavior);
			}
		}
	}

	// Start the uiohook-napi listener
	try {
		uIOhook.start();
		isHookActive = true;
	} catch (error) {
		Logger.error('Failed to start uiohook-napi:', error);
	}
};

export const stopIOHook = async () => {
	Logger.status($iohook.disabled);

	setActionStateKey('secondary', false);
	setActionStateKey('tilt', 0);

	if (!isHookActive) {
		return;
	}

	try {
		// Remove all listeners
		uIOhook.removeAllListeners('mousedown');
		uIOhook.removeAllListeners('mouseup');
		uIOhook.removeAllListeners('mousemove');
		uIOhook.removeAllListeners('keydown');
		uIOhook.removeAllListeners('keyup');

		// Stop the hook
		uIOhook.stop();
		isHookActive = false;
	} catch (error) {
		Logger.error('Failed to stop uiohook-napi:', error);
	}
};
