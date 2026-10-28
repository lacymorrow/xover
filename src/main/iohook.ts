import Logger from 'electron-log';
import { uIOhook } from 'uiohook-napi';

import { uiohookKeycodes } from '../config/keys';
import { HideBehaviorType } from '../config/settings';
import { $iohook } from '../config/strings';
import { isPremium } from './license';
import {
	getActionState,
	getSettings,
	setActionStateKey,
} from './store-actions';
import windows from './windows';

/**
 * libuiohook's EVENT_MOUSE_DRAGGED. uiohook-napi's event switch maps types 4-9
 * and 11 to named events and has no case for 10, so 'mousemove' goes silent
 * the moment a mouse button is held and Follow Mouse froze the crosshair
 * mid-drag. Drags still reach the catch-all 'input' event (v3 #542 / #541).
 */
const EVENT_MOUSE_DRAGGED = 10;

/** Mouse button 2 in uiohook-napi. */
const RIGHT_MOUSE_BUTTON = 2;

export const registerFollowMouse = () => {
	const follow = (event: { x: number; y: number }) => {
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
	};

	uIOhook.on('mousemove', follow);

	uIOhook.on('input', (event) => {
		// Cast: the dragged type is missing from uiohook-napi's EventType union,
		// which is the same omission that keeps it off 'mousemove'.
		if ((event.type as number) !== EVENT_MOUSE_DRAGGED) {
			return;
		}

		follow(event as { x: number; y: number });
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

/**
 * The press and release halves of a `keyboard:X` / `mouse:N` bind, so the three
 * hide behaviors below do not each need a keyboard branch and a mouse branch.
 *
 * The keyboard half latches. The OS repeats keydown for as long as a key is
 * held, and without the latch a toggle flips once per repeat and lands in
 * whichever state the repeat count happened to leave it. keyup is listened for
 * whether or not a release callback is wanted, because the release is what
 * re-arms the latch for the next press (v3 #573).
 */
const bindListeners = (bind: string) => {
	const [input, trigger] = bind.split(':');

	if (input === 'keyboard') {
		if (!(trigger in uiohookKeycodes)) {
			return null;
		}

		const keycode = uiohookKeycodes[trigger as keyof typeof uiohookKeycodes];
		let onPress: (() => void) | undefined;
		let onRelease: (() => void) | undefined;
		let isDown = false;

		uIOhook.on('keydown', (event) => {
			if (event.keycode !== keycode || isDown) {
				return;
			}
			isDown = true;
			onPress?.();
		});

		uIOhook.on('keyup', (event) => {
			if (event.keycode !== keycode) {
				return;
			}
			isDown = false;
			onRelease?.();
		});

		return {
			press: (callback: () => void) => {
				onPress = callback;
			},
			release: (callback: () => void) => {
				onRelease = callback;
			},
		};
	}

	if (input === 'mouse') {
		const button = parseInt(trigger, 10);

		if (Number.isNaN(button)) {
			return null;
		}

		return {
			press: (callback: () => void) =>
				uIOhook.on('mousedown', (event) => {
					if (event.button === button) {
						callback();
					}
				}),
			release: (callback: () => void) =>
				uIOhook.on('mouseup', (event) => {
					if (event.button === button) {
						callback();
					}
				}),
		};
	}

	return null;
};

/**
 * `behavior` was read for a mouse bind and ignored for a keyboard one, so the
 * panel's "Press to toggle" did nothing once the bind was a key (v3 #573).
 * `revealButton` is the ADS button that ends press mode.
 */
const registerHideOnKey = (
	bind: string,
	invert: boolean,
	behavior: HideBehaviorType,
	revealButton: number,
) => {
	const listeners = bindListeners(bind);

	if (!listeners) {
		return;
	}

	if (behavior === 'toggle') {
		listeners.press(() =>
			setActionStateKey('hidden', !getActionState().hidden),
		);
		return;
	}

	if (behavior === 'press') {
		// Only this bind's own hide may be undone by the ADS click, or an ADS
		// click would reveal a crosshair that something else had hidden.
		let hiddenByBind = false;

		listeners.press(() => {
			setActionStateKey('hidden', !invert);
			hiddenByBind = true;
		});

		uIOhook.on('mousedown', (event) => {
			if (event.button === revealButton && hiddenByBind) {
				setActionStateKey('hidden', invert);
				hiddenByBind = false;
			}
		});
		return;
	}

	// hold
	listeners.press(() => setActionStateKey('hidden', !invert));
	listeners.release(() => setActionStateKey('hidden', invert));
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
		// Press mode ends on the Auto-Hide mouse button. A keyboard bind leaves
		// that setting at whatever it was, so fall back the way v3 did.
		registerHideOnKey(
			hideOnKeyBind,
			hideOnMouseInvert,
			hideOnMouseBehavior,
			hideOnMouseButton > 0 ? hideOnMouseButton : RIGHT_MOUSE_BUTTON,
		);
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
