import { _electron as electron, ElectronApplication, Page } from 'playwright';

let electronApp: ElectronApplication;

export const PRODUCT_NAME = 'CrossOver';
export const SETTINGS_WINDOW = 'Settings - CrossOver';

export const delays = {
	short: 500,
	medium: 1000,
	long: 5000,
};

export const wait = (ms: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

export const startApp = async (): Promise<{
	electronApp: ElectronApplication;
	mainPage: Page;
	page: Page;
}> => {
	process.env.CI = 'e2e';

	electronApp = await electron.launch({ args: ['.'] });
	await wait(5000);

	electronApp.on('window', async (page: Page) => {
		page.on('pageerror', (error) => {
			console.error(error);
		});
		page.on('console', (_message) => {
			if (process.env.NODE_ENV === 'development') {
				console.warn(_message);
			}
		});
	});

	const mainPage = await electronApp.firstWindow();
	await wait(delays.short);

	return { electronApp, mainPage, page: mainPage };
};

export const closeApp = async (): Promise<void> => {
	try {
		await electronApp.close();
	} catch (error) {
		console.error('App was already closed:', error);
	}
};

export const focusedMinimizedVisible = async ({
	electronApp: app,
	windowName,
}: {
	electronApp: ElectronApplication;
	windowName: string;
}): Promise<{ focused: boolean; minimized: boolean; visible: boolean }> =>
	app.evaluate(async ({ BrowserWindow }, name) => {
		const windows = BrowserWindow.getAllWindows();
		let win = windows.find((w) => w.title === name);
		if (!win) {
			[win] = windows;
			if (!win) {
				return { focused: false, minimized: false, visible: false };
			}
			console.warn(`Window "${name}" not found, using first window instead`);
		}
		win.focus();
		return {
			focused: win.isFocused(),
			minimized: win.isMinimized(),
			visible: win.isVisible(),
		};
	}, windowName);

export const getBounds = async ({
	electronApp: app,
	windowName,
}: {
	electronApp: ElectronApplication;
	windowName: string;
}): Promise<{ x: number; y: number; width: number; height: number }> =>
	app.evaluate(
		async ({ BrowserWindow }, name) =>
			BrowserWindow.getAllWindows()
				.filter((w) => w.title === name)[0]
				.getBounds(),
		windowName,
	);

/**
 * Get all window titles (filtered to non-empty, non-DevTools).
 */
export const getWindowTitles = async (
	app: ElectronApplication,
): Promise<string[]> => {
	const windows = app.windows();
	const titles = await Promise.all(windows.map(async (w) => w.title()));
	return titles.filter((t) => Boolean(t) && t !== 'DevTools');
};

/**
 * Inject a visual mouse pointer into the page for debugging.
 */
export const visualMouse = async (mainPage: Page): Promise<void> => {
	await mainPage.addScriptTag({
		content: `(() => {
			const box = document.createElement('puppeteer-mouse-pointer');
			const styleElement = document.createElement('style');
			styleElement.innerHTML = \`
				puppeteer-mouse-pointer {
					pointer-events: none;
					position: absolute;
					top: 0;
					z-index: 10000;
					left: 0;
					width: 10px;
					height: 10px;
					background: rgba(0,0,0,.4);
					border: 1px solid white;
					border-radius: 10px;
					margin: -10px 0 0 -10px;
					padding: 0;
					transition: background .2s, border-radius .2s, border-color .2s;
				}
			\`;
			document.head.append(styleElement);
			document.body.append(box);
			document.addEventListener('mousemove', event => {
				box.style.left = event.pageX + 'px';
				box.style.top = event.pageY + 'px';
			}, true);
		})()`,
	});
};
