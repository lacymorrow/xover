import Logger from 'electron-log';

import { iohookKeycodes } from '../config/keys';
import { $iohook } from '../config/strings';
import {
	getActionState,
	getSettings,
	setActionStateKey,
} from './store-actions';
import windows from './windows';

let iohook: any | null = null;

export const registerFollowMouse = () => {
	if (!windows?.mainWindow || windows.mainWindow.isDestroyed()) {
		return;
	}

	const { width, height } = windows.mainWindow.getBounds();

	iohook.on('mousemove', (event: any) => {
		if (!windows?.mainWindow || windows.mainWindow.isDestroyed()) {
			return;
		}
		// todo: fix this
		// Can't set fractional values
		windows.mainWindow.setBounds({
			x: event.x - Math.round(width / 2),
			y: event.y - Math.round(height / 2),
		});
	});
};

const registerToggleHoldShortcut = (
	input: string,
	tiltAngle: number,
	tiltBehavior: string,
) => {
	if (!(input in iohookKeycodes)) {
		return;
	}

	const trigger = iohookKeycodes[input as keyof typeof iohookKeycodes];

	if (tiltBehavior === 'toggle') {
		iohook.registerShortcut([trigger], () => {
			const currentTilt = getActionState().tilt;
			if (currentTilt && currentTilt !== tiltAngle) {
				setActionStateKey('tilt', 0);
			} else {
				setActionStateKey('tilt', tiltAngle);
			}
		});
	} else if (tiltBehavior === 'hold') {
		iohook.registerShortcut(
			[trigger],
			() => setActionStateKey('tilt', tiltAngle), // Press
			() => setActionStateKey('tilt', 0), // Release
		);
	}
};

const registerToggleHoldMouse = (
	input: string,
	tiltAngle: number,
	tiltBehavior: string,
) => {
	const button = parseInt(input, 10);
	if (tiltBehavior === 'toggle') {
		iohook.on('mousedown', (event: MouseEvent) => {
			const currentTilt = getActionState().tilt;
			if (event.button === button) {
				if (currentTilt !== tiltAngle) {
					setActionStateKey('tilt', tiltAngle);
				} else {
					setActionStateKey('tilt', 0);
				}
			}
		});
	} else if (tiltBehavior === 'hold') {
		iohook.on('mousedown', (event: MouseEvent) => {
			if (event.button === button) {
				setActionStateKey('tilt', tiltAngle);
			}
		});

		iohook.on('mouseup', (event: MouseEvent) => {
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

	const {
		followMouse,
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

	if (!followMouse && !tiltEnabled) {
		return;
	}

	Logger.status($iohook.enabled);

	// eslint-disable-next-line global-require
	iohook = iohook || require('iohook');

	// FOLLOW MOUSE
	if (followMouse) {
		registerFollowMouse();
	}

	// TILT
	if (tiltEnabled) {
		if (tiltLeftBind) {
			const [input, trigger] = tiltLeftBind.split(':');

			if (input === 'keyboard') {
				registerToggleHoldShortcut(trigger, tiltAngle * -1, tiltBehavior);
			} else if (input === 'mouse') {
				registerToggleHoldMouse(trigger, tiltAngle * -1, tiltBehavior);
			}
		}

		if (tiltRightBind) {
			const [input, trigger] = tiltRightBind.split(':');
			if (input === 'keyboard') {
				registerToggleHoldShortcut(trigger, tiltAngle, tiltBehavior);
			} else if (input === 'mouse') {
				registerToggleHoldMouse(trigger, tiltAngle, tiltBehavior);
			}
		}
	}

	// iohook.useRawcode(true);
	// iohook.start(true);
	iohook.start();
};

export const stopIOHook = async () => {
	Logger.status($iohook.enabled);

	setActionStateKey('tilt', 0);

	if (!iohook) {
		return;
	}

	iohook.unregisterAllShortcuts();

	iohook.stop(true);
	iohook.removeAllListeners('mousedown');
	iohook.removeAllListeners('mouseup');
	iohook.removeAllListeners('mousemove');
};
