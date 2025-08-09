import { BrowserWindow } from 'electron';

export type WindowInstanceType = BrowserWindow | null;

interface WindowsType {
	mainWindow: WindowInstanceType;
	childWindow: WindowInstanceType;
	settingsWindow: WindowInstanceType;
  chooserWindow: WindowInstanceType;
	crosshairWindows: { [key: string]: WindowInstanceType };
	tray: any;
}

// Prevent windows from being garbage collected
const windows: WindowsType = {
	mainWindow: null,
	childWindow: null,
	settingsWindow: null,
  chooserWindow: null,
	crosshairWindows: {},
	tray: null,
};

export default windows;
