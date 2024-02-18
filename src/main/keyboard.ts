import { app, globalShortcut } from 'electron';
import Logger from 'electron-log';
import { CustomAcceleratorsType, KeyboardShortcut } from '../types/keyboard';
import store from './store';
import windows from './windows';

import { createDuplicateWindow, createNewWindow } from './create-window';
import { resetSettings } from './reset';
import { toggleAppHide } from './utils/hideApp';
import { toggleAppLock } from './utils/lockApp';
import {
	activeWindow,
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
		fn() {
			if (!windows.mainWindow || windows.mainWindow.isDestroyed()) {
				return;
			}

			toggleAppLock();

			// eslint-disable-next-line no-use-before-define
			registerKeyboardShortcuts();
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

			// eslint-disable-next-line no-use-before-define
			registerKeyboardShortcuts();
		},
	},

	// Center Window
	{
		action: 'center',
		ignoreWhenLocked: true,
		allowUnbind: true,
		fn() {
			const win = activeWindow() || windows.mainWindow;
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
	registerEscapeKey: () => void;
	unregisterEscapeKey: () => void;
	registerKeyboardShortcuts: () => void;
	setKeybind: (
		keybinds: keyof CustomAcceleratorsType,
		accelerator: string,
	) => void;
	setKeybinds: (keybinds: Partial<CustomAcceleratorsType>) => void;
}

const registerKeyboardShortcuts = () => {
	globalShortcut.unregisterAll();

	const keybinds = store.get('keybinds');
	const { allowDisableKeyboardShortcuts, isLocked, isHidden } =
		store.get('settings');

	// Register all shortcuts
	keyboardShortcuts.forEach((shortcut) => {
		const { action, fn, ignoreWhenLocked } = shortcut;
		const keybind = keybinds[action];

		if (isLocked && allowDisableKeyboardShortcuts && action !== 'lock') {
			// Disable shortcuts except for lock
			return;
		}

		// Custom shortcuts
		if (
			!action ||
			!fn ||
			!keybind ||
			((isLocked || isHidden) && ignoreWhenLocked) ||
			(isLocked && allowDisableKeyboardShortcuts && action !== 'lock')
		) {
			// Disable shortcut
			Logger.info(`No keybind for ${action}`);
			return;
		}

		// If a keybinds shortcut exists for this action
		Logger.info(`Keybind for ${action} is ${keybind}`);
		globalShortcut.register(keybind, () => {
			// Do the thing
			fn();
		});
	});
};

const unregisterEscapeKey = () => {
	globalShortcut.unregister('Escape');
};

const registerEscapeKey = () => {
	// Register escape key
	globalShortcut.register('Escape', () => {
		Logger.info('Escape key pressed');
		windows.settingsWindow?.hide();
		store.set('settings', {
			...store.get('settings'),
			isSettingsWindowOpen: false,
		});
		unregisterEscapeKey();
	});
};

const kb: ShortcutType = {
	registerKeyboardShortcuts,

	setKeybind: (keybind: keyof CustomAcceleratorsType, accelerator: string) => {
		const keybinds = store.get('keybinds');

		// Invalid keybind
		if (!(keybind in keybinds)) {
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
		const currentKeybinds = store.get('keybinds');

		store.set('keybinds', {
			...currentKeybinds,
			...keybinds,
		});

		// todo: this doesn't send to renderer...

		registerKeyboardShortcuts();

		// Sync with renderer
		windows.settingsWindow?.webContents.send('app-updated'); // TODO: ipcChannels.APP_UPDATED, we hard-coded this to prevent circular imports
	},

	registerEscapeKey,
	unregisterEscapeKey,

	// Inherit all methods from Electron's globalShortcut
	...globalShortcut,
};

export default kb;
