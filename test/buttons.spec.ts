import { expect, test } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import {
	closeApp,
	delays,
	focusedMinimizedVisible,
	getBounds,
	SETTINGS_WINDOW,
	startApp,
	visualMouse,
	wait,
} from './helpers';

const productName = 'CrossOver';

let electronApp: ElectronApplication;
let mainPage: Page;

test.beforeAll(async () => {
	const app = await startApp();
	electronApp = app.electronApp;
	mainPage = app.mainPage;
	await visualMouse(mainPage);
});

test.afterAll(closeApp);

test('Double-click #crosshair to center window', async () => {
	const crosshair = mainPage.locator('#crosshair');

	await crosshair.dblclick();
	await wait(delays.short);

	// Get initial centered bounds
	const bounds = await getBounds({ electronApp, windowName: productName });

	// Move window via IPC
	await electronApp.evaluate(async ({ ipcMain }) => {
		ipcMain.emit('move_window', { distance: 100, direction: 'right' });
		ipcMain.emit('move_window', { distance: 100, direction: 'down' });
	});
	await wait(delays.short);

	const movedBounds = await getBounds({ electronApp, windowName: productName });
	expect(movedBounds.x).toBe(bounds.x + 100);
	expect(movedBounds.y).toBe(bounds.y + 100);

	// Re-center
	await crosshair.dblclick();
	await wait(delays.short);

	const recenteredBounds = await getBounds({
		electronApp,
		windowName: productName,
	});
	expect(recenteredBounds.x).toBe(bounds.x);
	expect(recenteredBounds.y).toBe(bounds.y);
});

test('Settings button opens settings window', async () => {
	const settingsBtn = mainPage.locator('.settings-button');
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

test('Close button quits app', async () => {
	// On macOS the close button may be hidden — force show it
	const isMac = process.platform === 'darwin';
	if (isMac) {
		await mainPage.addScriptTag({
			content: "document.body.classList.remove('mac')",
		});
	}

	const closeBtn = mainPage.locator('.close-button');
	await expect(closeBtn).toBeVisible();

	await closeBtn.click({ force: true });

	let appClosed = false;
	try {
		await mainPage.title();
	} catch {
		appClosed = true;
	}

	expect(appClosed, 'app should be quit').toBeTruthy();
});
