import { BrowserWindow, Rectangle, Size, screen } from 'electron';
import Logger from 'electron-log';
import { Display } from 'electron/main';
import { is } from '../util';
import { WindowInstanceType } from '../windows';

export type GetWindowBoundsCenteredOptions = {
	/**
	The window to get the bounds of.

	Default: Current window
	*/
	readonly window?: BrowserWindow;

	/**
	Set a new window size.

	Default: Size of `window`

	@example
	```
	{width: 600, height: 400}
	```
	*/
	readonly size?: Size;

	/**
	Use the full display size when calculating the position.
	By default, only the workable screen area is used, which excludes the Windows taskbar and macOS dock.

	@default false
	*/
	readonly useFullBounds?: boolean;

	/**
	Display
	*/
	readonly display?: Display;
};

export type CenterWindowOptions = {
	/**
	The window to center.

	Default: Current window
	*/
	readonly window?: BrowserWindow;

	/**
	Set a new window size.

	Default: Size of `window`

	@example
	```
	{width: 600, height: 400}
	```
	*/
	readonly size?: Size;

	/**
	Animate the change.

	@default false
	*/
	readonly animated?: boolean;

	/**
	Use the full display size when calculating the position.
	By default, only the workable screen area is used, which excludes the Windows taskbar and macOS dock.

	@default false
	*/
	readonly useFullBounds?: boolean;

	/**
	Display
	*/
	readonly display?: Display;
};

export const activeWindow = () => BrowserWindow.getFocusedWindow();

/**
@returns The height of the menu bar on macOS, or `0` if not macOS.
*/
export const menuBarHeight = () =>
	is.macos ? screen.getPrimaryDisplay().workArea.y : 0;

/**
Get the [bounds](https://electronjs.org/docs/api/browser-window#wingetbounds) of a window as if it was centered on the screen.

@returns Bounds of a window.
*/
export const getWindowBoundsCentered = (
	options?: GetWindowBoundsCenteredOptions,
): Rectangle => {
	const window = options?.window ?? activeWindow();
	if (!window) {
		throw new Error('No active window');
	}

	const [width, height] = window.getSize();
	const windowSize = (options?.size ?? { width, height }) as Size;
	const screenSize =
		options?.display?.workArea ||
		screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
	const x = Math.floor(
		screenSize.x + screenSize.width / 2 - (windowSize.width ?? 0) / 2,
	);
	const y = Math.floor(
		(screenSize.height + screenSize.y) / 2 - (windowSize.height ?? 0) / 2,
	);

	return {
		x,
		y,
		...windowSize,
	};
};

/**
Center a window on the screen.
*/
export const centerWindow = (options?: CenterWindowOptions) => {
	Logger.status('Centering window');
	const window = options?.window ?? activeWindow();
	if (!window) {
		throw new Error('No active window');
	}

	const opts = {
		window,
		animated: false,
		useFullBounds: false,
		...options,
	};

	const bounds = getWindowBoundsCentered(opts);
	window.setBounds(bounds, opts.animated);
};

export const isWindowCentered = (window: WindowInstanceType) => {
	if (!window) return false;
	const centered = getWindowBoundsCentered({ window, useFullBounds: true });
	const bounds = window.getBounds();
	return centered.x === bounds.x && centered.y === bounds.y;
};

export const moveToNextDisplay = (options?: { window?: BrowserWindow }) => {
	const opts = {
		window: activeWindow(), // default to active window
		...options,
	};

	if (!opts.window) {
		return;
	}

	Logger.status('Moving window to next display');

	// Get list of displays
	const displays = screen.getAllDisplays();

	// Get current display
	const currentDisplay = screen.getDisplayNearestPoint(opts.window.getBounds());

	// Get index of current
	let index = displays.map((element) => element.id).indexOf(currentDisplay.id);

	// Increment and save
	index = (index + 1) % displays.length;

	// Center
	centerWindow({
		display: displays[index],
		window: opts.window,
	});
};
