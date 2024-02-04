import { KeyboardShortcut } from '@/types/keyboard';
import { app } from 'electron';
import { resetApp } from './reset';
import { toggleAppLock } from './utils/lockApp';
import { activeWindow, centerWindow } from './utils/windows';
import windows from './windows';

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
		fn() {
			resetApp();
		},
	},

	// Toggle CrossOver
	{
		action: 'lock',
		fn() {
			toggleAppLock();
		},
	},

	// Hide Window
	{
		action: 'hide',
		fn() {
			// windows.showHideWindow();
		},
	},

	// Center Window
	{
		action: 'center',
		ignoreWhenLocked: true,
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
		fn() {
			// windows.moveToNextDisplay();
		},
	},

	// Focus next window
	{
		action: 'nextWindow',
		ignoreWhenLocked: true,
		fn() {
			// windows.nextWindow();
		},
	},

	// Duplicate main window
	{
		action: 'duplicate',
		ignoreWhenLocked: true,
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
