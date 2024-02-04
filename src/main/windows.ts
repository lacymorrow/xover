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

export default windows;
