import { expect, test } from '@playwright/test';
import path from 'path';
import { ElectronApplication, Page } from 'playwright';
import { closeApp, delays, startApp, wait } from './helpers';

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

test('Window count is correct on launch', async () => {
	await wait(delays.long);

	const windows = electronApp.windows();
	const titles = await Promise.all(windows.map(async (w) => w.title()));
	const namedWindows = titles.filter(
		(t) => Boolean(t) && t !== 'DevTools',
	);

	console.log('All windows:', titles);

	// XOver should have at least the main window
	expect(namedWindows.length).toBeGreaterThanOrEqual(1);
	expect(titles).toEqual(expect.arrayContaining([productName]));
});

test('App path is correct', async () => {
	const appPath = await electronApp.evaluate(async ({ app }) =>
		app.getAppPath(),
	);
	expect(appPath).toBe(path.resolve(__dirname, '..'));
});

test('evaluateHandle works correctly', async () => {
	const appHandle = await electronApp.evaluateHandle(({ app }) => app);
	expect(
		await electronApp.evaluate(
			({ app }, appHandle) => app === appHandle,
			appHandle,
		),
	).toBeTruthy();
});

test('First window matches mainPage reference', async () => {
	expect(electronApp.windows()[0]).toBe(mainPage);
});

test('Script injection works', async () => {
	await mainPage.addScriptTag({
		content: "(() => console.log('Script injection test'))()",
	});
});

test('IPC: close-all-windows closes everything', async () => {
	let appClosed = false;

	await electronApp.evaluate(async (app) =>
		app.ipcMain.emit('close-all-windows'),
	);
	await wait(delays.medium);

	try {
		await mainPage.title();
	} catch {
		appClosed = true;
	}

	expect(appClosed, 'all windows should be closed').toBeTruthy();
});
