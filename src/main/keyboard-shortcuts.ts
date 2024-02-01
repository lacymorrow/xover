import { KeyboardShortcut } from '@/types/keyboard';
import { app } from 'electron';
import { toggleAppLock } from './helpers/lockApp';
import { resetApp } from './reset';
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

	// Center Window
	{
		action: 'center',
		fn() {
			windows?.mainWindow?.center();
		},
	},

	// Hide Window
	{
		action: 'hide',
		fn() {
			// windows.showHideWindow();
		},
	},

	// Move to next display
	{
		action: 'changeDisplay',
		fn() {
			// windows.moveToNextDisplay();
		},
	},

	// Focus next window
	{
		action: 'nextWindow',
		fn() {
			// windows.nextWindow();
		},
	},

	// Duplicate main window
	{
		action: 'duplicate',
		fn() {
			// crossover.initShadowWindow();
		},
	},

	// Move window up
	{
		action: 'moveUp',
		fn() {
			// windows.moveWindow({ direction: 'up' });
		},
	},

	// Move window down
	{
		action: 'moveDown',
		fn() {
			// windows.moveWindow({ direction: 'down' });
		},
	},

	// Move window left
	{
		action: 'moveLeft',
		fn() {
			// windows.moveWindow({ direction: 'left' });
		},
	},

	// Move window right
	{
		action: 'moveRight',
		fn() {
			// windows.moveWindow({ direction: 'right' });
		},
	},
];
