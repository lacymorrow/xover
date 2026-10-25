import Logger from 'electron-log';
import { uIOhook } from 'uiohook-napi';

import { uiohookKeycodes } from '../config/keys';
import { $iohook } from '../config/strings';
import { isPremium } from './license';
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
				if (getActionState().tilt !== tiltAngle) {
					setActionStateKey('tilt', tiltAngle); // Press
				}
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
				if (getActionState().tilt !== tiltAngle) {
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

/**
 * `invert` turns auto-hide into show-on-ADS: the crosshair sits hidden and the
 * bind reveals it while held, instead of the other way round. Ported from v3
 * #499 / #308.
 *
 * In hold mode, press means "hidden = false" when inverted. Toggle mode needs no
 * special case: the initial state is flipped at hook start, so each press
 * already lands on the right value.
 */
const registerHideOnMouse = (
	button: number,
	behavior: string,
	invert: boolean,
) => {
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
				setActionStateKey('hidden', !invert);
			}
		});
		uIOhook.on('mouseup', (event) => {
			if (event.button === button) {
				setActionStateKey('hidden', invert);
			}
		});
	}
};

const registerHideOnKey = (bind: string, invert: boolean) => {
	const [input, trigger] = bind.split(':');

	if (input === 'keyboard') {
		if (!(trigger in uiohookKeycodes)) {
			return;
		}
		const keycode = uiohookKeycodes[trigger as keyof typeof uiohookKeycodes];
		uIOhook.on('keydown', (event) => {
			if (event.keycode === keycode) {
				setActionStateKey('hidden', !invert);
			}
		});
		uIOhook.on('keyup', (event) => {
			if (event.keycode === keycode) {
				setActionStateKey('hidden', invert);
			}
		});
	} else if (input === 'mouse') {
		const button = parseInt(trigger, 10);
		uIOhook.on('mousedown', (event) => {
			if (event.button === button) {
				setActionStateKey('hidden', !invert);
			}
		});
		uIOhook.on('mouseup', (event) => {
			if (event.button === button) {
				setActionStateKey('hidden', invert);
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

let iohookRunning = false;

/**
 * Action state is only ever set by the hook's own listeners, so it has to go
 * back to neutral whenever those listeners do. Shared with the restart branch
 * of `startIOHook`: without it, a seeded `hidden: true` (invert) or an in-flight
 * hold survived the restart and the crosshair stayed invisible until the next
 * unlock, with no setting left on screen that explained why.
 */
const resetActionState = () => {
	setActionStateKey('secondary', false);
	setActionStateKey('hidden', false);
	setActionStateKey('adsActive', false);
	setActionStateKey('tilt', 0);
};

export const startIOHook = async () => {
	if (!windows?.mainWindow || windows.mainWindow.isDestroyed()) {
		return;
	}

	// Stop and clean up any existing listeners before re-registering. The state
	// reset belongs here, above the `needsHook` early return below: turning the
	// last hook setting off while locked takes that return, and the state the
	// old listeners left behind would never be cleared.
	if (iohookRunning) {
		uIOhook.stop();
		uIOhook.removeAllListeners();
		iohookRunning = false;
		resetActionState();
	}

	const {
		followMouseEnabled,
		secondaryBind,
		secondaryBehavior,
		secondaryActionEnabled,
		hideOnMouseEnabled,
		hideOnMouseButton,
		hideOnMouseBehavior,
		hideOnMouseInvert,
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

	if (secondaryBind && isPremium()) {
		const [input, trigger] = secondaryBind.split(':');

		if (input === 'keyboard') {
			registerToggleHoldShortcutAlt(trigger, secondaryBehavior);
		} else if (input === 'mouse') {
			registerToggleHoldMouseAlt(trigger, secondaryBehavior);
		}
	}

	// HIDE ON MOUSE / KEY. When inverted the crosshair starts hidden and the
	// bind reveals it, so seed the state before the listeners go on.
	const autoHideEnabled =
		hideOnMouseEnabled || (hideOnKeyEnabled && hideOnKeyBind);

	if (autoHideEnabled && hideOnMouseInvert) {
		setActionStateKey('hidden', true);
	}

	if (hideOnMouseEnabled) {
		registerHideOnMouse(
			hideOnMouseButton,
			hideOnMouseBehavior,
			hideOnMouseInvert,
		);
	}

	if (hideOnKeyEnabled && hideOnKeyBind) {
		registerHideOnKey(hideOnKeyBind, hideOnMouseInvert);
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
	iohookRunning = true;
};

export const stopIOHook = async () => {
	Logger.status($iohook.disabled);

	resetActionState();

	uIOhook.stop();
	uIOhook.removeAllListeners();
	iohookRunning = false;
};

/**
 * Bring the hook in line with whatever the store says now, for a caller that
 * replaced every setting at once and cannot say what changed (a reset). Locked
 * means restart with the new settings; unlocked means make sure the hook is off
 * and no action state is left over from it.
 */
export const resyncIOHook = async () => {
	if (getSettings().isLocked) {
		await startIOHook();
		return;
	}

	if (iohookRunning) {
		await stopIOHook();
		return;
	}

	resetActionState();
};
