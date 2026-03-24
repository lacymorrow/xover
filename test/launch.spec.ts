import { expect, test } from '@playwright/test';
import path from 'path';
import { ElectronApplication, Page } from 'playwright';
import {
	closeApp,
	delays,
	focusedMinimizedVisible,
	getWindowTitles,
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

test.afterEach(async () => wait(delays.short));
test.afterAll(closeApp);

test('App launches successfully', async () => {
	await mainPage.screenshot();
	await wait(delays.medium);

	const title = await mainPage.title();
	expect(title).toBe(PRODUCT_NAME);

	const { focused, minimized, visible } = await focusedMinimizedVisible({
		electronApp,
		windowName: PRODUCT_NAME,
	});

	expect(focused).toBe(true);
	expect(minimized).toBe(false);
	expect(visible).toBe(true);
});

test('Main window has correct product name', async () => {
	const result = await electronApp.evaluate(
		async ({ BrowserWindow }, windowName) =>
			BrowserWindow.getAllWindows().find((w) => w.title === windowName)?.title,
		PRODUCT_NAME,
	);
	expect(result).toBe(PRODUCT_NAME);
});

test('App is not packaged in dev', async () => {
	const isPackaged = await electronApp.evaluate(
		async ({ app }) => app.isPackaged,
	);
	expect(isPackaged).toBe(false);
});

test('App path is correct', async () => {
	const appPath = await electronApp.evaluate(async ({ app }) =>
		app.getAppPath(),
	);
	expect(appPath).toBe(path.resolve(__dirname, '..'));
});

test('Window count is correct on launch', async () => {
	await wait(delays.long);

	const titles = await getWindowTitles(electronApp);
	console.log('All windows:', titles);

	// XOver has at least the main crosshair window
	expect(titles.length).toBeGreaterThanOrEqual(1);
	expect(titles).toEqual(expect.arrayContaining([PRODUCT_NAME]));
});

test('First window matches mainPage reference', async () => {
	expect(electronApp.windows()[0]).toBe(mainPage);
});

test('evaluateHandle works correctly', async () => {
	const appHandle = await electronApp.evaluateHandle(({ app }) => app);
	expect(
		await electronApp.evaluate(({ app }, handle) => app === handle, appHandle),
	).toBeTruthy();
});

test('Script injection works', async () => {
	await mainPage.addScriptTag({
		content: "(() => console.log('Script injection test'))()",
	});
});
