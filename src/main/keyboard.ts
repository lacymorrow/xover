import { globalShortcut } from 'electron';

// eslint-disable-next-line no-undef
interface ShortcutType extends Electron.GlobalShortcut {
	init: () => void;
}

const keyboardShortcuts = () => {
	/* Default accelerator */
	const accelerator = 'Control+Shift+Alt';

	return [
		// Toggle CrossOver
		{
			action: 'lock',
			keybind: `${accelerator}+X`,
			triggerWhileLocked: true,
			fn() {
				// crossover.toggleWindowLock();
			},
		},

		// Center CrossOver
		{
			action: 'center',
			keybind: `${accelerator}+C`,
			triggerWhileLocked: true,
			fn() {
				// sound.play('CENTER');
				// windows.center();
			},
		},
		// Hide CrossOver
		{
			action: 'hide',
			keybind: `${accelerator}+H`,
			triggerWhileLocked: true,
			fn() {
				// windows.showHideWindow();
			},
		},

		// Quit CrossOver
		{
			action: 'quit',
			keybind: `${accelerator}+Q`,
			triggerWhileLocked: true,
			fn() {
				// crossover.quit();
			},
		},

		// Reset CrossOver
		{
			action: 'reset',
			keybind: `${accelerator}+R`,
			triggerWhileLocked: true,
			fn() {
				// reset.app();
			},
		},

		// Single pixel movement
		{
			action: 'moveUp',
			keybind: `${accelerator}+Up`,
			triggerWhileLocked: true,
			fn() {
				// windows.moveWindow({ direction: 'up' });
			},
		},
		{
			action: 'moveDown',
			keybind: `${accelerator}+Down`,
			triggerWhileLocked: true,
			fn() {
				// windows.moveWindow({ direction: 'down' });
			},
		},
		{
			action: 'moveLeft',
			keybind: `${accelerator}+Left`,
			triggerWhileLocked: true,
			fn() {
				// windows.moveWindow({ direction: 'left' });
			},
		},
		{
			action: 'moveRight',
			keybind: `${accelerator}+Right`,
			triggerWhileLocked: true,
			fn() {
				// windows.moveWindow({ direction: 'right' });
			},
		},

		/* Not triggerable while locked (by default) */

		// Focus next window
		{
			action: 'nextWindow',
			keybind: `${accelerator}+O`,
			triggerWhileLocked: false,
			fn() {
				// windows.nextWindow();
			},
		},

		// Move CrossOver to next monitor
		{
			action: 'changeDisplay',
			keybind: `${accelerator}+M`,
			triggerWhileLocked: false,
			fn() {
				// windows.moveToNextDisplay();
			},
		},

		// Duplicate main window
		{
			action: 'duplicate',
			keybind: `${accelerator}+D`,
			triggerWhileLocked: false,
			async fn() {
				// await crossover.initShadowWindow();
			},
		},
	];
};

// const registerKeyboardShortcuts = () => {
// 	// Register all shortcuts
// 	const { keybinds } = Preferences.getDefaults();
// 	const custom = preferences.value('keybinds'); // Defaults
// 	keyboardShortcuts().forEach((shortcut) => {
// 		// Custom shortcuts
// 		if (custom[shortcut.action] === '') {
// 			// log.info(`Clearing keybind for ${shortcut.action}`);
// 		} else if (
// 			custom[shortcut.action] &&
// 			keybinds[shortcut.action] &&
// 			custom[shortcut.action] !== keybinds[shortcut.action]
// 		) {
// 			// If a custom shortcut exists for this action
// 			// log.info(`Custom keybind for ${shortcut.action}`);
// 			keyboard.registerShortcut(custom[shortcut.action], shortcut.fn);
// 		} else if (keybinds[shortcut.action]) {
// 			// Set default keybind
// 			keyboard.registerShortcut(keybinds[shortcut.action], shortcut.fn);
// 		} else {
// 			// Fallback to internal bind - THIS SHOULDNT HAPPEN
// 			// if it does you forgot to add a default keybind for this shortcut
// 			// log.info(
// 			// 	'ERROR - you likely forgot to add a default keybind for this shortcut: ',
// 			// 	shortcut,
// 			// );
// 			keyboard.registerShortcut(shortcut.keybind, shortcut.fn);
// 		}
// 	});
// };

const kb: ShortcutType = {
	init: () => {
		// globalShortcut.register('CommandOrControl+Shift+I', () => {
		// ...
		// });
	},

	// Inherit all methods from Electron's globalShortcut
	...globalShortcut,
};

export default kb;
