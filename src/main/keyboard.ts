import { CustomAcceleratorsType, KeyboardShortcut } from '@/types/keyboard';
import { app, globalShortcut } from 'electron';
import Logger from 'electron-log';
import { DEFAULT_KEYBINDS } from '../config/settings';
import { $notifications } from '../config/strings';
import { shouldRegisterKeybind } from '../utils/keybinds';
import store from './store';
import windows from './windows';

import { createDuplicateWindow, createNewWindow } from './create-window';
import { notification } from './notifications';
import { resetSettings } from './reset';
import { getKeybinds, getSetting, setSettings } from './store-actions';
import { toggleAppHide } from './utils/hideApp';
import { toggleAppLock } from './utils/lockApp';
import wayland from './wayland';
import {
	activeCrosshairWindow,
	centerWindow,
	focusNextWindow,
	moveToNextDisplay,
	moveWindow,
} from './utils/window-utils';

export const keyboardShortcuts: KeyboardShortcut[] = [
	/* Default accelerators */

	// Toggle CrossOver
	{
		action: 'lock',
		isSafety: true,
		fn() {
			if (!windows.mainWindow || windows.mainWindow.isDestroyed()) {
				return;
			}

			// setSettings() re-registers the shortcuts on an isLocked change, so
			// every path that locks gets it, not just this one (LAC-5839).
			toggleAppLock();
		},
	},

	// Quit
	{
		action: 'quit',
		allowUnbind: true,
		fn() {
			app.quit();
		},
	},

	// Reset App
	{
		action: 'reset',
		allowUnbind: true,
		isSafety: true,
		fn() {
			resetSettings();
		},
	},

	// Hide Window
	{
		action: 'hide',
		allowUnbind: true,
		fn() {
			if (!windows.mainWindow || windows.mainWindow.isDestroyed()) {
				return;
			}

			toggleAppHide();
		},
	},

	// Toggle the reticle (centre sight) without touching the crosshair image
	{
		action: 'hideReticle',
		allowUnbind: true,
		fn() {
			setSettings({ isReticleHidden: !getSetting('isReticleHidden') });
		},
	},

	// Center Window
	{
		action: 'center',
		ignoreWhenLocked: true,
		allowUnbind: true,
		fn() {
			// Crosshair windows only. `activeWindow()` here centered the settings
			// window whenever it had focus (LAC-5839).
			const win = activeCrosshairWindow();
			if (!win) {
				return;
			}

			centerWindow({ window: win, animated: true });
		},
	},

	// Move to next display
	{
		action: 'changeDisplay',
		ignoreWhenLocked: true,
		allowUnbind: true,
		fn() {
			moveToNextDisplay();
		},
	},

	// New window
	{
		action: 'newWindow',
		ignoreWhenLocked: true,
		allowUnbind: true,
		fn() {
			createNewWindow();
		},
	},

	// Duplicate window
	{
		action: 'duplicateWindow',
		ignoreWhenLocked: true,
		allowUnbind: true,
		fn() {
			createDuplicateWindow();
		},
	},

	// Focus next window
	{
		action: 'focusNextWindow',
		ignoreWhenLocked: true,
		allowUnbind: true,
		fn() {
			focusNextWindow();
		},
	},

	// Move window up
	{
		action: 'moveUp',
		ignoreWhenLocked: true,
		fn() {
			moveWindow({ direction: 'up' });
		},
	},

	// Move window down
	{
		action: 'moveDown',
		ignoreWhenLocked: true,
		fn() {
			moveWindow({ direction: 'down' });
		},
	},

	// Move window left
	{
		action: 'moveLeft',
		ignoreWhenLocked: true,
		fn() {
			moveWindow({ direction: 'left' });
		},
	},

	// Move window right
	{
		action: 'moveRight',
		ignoreWhenLocked: true,
		fn() {
			moveWindow({ direction: 'right' });
		},
	},
];

// eslint-disable-next-line no-undef
interface ShortcutType extends Electron.GlobalShortcut {
	registerKeyboardShortcuts: () => void;
	setKeybind: (
		keybinds: keyof CustomAcceleratorsType,
		accelerator: string,
	) => void;
	setKeybinds: (keybinds: Partial<CustomAcceleratorsType>) => void;
}

// registerKeyboardShortcuts() re-runs on every lock toggle and every rebind, so
// the same conflict would notify over and over. Only a change in which combos
// are failing is news.
let lastNotifiedConflicts = '';

// Same reason, but there is only ever one Wayland verdict per run, so once is
// the whole budget.
let waylandNoticeShown = false;

