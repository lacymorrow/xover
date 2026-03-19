import Logger from 'electron-log';
import { uIOhook } from 'uiohook-napi';

import { uiohookKeycodes } from '../config/keys';
import { $iohook } from '../config/strings';
import {
	getActionState,
	getSettings,
	setActionStateKey,
} from './store-actions';
import windows from './windows';

export const registerFollowMouse = () => {
	uIOhook.on('mousemove', (event) => {
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
	if (!(input in uiohookKeycodes)) {
		return;
	}

	const trigger = uiohookKeycodes[input as keyof typeof uiohookKeycodes];

	if (behavior === 'toggle') {
		uIOhook.on('keydown', (event) => {
			if (event.keycode === trigger) {
				setActionStateKey('secondary', !getActionState().secondary);
			}
		});
	} else if (behavior === 'hold') {
		uIOhook.on('keydown', (event) => {
			if (event.keycode === trigger) {
				setActionStateKey('secondary', true); // Press
			}
		});
		uIOhook.on('keyup', (event) => {
			if (event.keycode === trigger) {
				setActionStateKey('secondary', false); // Release
			}
		});
	}
};

const registerToggleHoldMouseAlt = (input: string, behavior: string) => {
	const button = parseInt(input, 10);

	if (behavior === 'toggle') {
		uIOhook.on('mousedown', (event) => {
			if (event.button === button) {
				setActionStateKey('secondary', !getActionState().secondary);
			}
		});
	} else if (behavior === 'hold') {
		uIOhook.on('mousedown', (event) => {
			if (event.button === button) {
				setActionStateKey('secondary', true);
			}
		});

		uIOhook.on('mouseup', (event) => {
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
	if (!(input in uiohookKeycodes)) {
		return;
	}

	const trigger = uiohookKeycodes[input as keyof typeof uiohookKeycodes];

	if (tiltBehavior === 'toggle') {
		uIOhook.on('keydown', (event) => {
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
		uIOhook.on('keydown', (event) => {
			if (event.keycode === trigger) {
				setActionStateKey('tilt', tiltAngle); // Press
			}
		});
		uIOhook.on('keyup', (event) => {
			if (event.keycode === trigger) {
				setActionStateKey('tilt', 0); // Release
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
		uIOhook.on('mousedown', (event) => {
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
		uIOhook.on('mousedown', (event) => {
			if (event.button === button) {
				const currentTilt = getActionState().tilt;
				if (currentTilt && currentTilt === tiltAngle) {
					setActionStateKey('tilt', 0);
				} else {
					setActionStateKey('tilt', tiltAngle);
				}
			}
		});

		uIOhook.on('mouseup', (event) => {
			if (event.button === button) {
				setActionStateKey('tilt', 0);
			}
		});
	}
};

const registerHideOnMouse = (button: number, behavior: string) => {
	if (behavior === 'toggle') {
		uIOhook.on('mousedown', (event) => {
			if (event.button === button) {
				setActionStateKey('hidden', !getActionState().hidden);
			}
		});
	} else {
		// hold
		uIOhook.on('mousedown', (event) => {
			if (event.button === button) {
				setActionStateKey('hidden', true);
			}
		});
		uIOhook.on('mouseup', (event) => {
			if (event.button === button) {
				setActionStateKey('hidden', false);
			}
		});
	}
};

const registerHideOnKey = (bind: string) => {
	const [input, trigger] = bind.split(':');

	if (input === 'keyboard') {
		if (!(trigger in uiohookKeycodes)) {
			return;
		}
		const keycode = uiohookKeycodes[trigger as keyof typeof uiohookKeycodes];
		uIOhook.on('keydown', (event) => {
			if (event.keycode === keycode) {
				setActionStateKey('hidden', true);
			}
		});
		uIOhook.on('keyup', (event) => {
			if (event.keycode === keycode) {
				setActionStateKey('hidden', false);
			}
		});
	} else if (input === 'mouse') {
		const button = parseInt(trigger, 10);
		uIOhook.on('mousedown', (event) => {
			if (event.button === button) {
				setActionStateKey('hidden', true);
			}
		});
		uIOhook.on('mouseup', (event) => {
			if (event.button === button) {
				setActionStateKey('hidden', false);
			}
		});
	}
};

const registerADSResize = (button: number, behavior: string) => {
	if (behavior === 'toggle') {
		uIOhook.on('mousedown', (event) => {
			if (event.button === button) {
				setActionStateKey('adsActive', !getActionState().adsActive);
			}
		});
	} else {
		// hold
		uIOhook.on('mousedown', (event) => {
			if (event.button === button) {
				setActionStateKey('adsActive', true);
			}
		});
		uIOhook.on('mouseup', (event) => {
			if (event.button === button) {
				setActionStateKey('adsActive', false);
			}
		});
	}
};

export const startIOHook = async () => {
	if (!windows?.mainWindow || windows.mainWindow.isDestroyed()) {
		return;
	}

	const {
		followMouseEnabled,
		secondaryBind,
		secondaryBehavior,
		secondaryActionEnabled,
		hideOnMouseEnabled,
		hideOnMouseButton,
		hideOnMouseBehavior,
		hideOnKeyEnabled,
		hideOnKeyBind,
		adsResizeEnabled,
		adsResizeButton,
		adsResizeBehavior,
		tiltActionEnabled,
		tiltAngle,
		tiltBehavior,
		tiltLeftBind,
		tiltRightBind,
	} = getSettings();

	// Validate tilt settings
	let tiltEnabled = false;
	if (tiltActionEnabled && (tiltLeftBind || tiltRightBind)) {
		tiltEnabled = true;
	}

	const needsHook =
		followMouseEnabled ||
		secondaryBind ||
		tiltEnabled ||
		hideOnMouseEnabled ||
		(hideOnKeyEnabled && hideOnKeyBind) ||
		adsResizeEnabled;

	if (!needsHook) {
		return;
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

	// HIDE ON MOUSE
	if (hideOnMouseEnabled) {
		registerHideOnMouse(hideOnMouseButton, hideOnMouseBehavior);
	}

	// HIDE ON KEY
	if (hideOnKeyEnabled && hideOnKeyBind) {
		registerHideOnKey(hideOnKeyBind);
	}

	// ADS RESIZE
	if (adsResizeEnabled) {
		registerADSResize(adsResizeButton, adsResizeBehavior);
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

	uIOhook.start();
};

export const stopIOHook = async () => {
	Logger.status($iohook.disabled);

	setActionStateKey('secondary', false);
	setActionStateKey('hidden', false);
	setActionStateKey('adsActive', false);
	setActionStateKey('tilt', 0);

	uIOhook.stop();
	uIOhook.removeAllListeners();
};
