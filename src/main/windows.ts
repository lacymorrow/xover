import { BrowserWindow } from 'electron';

export type WindowInstanceType = BrowserWindow | null;

interface WindowsType {
	mainWindow: WindowInstanceType;
	childWindow: WindowInstanceType;
	settingsWindow: WindowInstanceType;
	tray: any;
}

// Prevent windows from being garbage collected
const windows: WindowsType = {
	mainWindow: null,
	childWindow: null,
	settingsWindow: null,
	tray: null,
};

export class Windows {
	main: WindowInstanceType;

	child: WindowInstanceType;

	settings: WindowInstanceType;

	tray: any;

	constructor() {
		this.main = null;
		this.child = null;
		this.settings = null;
		this.tray = null;
	}

	get mainWindow() {
		return this.main;
	}

	set mainWindow(window: WindowInstanceType) {
		this.main = window;
	}

	get childWindow() {
		return this.child;
	}

	set childWindow(window: WindowInstanceType) {
		this.child = window;
	}

	get settingsWindow() {
		return this.settings;
	}

	set settingsWindow(window: WindowInstanceType) {
		this.settings = window;
	}

	get t(): any {
		return this.tray;
	}
}

export const forEachWindow = (callback: (window: BrowserWindow) => void) => {
	BrowserWindow.getAllWindows().forEach((win) => {
		callback(win);
	});
};

export const getWindowBoundsCentered = (options: {
	window?: BrowserWindow;
	size?: { width: number; height: number };
	useFullBounds?: boolean;
}) => {
	options = {
		window: BrowserWindow.getFocusedWindow(),
		...options,
	};

	const currentDisplay = screen.getDisplayNearestPoint(
		screen.getCursorScreenPoint(),
	);
	const [width, height] = options.window.getSize();
	const windowSize = options.size || { width, height };
	const screenSize = options.useFullBounds
		? currentDisplay.bounds
		: currentDisplay.workArea;
	const x = Math.floor(
		screenSize.x + (screenSize.width / 2 - windowSize.width / 2),
	);
	const y = Math.floor(
		(screenSize.height + screenSize.y) / 2 - windowSize.height / 2,
	);

	return {
		x,
		y,
		width: windowSize.width,
		height: windowSize.height,
	};
};

const centerWindow = (options) => {
	options = {
		window: activeWindow(),
		animated: true,
		...options,
	};

	const bounds = getWindowBoundsCentered(options);
	options.window.setBounds(bounds, options.animated);
};

export default windows;
