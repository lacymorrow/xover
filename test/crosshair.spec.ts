import { expect, test } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import {
	closeApp,
	delays,
	getBounds,
	PRODUCT_NAME,
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

test('Crosshair wrapper is present', async () => {
	const wrapper = mainPage.locator('#crosshair-wrapper');
	await expect(wrapper).toBeVisible();
});

test('Crosshair element is present', async () => {
	const crosshair = mainPage.locator('#crosshair');
	await expect(crosshair).toBeVisible();
});

test('Reticle wrapper is present', async () => {
	const reticle = mainPage.locator('#reticle-wrapper');
	await expect(reticle).toBeVisible();
});

test('Double-click crosshair centers window', async () => {
	const crosshair = mainPage.locator('#crosshair');

	// Center first
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

	// Re-center via dblclick
	await crosshair.dblclick();
	await wait(delays.short);

	const recenteredBounds = await getBounds({
		electronApp,
		windowName: PRODUCT_NAME,
	});
	expect(recenteredBounds.x).toBe(bounds.x);
	expect(recenteredBounds.y).toBe(bounds.y);
});

test('All control buttons are visible', async () => {
	const quitBtn = mainPage.locator('[data-testid="quit-button"]');
	const resetBtn = mainPage.locator('[data-testid="reset-button"]');
	const settingsBtn = mainPage.locator('[data-testid="settings-button"]');

	await expect(quitBtn).toBeVisible();
	await expect(resetBtn).toBeVisible();
	await expect(settingsBtn).toBeVisible();
});

test('Correct number of control buttons', async () => {
	// XOver has 3 buttons: Quit, Reset, Settings
	const buttons = mainPage.locator('.icon-button');
	expect(await buttons.count()).toBe(3);
});

test('Buttons contain SVG icons', async () => {
	const quitSvg = mainPage.locator('[data-testid="quit-button"] svg');
	const resetSvg = mainPage.locator('[data-testid="reset-button"] svg');
	const settingsSvg = mainPage.locator('[data-testid="settings-button"] svg');

	expect(await quitSvg.count()).toBe(1);
	expect(await resetSvg.count()).toBe(1);
	expect(await settingsSvg.count()).toBe(1);
});