// A native Wayland compositor accepts the registration and then never delivers
// the key, so `registered === true` says nothing here. Say it plainly instead of
// leaving the user with shortcuts that save and then do nothing (GH #456).
const warnIfShortcutsBlocked = (registeredCount: number) => {
	// Nothing bound, so a notice about shortcuts not firing would be noise.
	if (registeredCount === 0) {
		return;
	}

	const blocked = wayland.shortcutsBlockedReason();

	if (!blocked) {
		return;
	}

	Logger.warn(`Shortcuts cannot fire: ${blocked}`);

	if (!waylandNoticeShown) {
		waylandNoticeShown = true;
		notification($notifications.shortcutsBlocked(blocked));
	}
};

const registerKeyboardShortcuts = () => {
	const keybinds = getKeybinds();
	const { allowDisableKeyboardShortcuts, isLocked, isHidden } =
		store.get('settings');

	// Collect all new shortcuts first, then swap atomically
	const toRegister: Array<{ keybind: string; fn: () => void }> = [];

	if (allowDisableKeyboardShortcuts) {
		Logger.info('All keybinds disabled except Lock and Reset');
	}

	keyboardShortcuts.forEach((shortcut) => {
		const { action, fn } = shortcut;
		const keybind = keybinds[action];

		if (
			!fn ||
			!shouldRegisterKeybind(shortcut, keybind, {
				allDisabled: allowDisableKeyboardShortcuts,
				isLocked,
				isHidden,
			})
		) {
			Logger.info(`No keybind for ${action}`);
			return;
		}

		Logger.info(`Keybind for ${action} is ${keybind}`);
		toRegister.push({ keybind: keybind as string, fn });
	});

	// Unregister old shortcuts and register new ones
	globalShortcut.unregisterAll();

	const failed: string[] = [];

	toRegister.forEach(({ keybind, fn }) => {
		try {
			// register() returns false on a conflict rather than throwing
			const registered = globalShortcut.register(keybind, () => {
				fn();
			});

			if (!registered) {
				failed.push(keybind);
			}
		} catch (error) {
			Logger.error(`Failed to register shortcut ${keybind}:`, error);
			failed.push(keybind);
		}
	});

	const conflicts = failed.join(', ');

	// Diagnostics: the log is the only place a user can see what actually bound.
	Logger.info(
		`Shortcuts registered (${toRegister.length - failed.length}/${
			toRegister.length
		}). ${wayland.debugInfo()}`,
	);

	if (failed.length > 0) {
		Logger.warn(`Could not register shortcuts: ${conflicts}`);
	}

	warnIfShortcutsBlocked(toRegister.length - failed.length);

	if (conflicts !== lastNotifiedConflicts) {
		lastNotifiedConflicts = conflicts;

		if (failed.length > 0) {
			notification($notifications.shortcutConflict(failed));
		}
	}
};

const kb: ShortcutType = {
	registerKeyboardShortcuts,

	setKeybind: (keybind: keyof CustomAcceleratorsType, accelerator: string) => {
		const keybinds = getKeybinds();

		// Unknown action. Checked against the defaults and not against the keys
		// the store happens to have: a store written by an older version is
		// missing every action added since, and checking it there dropped the
		// write without a word (LAC-5839).
		if (!(keybind in DEFAULT_KEYBINDS)) {
			return;
		}

		const shortcut = keyboardShortcuts.find((s) => s.action === keybind);

		// No accelerator, remove keybind if allowed
		if (!accelerator && !shortcut?.allowUnbind) {
			return;
		}

		keybinds[keybind] = accelerator;
		store.set('keybinds', keybinds);
		registerKeyboardShortcuts();
		// Sync with renderer
		windows.settingsWindow?.webContents.send('app-updated'); // TODO: ipcChannels.APP_UPDATED, we hard-coded this to prevent circular imports
	},

	setKeybinds: (keybinds: Partial<CustomAcceleratorsType>) => {
		const currentKeybinds = getKeybinds();

		store.set('keybinds', {
			...currentKeybinds,
			...keybinds,
		});

		// todo: this doesn't send to renderer...

		registerKeyboardShortcuts();

		// Sync with renderer
		windows.settingsWindow?.webContents.send('app-updated'); // TODO: ipcChannels.APP_UPDATED, we hard-coded this to prevent circular imports
	},

	// Delegate to Electron's globalShortcut. Spreading `...globalShortcut`
	// copies the native methods without their receiver, so calling
	// `kb.unregisterAll()` threw "Illegal invocation: Function must be called
	// on an object of type GlobalShortcut" on quit (releaseInput).
	register: (accelerator, callback) =>
		globalShortcut.register(accelerator, callback),
	registerAll: (accelerators, callback) =>
		globalShortcut.registerAll(accelerators, callback),
	isRegistered: (accelerator) => globalShortcut.isRegistered(accelerator),
	unregister: (accelerator) => globalShortcut.unregister(accelerator),
	unregisterAll: () => globalShortcut.unregisterAll(),
};

export default kb;
