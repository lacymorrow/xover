// https://github.com/sindresorhus/electron-util/blob/main/source/main/window.ts
import { BrowserWindow, Rectangle, Size, screen } from 'electron';
import Logger from 'electron-log';
import { Display } from 'electron/main';
import { $actions, $errors } from '../../config/strings';
import { is } from '../util';
import windows, { WindowInstanceType } from '../windows';

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

/** Every live window except the settings window. */
const crosshairWindows = () =>
	BrowserWindow.getAllWindows().filter(
		(win) => win !== windows.settingsWindow && !win.isDestroyed(),
	);

/**
 * The crosshair window a global shortcut should act on.
 *
 * Never the settings window. The shortcuts center, move and duplicate the
 * overlay, and with Settings focused `getFocusedWindow()` hands back the
 * settings window, so Center Crosshair centered Settings instead (LAC-5839).
 *
 * A locked crosshair is `focusable: false` and the user is in a game, so in the
 * case these shortcuts exist for nothing of ours is focused at all. Hence the
 * fallback to the main window: returning the focused window alone made every
 * move and display shortcut a no-op while locked.
 */
export const activeCrosshairWindow = (): BrowserWindow | undefined => {
	const focused = activeWindow();

	if (focused && !focused.isDestroyed() && focused !== windows.settingsWindow) {
		return focused;
	}

	const { mainWindow } = windows;

	if (mainWindow && !mainWindow.isDestroyed()) {
		return mainWindow;
	}

	return crosshairWindows()[0];
};

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
		throw new Error($errors.noActiveWindow);
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
	if (!window || window.isDestroyed()) {
		Logger.error($errors.noActiveWindow);
		return;
	}

	Logger.status($actions.centerWindow, window.id);
	const opts = {
		window,
		animated: true,
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
		window: activeCrosshairWindow(), // default to active crosshair window
		...options,
	};

	if (!opts.window) {
		return;
	}

	Logger.status($actions.moveToNextDisplay);

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
	if (!window || window.isDestroyed()) {
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

	window.setBounds(bounds, true);

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
			Logger.error($errors.invalidDirection, direction);
	}

	window.setBounds(bounds, true);
};

export const moveWindow = ({
	window,
	direction,
}: {
	window?: BrowserWindow;
	direction: 'up' | 'down' | 'left' | 'right';
}) => {
	const win = window || activeCrosshairWindow();

	if (!win) {
		return;
	}

	const bounds = win.getBounds();

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
			Logger.error($errors.invalidDirection, direction);
	}

	safeSetBounds(win, bounds);
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

export const forEachCrosshairWindow = (
	callback: (window: BrowserWindow) => void,
) => {
	crosshairWindows().forEach((win) => {
		callback(win);
	});
};

/**
 * Exclude a window from screen captures and recordings, or stop excluding it.
 *
 * Maps to WDA_EXCLUDEFROMCAPTURE on Windows 10+ and NSWindowSharingNone on
 * macOS. The crosshair stays visible on the physical screen either way; it just
 * stops appearing in OBS, GeForce Instant Replay and screenshots.
 * Ported from v3 #359 / #522.
 */
export const applyContentProtection = (
	window: BrowserWindow,
	enabled: boolean,
) => {
	if (!window || window.isDestroyed()) {
		return;
	}

	try {
		window.setContentProtection(enabled);
	} catch (error) {
		Logger.error('setContentProtection failed:', error);
	}
};

/**
 * Re-apply hideFromScreenCapture to every crosshair window, so the toggle takes
 * effect without a restart. The settings window is deliberately left alone: a
 * protected settings window cannot be screenshotted at all, which would break
 * bug reports and QA captures.
 */
export const syncContentProtection = (enabled: boolean) => {
	forEachCrosshairWindow((win) => applyContentProtection(win, enabled));
};

// -1 to disable
export const setProgress = (percentage: number) => {
	windows.mainWindow?.setProgressBar(percentage || -1);
};

export const closeAllWindows = () => {
	forEachWindow((win) => {
		win.close();
	});
};

/**
 * Move focus to the next crosshair window.
 *
 * The settings window is left out of the cycle: this is bound to a global
 * shortcut whose job is to pick which crosshair the move and center shortcuts
 * act on, and it is also what closeSettingsWindow() hands focus to on the way
 * out (LAC-5839).
 */
export const focusNextWindow = () => {
	const candidates = crosshairWindows();

	if (candidates.length === 0) {
		return;
	}

	const focusedWindow = activeWindow();
	const focusedIndex = focusedWindow ? candidates.indexOf(focusedWindow) : -1;
	const nextWindow = candidates[(focusedIndex + 1) % candidates.length];

	nextWindow.focus();
};

// grab an available crosshair window
export const getNextCrosshairWindow = () => crosshairWindows()[0];

export const getWindowById = (id: string) => {
	if (id in windows.crosshairWindows) {
		return windows.crosshairWindows[id];
	}
};
