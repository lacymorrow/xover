import {
	BrowserWindow,
	Menu,
	MenuItemConstructorOptions,
	app,
	shell,
} from 'electron';
import { packageJsonFields } from '../config/config';

import dock from './dock';
import {
	aboutMenuItem,
	getAutoUpdateMenuItem,
	quitMenuItem,
	testNotificationMenuItem,
	testSoundMenuItem,
} from './menu-items';
import { getSetting, setSettings } from './store-actions';
import { is } from './util';
import { openSettingsWindow } from './utils/settingsWindow';
import windows from './windows';

// import { bugs, homepage } from '../../package.json';
const { bugs, homepage } = packageJsonFields;

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
	selector?: string;
	submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

/**
 * The Settings accelerator (Cmd/Ctrl+,) lives in the menu rather than in the
 * keybinds list, which makes it the one shortcut a user cannot clear
 * individually. The master switch has to reach it too, or "disable all
 * keybinds" is not telling the truth. v3 #299.
 */
export const settingsAccelerator = (): { accelerator?: string } => {
	if (getSetting('allowDisableKeyboardShortcuts')) {
		return {};
	}

	return { accelerator: is.macos ? 'Command+,' : 'Ctrl+,' };
};

export default class MenuBuilder {
	mainWindow: BrowserWindow;

	constructor(mainWindow: BrowserWindow) {
		this.mainWindow = mainWindow;
	}

	buildMenu(): Menu {
		const template = is.macos
			? this.buildDarwinTemplate()
			: this.buildDefaultTemplate();

		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);

