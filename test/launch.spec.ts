import { expect, test } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import { closeApp, delays, focusedMinimizedVisible, startApp, wait } from './helpers';

const productName = 'CrossOver';

let electronApp: ElectronApplication;
let mainPage: Page;

test.beforeAll(async () => {
	const app = await startApp();
	electronApp = app.electronApp;
	mainPage = app.mainPage;
});

test.afterEach(async () => wait(delays.short));

test.afterAll(closeApp);

test('App launches successfully', async () => {
	await mainPage.screenshot();
	await wait(delays.medium);

	const title = await mainPage.title();
	expect(title).toBe(productName);

	const { focused, minimized, visible } = await focusedMinimizedVisible({
		electronApp,
		windowName: productName,
	});

	expect(focused).toBe(true);
	expect(minimized).toBe(false);
	expect(visible).toBe(true);
});

test('Main window has correct product name', async () => {
	const result = await electronApp.evaluate(
		async ({ BrowserWindow }, windowName) =>
			BrowserWindow.getAllWindows().find((w) => w.title === windowName)?.title,
		productName,
	);

	expect(result).toBe(productName);
});

test('App is not packaged in dev', async () => {
	const isPackaged = await electronApp.evaluate(
		async ({ app }) => app.isPackaged,
	);
	expect(isPackaged).toBe(false);
});

test('Renderer controls are present', async () => {
	// XOver uses React components in a .controls div
	const controls = mainPage.locator('.controls');
	await expect(controls).toBeVisible();
});
