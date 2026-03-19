import { expect, test } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import {
	closeApp,
	delays,
	focusedMinimizedVisible,
	getBounds,
	PRODUCT_NAME,
	SETTINGS_WINDOW,
	startApp,
	visualMouse,
	wait,
} from './helpers';

let electronApp: ElectronApplication;
let mainPage: Page;

test.beforeAll(async () => {
	const app = await startApp();
	electronApp = app.electronApp;
	mainPage = app.mainPage;
	await visualMouse(mainPage);
});

test.afterAll(closeApp);

test('Double-click crosshair centers window', async () => {
	const crosshair = mainPage.locator('#crosshair');

	await crosshair.dblclick();
	await wait(delays.short);

	const bounds = await getBounds({
		electronApp,
		windowName: PRODUCT_NAME,
	});

	// Move window via IPC
	await electronApp.evaluate(async ({ ipcMain }) => {
		ipcMain.emit('move_window', { distance: 100, direction: 'right' });
		ipcMain.emit('move_window', { distance: 100, direction: 'down' });
	});
	await wait(delays.short);

	const movedBounds = await getBounds({
		electronApp,
		windowName: PRODUCT_NAME,
	});
	expect(movedBounds.x).toBe(bounds.x + 100);
	expect(movedBounds.y).toBe(bounds.y + 100);

	// Re-center
	await crosshair.dblclick();
	await wait(delays.short);

	const recenteredBounds = await getBounds({
		electronApp,
		windowName: PRODUCT_NAME,
	});
	expect(recenteredBounds.x).toBe(bounds.x);
	expect(recenteredBounds.y).toBe(bounds.y);
});

test('Settings button opens settings window', async () => {
	const settingsBtn = mainPage.locator('[data-testid="settings-button"]');
	await settingsBtn.click();
	await wait(delays.medium);

	const { focused, minimized, visible } = await focusedMinimizedVisible({
		electronApp,
		windowName: SETTINGS_WINDOW,
	});

	expect(focused).toBe(true);
	expect(minimized).toBe(false);
	expect(visible).toBe(true);
});

test('Quit button closes app', async () => {
	const quitBtn = mainPage.locator('[data-testid="quit-button"]');
	await expect(quitBtn).toBeVisible();

	await quitBtn.click({ force: true });

	let appClosed = false;
	try {
		await mainPage.title();
	} catch {
		appClosed = true;
	}

	expect(appClosed, 'app should be quit').toBeTruthy();
});
