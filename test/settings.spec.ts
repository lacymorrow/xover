import { expect, test } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import {
	closeApp,
	delays,
	focusedMinimizedVisible,
	getWindowTitles,
	PRODUCT_NAME,
	SETTINGS_WINDOW,
	startApp,
	wait,
} from './helpers';

let electronApp: ElectronApplication;
let mainPage: Page;

test.beforeAll(async () => {
	const app = await startApp();
	electronApp = app.electronApp;
	mainPage = app.mainPage;
});

test.afterAll(closeApp);

test('Settings button opens settings window', async () => {
	const settingsBtn = mainPage.locator('[data-testid="settings-button"]');
	await settingsBtn.click();
	await wait(delays.medium);

	const titles = await getWindowTitles(electronApp);
	console.log('Windows after settings click:', titles);

	const { focused, minimized, visible } = await focusedMinimizedVisible({
		electronApp,
		windowName: SETTINGS_WINDOW,
	});

	expect(focused).toBe(true);
	expect(minimized).toBe(false);
	expect(visible).toBe(true);
});

test('Settings window has correct title', async () => {
	// Open settings via IPC to ensure it's open
	await electronApp.evaluate(async (app) =>
		app.ipcMain.emit('open-settings'),
	);
	await wait(delays.medium);

	const titles = await getWindowTitles(electronApp);
	expect(titles).toContain(SETTINGS_WINDOW);
});

test('Settings window is listed among all windows', async () => {
	await electronApp.evaluate(async (app) =>
		app.ipcMain.emit('open-settings'),
	);
	await wait(delays.medium);

	const windows = electronApp.windows();
	const titles = await Promise.all(windows.map(async (w) => w.title()));
	console.log('All windows:', titles);

	expect(titles).toEqual(
		expect.arrayContaining([PRODUCT_NAME, SETTINGS_WINDOW]),
	);
});

test('Focus returns to main window after settings', async () => {
	// Open settings
	await electronApp.evaluate(async (app) =>
		app.ipcMain.emit('open-settings'),
	);
	await wait(delays.medium);

	// Focus main
	await electronApp.evaluate(async (app) =>
		app.ipcMain.emit('focus-window'),
	);
	await wait(delays.medium);

	const { focused, visible } = await focusedMinimizedVisible({
		electronApp,
		windowName: PRODUCT_NAME,
	});

	expect(focused).toBe(true);
	expect(visible).toBe(true);
});
