import { expect, test } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import {
	closeApp,
	delays,
	focusedMinimizedVisible,
	getBounds,
	PRODUCT_NAME,
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

test('IPC: center-window centers the crosshair', async () => {
	await electronApp.evaluate(async (app) => app.ipcMain.emit('center-window'));
	await wait(delays.short);

	const bounds = await getBounds({
		electronApp,
		windowName: PRODUCT_NAME,
	});

	// Move away
	await electronApp.evaluate(async (app) => {
		app.ipcMain.emit('move_window', { distance: 100, direction: 'right' });
		app.ipcMain.emit('move_window', { distance: 100, direction: 'down' });
	});
	await wait(delays.short);

	const movedBounds = await getBounds({
		electronApp,
		windowName: PRODUCT_NAME,
	});
	expect(movedBounds.x).toBe(bounds.x + 100);
	expect(movedBounds.y).toBe(bounds.y + 100);

	// Re-center via IPC
	await electronApp.evaluate(async (app) => app.ipcMain.emit('center-window'));
	await wait(delays.short);

	const recenteredBounds = await getBounds({
		electronApp,
		windowName: PRODUCT_NAME,
	});
	expect(recenteredBounds.x).toBe(bounds.x);
	expect(recenteredBounds.y).toBe(bounds.y);
});

test('IPC: open-settings opens settings window', async () => {
	await electronApp.evaluate(async (app) => app.ipcMain.emit('open-settings'));
	await wait(delays.medium);

	const { focused, minimized, visible } = await focusedMinimizedVisible({
		electronApp,
		windowName: 'Settings - CrossOver',
	});

	expect(focused).toBe(true);
	expect(minimized).toBe(false);
	expect(visible).toBe(true);
});

test('IPC: focus-window returns focus to main', async () => {
	// Open settings first
	await electronApp.evaluate(async (app) => app.ipcMain.emit('open-settings'));
	await wait(delays.medium);

	// Focus main
	await electronApp.evaluate(async (app) => app.ipcMain.emit('focus-window'));
	await wait(delays.medium);

	const { focused, visible } = await focusedMinimizedVisible({
		electronApp,
		windowName: PRODUCT_NAME,
	});

	expect(focused).toBe(true);
	expect(visible).toBe(true);
});

test('IPC: quit-app closes the application', async () => {
	let appClosed = false;

	await electronApp.evaluate(async (app) => app.ipcMain.emit('quit-app'));

	try {
		await mainPage.title();
	} catch {
		appClosed = true;
	}

	expect(appClosed, 'app should be quit').toBeTruthy();
});
