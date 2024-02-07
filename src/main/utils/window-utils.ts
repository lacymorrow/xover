// https://github.com/sindresorhus/electron-util/blob/main/source/main/window.ts
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
	const window = options?.window ?? activeWindow();
	if (!window) {
		// throw new Error('No active window');
		Logger.error('No active window');
		return;
	}

	Logger.status('Centering window', window.id);
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

export const safeSetBounds = (window: BrowserWindow, bounds: Rectangle) => {
	if (window.isDestroyed()) {
		return;
	}

	// Ensure the window is within the bounds of the screen
	const display = screen.getDisplayMatching(bounds);
	const { workArea } = display;
	const { x, y, width, height } = bounds;

	// Ensure the window is within the bounds of the screen
	if (x < workArea.x) {
		bounds.x = workArea.x;
	}
	if (y < workArea.y) {
		bounds.y = workArea.y;
	}
	if (x + width > workArea.x + workArea.width) {
		bounds.x = workArea.x + workArea.width - width;
	}
	if (y + height > workArea.y + workArea.height) {
		bounds.y = workArea.y + workArea.height - height;
	}

	window.setBounds(bounds);

	// Ensure the window is not minimized
	if (window.isMinimized()) {
		window.restore();
	}
};

export const moveWindowToDisplayEdge = ({
	window,
	direction,
}: {
	window?: BrowserWindow;
	direction: 'up' | 'down' | 'left' | 'right';
}) => {
	if (!window) {
		return;
	}

	const bounds = window.getBounds();
	const display = screen.getDisplayNearestPoint(bounds);

	switch (direction) {
		case 'up':
			bounds.y = display.workArea.y;
			break;
		case 'down':
			bounds.y = display.workArea.y + display.workArea.height - bounds.height;
			break;
		case 'left':
			bounds.x = display.workArea.x;
			break;
		case 'right':
			bounds.x = display.workArea.x + display.workArea.width - bounds.width;
			break;
		default:
			Logger.error('Invalid direction');
	}

	window.setBounds(bounds);
};

export const moveWindow = ({
	window,
	direction,
}: {
	window?: BrowserWindow;
	direction: 'up' | 'down' | 'left' | 'right';
}) => {
	if (!window) {
		return;
	}

	const bounds = window.getBounds();

	switch (direction) {
		case 'up':
			bounds.y -= 1;
			break;
		case 'down':
			bounds.y += 1;
			break;
		case 'left':
			bounds.x -= 1;
			break;
		case 'right':
			bounds.x += 1;
			break;
		default:
			Logger.error('Invalid direction');
	}

	safeSetBounds(window, bounds);
};

// export const onWillResize = (_event, newBounds) => {
// 	if (!newBounds) {
// 		return;
// 	}

// 	// App width/height MUST BE EVEN for followMouse to work
// 	const { height } = newBounds;
// 	let scale = Math.round(height / 100);
// 	scale = scale > 0 ? scale : 1;

// 	log.info(`Setting scale: ${scale}`);

// 	// todo: we're cheating because importing set here causes circular import
// 	windows.win.webContents.send('set_properties', {
// 		'--crosshair-scale': scale,
// 	});
// };

export const forEachWindow = (callback: (window: BrowserWindow) => void) => {
	BrowserWindow.getAllWindows().forEach((win) => {
		callback(win);
	});
};

// -1 to disable
export const setProgress = (percentage: number) => {
	windows.mainWindow.setProgressBar(percentage || -1);
};
