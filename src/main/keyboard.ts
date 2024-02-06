import { CustomAcceleratorsType, KeyboardShortcut } from '@/types/keyboard';
import { app, globalShortcut } from 'electron';
import Logger from 'electron-log';
import windows, { forEachWindow } from './windows';
import store from './store';

import { resetApp } from './reset';
import { toggleAppHide } from './utils/hideApp';
import { toggleAppLock } from './utils/lockApp';
import { activeWindow, centerWindow, moveToNextDisplay } from './utils/windows';

export const keyboardShortcuts: KeyboardShortcut[] = [
	/* Default accelerators */

	// Quit
	{
		action: 'quit',
		fn() {
			app.quit();
		},
	},

	// Reset App
	{
		action: 'reset',
		allowUnbind: true,
		fn() {
			resetApp();
		},
	},

	// Toggle CrossOver
	{
		action: 'lock',
		fn() {
			toggleAppLock();

			// eslint-disable-next-line no-use-before-define
			registerKeyboardShortcuts();
		},
	},

	// Hide Window
	{
		action: 'hide',
		allowUnbind: true,
		fn() {
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

	// Focus next window
	{
		action: 'nextWindow',
		ignoreWhenLocked: true,
		allowUnbind: true,
		fn() {
			// windows.nextWindow();
		},
	},

	// Duplicate main window
	{
		action: 'duplicate',
		ignoreWhenLocked: true,
		allowUnbind: true,
		fn() {
			// crossover.initShadowWindow();
		},
	},

	// Move window up
	{
		action: 'moveUp',
		ignoreWhenLocked: true,
		fn() {
			// windows.moveWindow({ direction: 'up' });
		},
	},

	// Move window down
	{
		action: 'moveDown',
		ignoreWhenLocked: true,
		fn() {
			// windows.moveWindow({ direction: 'down' });
		},
	},

	// Move window left
	{
		action: 'moveLeft',
		ignoreWhenLocked: true,
		fn() {
			// windows.moveWindow({ direction: 'left' });
		},
	},

	// Move window right
	{
		action: 'moveRight',
		ignoreWhenLocked: true,
		fn() {
			// windows.moveWindow({ direction: 'right' });
		},
	},
];

// eslint-disable-next-line no-undef
interface ShortcutType extends Electron.GlobalShortcut {
	registerEscapeKey: () => void;
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
	const { isLocked, isHidden } = store.get('settings');

	// Register all shortcuts
	keyboardShortcuts.forEach((shortcut) => {
		const { action, fn, ignoreWhenLocked } = shortcut;
		const keybind = keybinds[action];

		// Custom shortcuts
		if (
			!action ||
			!fn ||
			!keybind ||
			((isLocked || isHidden) && ignoreWhenLocked)
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

const registerEscapeKey = () => {
	// Register escape key
	globalShortcut.register('Escape', () => {
		Logger.info('Escape key pressed');
		windows.settingsWindow?.hide();
		store.set('settings', {
			...store.get('settings'),
			isSettingsWindowOpen: false,
		});
		globalShortcut.unregister('Escape');
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

		console.log('setKeybind', keybind, accelerator);
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

	// Inherit all methods from Electron's globalShortcut
	...globalShortcut,
};

export default kb;