		return menu;
	}

	subMenuDev: MenuItemConstructorOptions = {
		label: 'Dev',
		submenu: [
			{
				label: 'Reload',
				accelerator: 'Command+R',
				click: () => {
					this.mainWindow.webContents.reload();
				},
				id: 'reload',
			},
			{
				label: 'Toggle Developer Tools',
				accelerator: 'Alt+Command+I',
				click: () => {
					this.mainWindow.webContents.toggleDevTools();
				},
				id: 'toggleDevTools',
			},
			testNotificationMenuItem,
			testSoundMenuItem,
		],
	};

	subMenuSettings: MenuItemConstructorOptions = {
		label: 'Settings',
		submenu: [
			getAutoUpdateMenuItem(),
			{
				label: 'Show Tray Icon',
				type: 'checkbox',
				id: 'showTrayIcon',
				checked: () => getSetting('showTrayIcon'),
				click: () => {
					setSettings({ showTrayIcon: !getSetting('showTrayIcon') });
				},
			},
			{
				label: 'Quit on Close',
				type: 'checkbox',
				id: 'quitOnWindowClose',
				checked: () => getSetting('quitOnWindowClose'),
				click: () => {
					setSettings({
						quitOnWindowClose: !getSetting('quitOnWindowClose'),
					});
				},
			},
		],
	};

	subMenuHelp: MenuItemConstructorOptions = {
		label: 'Help',
		submenu: [
			...(!is.macos ? [aboutMenuItem] : []),
			{
				label: 'Learn More',
				click() {
					shell.openExternal(homepage);
				},
				id: 'learnMore',
			},
			{
				label: 'Report an Issue...',
				click() {
					shell.openExternal(bugs);
				},
				id: 'documentation',
			},
		],
	};

	buildDarwinTemplate(): MenuItemConstructorOptions[] {
		const subMenuAbout: DarwinMenuItemConstructorOptions = {
			label: app.name,
			submenu: [
				aboutMenuItem,
				{ type: 'separator' },
				{
					id: 'preferences',
					label: `Settings\u2026`,
					...settingsAccelerator(),
					click: () => {
						openSettingsWindow();
					},
				},
				{ type: 'separator' },
				{
					label: 'Services',
				},
				{ type: 'separator' },
				{
					id: 'hide',
					label: `Hide ${app.name}`,
					accelerator: 'Command+H',
					selector: 'hide:',
				},
				{
					id: 'hideOthers',
					label: 'Hide Others',
					accelerator: 'Command+Shift+H',
					selector: 'hideOtherApplications:',
				},
				{
					id: 'showAll',
					label: 'Show All',
					selector: 'unhideAllApplications:',
				},
				{ type: 'separator' },
				{
					id: 'quit',
					label: `Quit ${app.name}`,
					accelerator: 'Command+Q',
					click: () => {
						app.quit();
					},
				},
			],
		};
		const subMenuEdit: DarwinMenuItemConstructorOptions = {
			label: 'Edit',
			submenu: [
				{
					label: 'Undo',
					accelerator: 'Command+Z',
					selector: 'undo:',
					id: 'undo',
				},
				{
					label: 'Redo',
					accelerator: 'Shift+Command+Z',
					selector: 'redo:',
					id: 'redo',
				},
				{ type: 'separator' },
				{ label: 'Cut', accelerator: 'Command+X', selector: 'cut:', id: 'cut' },
				{
					label: 'Copy',
					accelerator: 'Command+C',
					selector: 'copy:',
					id: 'copy',
				},
				{
					label: 'Paste',
					accelerator: 'Command+V',
					selector: 'paste:',
					id: 'paste',
				},
				{
					label: 'Select All',
					accelerator: 'Command+A',
					selector: 'selectAll:',
					id: 'selectAll',
				},
			],
		};
		const subMenuViewDev: MenuItemConstructorOptions = {
			label: 'View',
			submenu: [
				{
					label: 'Reload',
					accelerator: 'Command+R',
					click: () => {
						this.mainWindow.webContents.reload();
					},
					id: 'reload',
				},
				{
					label: 'Toggle Full Screen',
					accelerator: 'Ctrl+Command+F',
					click: () => {
						this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
					},
					id: 'toggleFullScreen',
				},
			],
		};
		const subMenuViewProd: MenuItemConstructorOptions = {
			label: 'View',
			submenu: [
				{
					label: 'Toggle Full Screen',
					accelerator: 'Ctrl+Command+F',
					click: () => {
						this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
					},
					id: 'toggleFullScreen',
				},
			],
		};
		const subMenuWindow: DarwinMenuItemConstructorOptions = {
			label: 'Window',
			submenu: [
				{
					label: 'Minimize',
					accelerator: 'Command+M',
					selector: 'performMiniaturize:',
					id: 'minimize',
				},
				{
					label: 'Close',
					accelerator: 'Command+W',
					selector: 'performClose:',
					id: 'close',
				},
				{ type: 'separator' },
				{
					label: 'Bring All to Front',
					selector: 'arrangeInFront:',
					id: 'bringToFront',
				},
			],
		};

		const subMenuView =
			process.env.NODE_ENV === 'development' ||
			process.env.DEBUG_PROD === 'true'
				? subMenuViewDev
				: subMenuViewProd;

		return [
			subMenuAbout,
			subMenuEdit,
			subMenuView,
			subMenuWindow,
			this.subMenuSettings,
			this.subMenuHelp,
			...(is.debug ? [this.subMenuDev] : []),
		];
	}

	buildDefaultTemplate() {
		const templateDefault = [
			{
				label: '&File',
				submenu: [
					{
						label: '&Open',
						accelerator: 'Ctrl+O',
						id: 'open',
					},
					{ type: 'separator' as const },
					{
						label: '&Settings',
						...settingsAccelerator(),
						id: 'preferences',
						click: () => {
							openSettingsWindow();
						},
					},
					{ type: 'separator' as const },
					{
						label: '&Close',
						accelerator: 'Ctrl+W',
						click: () => {
							const focusedWindow =
								BrowserWindow.getFocusedWindow() || this.mainWindow;
							focusedWindow.close();
						},
						id: 'close',
					},
				],
			},
			{
				label: '&View',
				submenu:
					process.env.NODE_ENV === 'development' ||
					process.env.DEBUG_PROD === 'true'
						? [
								{
									label: '&Reload',
									accelerator: 'Ctrl+R',
									click: () => {
										this.mainWindow.webContents.reload();
									},
									id: 'reload',
								},
								{
									label: 'Toggle &Full Screen',
									accelerator: 'F11',
									click: () => {
										this.mainWindow.setFullScreen(
											!this.mainWindow.isFullScreen(),
										);
									},
									id: 'toggleFullScreen',
								},
								{
									label: 'Toggle &Developer Tools',
									accelerator: 'Alt+Ctrl+I',
									click: () => {
										this.mainWindow.webContents.toggleDevTools();
									},
									id: 'toggleDevTools',
								},
								testNotificationMenuItem,
							]
						: [
								{
									label: 'Toggle &Full Screen',
									accelerator: 'F11',
									click: () => {
										this.mainWindow.setFullScreen(
											!this.mainWindow.isFullScreen(),
										);
									},
									id: 'toggleFullScreen',
								},
							],
			},
			this.subMenuSettings,
			this.subMenuHelp,
			...(is.debug ? [this.subMenuDev] : []),
		];

		return templateDefault;
	}
}

/**
 * Rebuild the application menu in place. The Settings accelerator is read at
 * build time, so flipping the master switch has no visible effect until the
 * menu is rebuilt.
 */
export const rebuildApplicationMenu = () => {
	const window =
		windows.mainWindow && !windows.mainWindow.isDestroyed()
			? windows.mainWindow
			: BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

	if (!window) {
		return;
	}

	new MenuBuilder(window).buildMenu();
};

export const setupDockMenu = () => {
	if (!is.macos) return;
	const dockMenu = Menu.buildFromTemplate([aboutMenuItem, quitMenuItem]);
	app.dock?.setMenu(dockMenu);
	dock.initialize();
};
