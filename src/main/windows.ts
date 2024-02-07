import { BrowserWindow } from 'electron';

export type WindowInstanceType = BrowserWindow | null;

interface WindowsType {
	mainWindow: WindowInstanceType;
	childWindow: WindowInstanceType;
	settingsWindow: WindowInstanceType;
	crosshairWindows: WindowInstanceType[];
	tray: any;
}

// Prevent windows from being garbage collected
const w: WindowsType = {
	mainWindow: null,
	childWindow: null,
	settingsWindow: null,
	crosshairWindows: [],
	tray: null,
};

export default w;
