import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect, test } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { delays, wait } from './helpers';

// LAC-6155 x #70: Escape hides Settings via closeSettingsWindow(). If hide()
// does not fire blur, Settings stays at screen-saver level 2 while hidden and
// a later show() floats it over every app, which the board rejected.
const OUT = process.env.PLACEMENT_OUT || path.join(os.tmpdir(), 'escape-aot');

test('escape-closing Settings leaves it off always-on-top', async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xo-esc-'));
	fs.mkdirSync(OUT, { recursive: true });
	const app = await electron.launch({
		args: ['release/app'],
		env: { ...process.env, PORTABLE_EXECUTABLE_DIR: dir } as Record<
			string,
			string
		>,
	});
	const mainPage = await app.firstWindow();
	await wait(delays.long);

	// Pin the Settings window by id once, so later reads cannot drift to another window.
	const findId = () =>
		app.evaluate(({ BrowserWindow }) => {
			const w = BrowserWindow.getAllWindows().find(
				(x) =>
					/settings/i.test(x.webContents.getURL()) ||
					x.getBounds().width >= 700,
			);
			return w ? w.id : null;
		});
	const stateOf = (id: number) =>
		app.evaluate(({ BrowserWindow }, wid) => {
			const w = BrowserWindow.fromId(wid)!;
			return {
				alwaysOnTop: w.isAlwaysOnTop(),
				visible: w.isVisible(),
				focused: w.isFocused(),
			};
		}, id);

	try {
		await mainPage.evaluate(() =>
			(window as any).electron.ipcRenderer.send('open-settings'),
		);
		await wait(delays.long);
		const id = await findId();
		expect(id).not.toBeNull();
		const opened = await stateOf(id!);

		// Drive Escape through the real webContents so #70's before-input-event fires.
		await app.evaluate(({ BrowserWindow }, wid) => {
			const wc = BrowserWindow.fromId(wid)!.webContents;
			wc.focus();
			wc.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' } as any);
			wc.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' } as any);
		}, id!);
		await wait(delays.long);
		const afterEscape = await stateOf(id!);

		fs.writeFileSync(
			path.join(OUT, 'escape-alwaysontop.json'),
			JSON.stringify({ opened, afterEscape }, null, 2),
		);

		expect(opened.alwaysOnTop).toBe(true);
		expect(afterEscape.visible).toBe(false);
		expect(afterEscape.alwaysOnTop).toBe(false);
	} finally {
		await app.close();
	}
});
