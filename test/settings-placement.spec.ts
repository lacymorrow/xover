import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect, test } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { delays, wait } from './helpers';

// LAC-6155: Settings must open beside the crosshair, never over it, and sit above it.
const OUT = process.env.PLACEMENT_OUT || path.join(os.tmpdir(), 'placement');

const JXA = `ObjC.import('CoreGraphics');
const a = ObjC.castRefToObject($.CGWindowListCopyWindowInfo(1, 0));
const o = [];
for (let i = 0; i < a.count; i++) { const d = ObjC.deepUnwrap(a.objectAtIndex(i));
  if (/CrossOver|Electron/.test(d.kCGWindowOwnerName)) o.push({layer: d.kCGWindowLayer, bounds: d.kCGWindowBounds, order: i}); }
JSON.stringify(o)`;

const layouts: Array<[string, (w: number, h: number) => { x: number; y: number }]> = [
	['centered', (w, h) => ({ x: Math.round(w / 2 - 70), y: Math.round(h / 2 - 70) })],
	['top-left-corner', () => ({ x: 20, y: 40 })],
	['right-edge', (w, h) => ({ x: w - 180, y: Math.round(h / 2 - 70) })],
];

for (const [name, pos] of layouts) {
	test(`settings clears the crosshair: ${name}`, async () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xo-place-'));
		fs.mkdirSync(OUT, { recursive: true });
		// Built app (npm run build), isolated userData so layouts do not share saved positions.
		const electronApp = await electron.launch({
			args: ['release/app'],
			env: { ...process.env, PORTABLE_EXECUTABLE_DIR: dir } as Record<string, string>,
		});
		const mainPage = await electronApp.firstWindow();
		await wait(delays.long);
		try {
			const wa = await electronApp.evaluate(({ screen }) => screen.getPrimaryDisplay().workArea);
			const p = pos(wa.width, wa.height);
			await electronApp.evaluate(({ BrowserWindow }, pt) => {
				const w = BrowserWindow.getAllWindows().find((x) => x.getBounds().width < 300)!;
				const b = w.getBounds();
				w.setBounds({ ...b, x: pt.x, y: pt.y });
			}, p);
			await wait(delays.short);
			// The v4 crosshair window has no visible Settings button; send the same IPC it sends.
			await mainPage.evaluate(() => (window as any).electron.ipcRenderer.send('open-settings'));
			await wait(delays.long);

			const info = await electronApp.evaluate(async ({ BrowserWindow }) => {
				const all = BrowserWindow.getAllWindows().filter((w) => w.isVisible());
				const area = (w: any) => w.getBounds().width * w.getBounds().height;
				const settings = all.sort((a, b) => area(b) - area(a))[0];
				const crosshairs = all.filter((w) => w !== settings);
				const shot = async (w: any) => (await w.webContents.capturePage()).toPNG().toString('base64');
				return {
					settings: settings && settings.getBounds(),
					settingsPng: settings && (await shot(settings)),
					crosshairs: crosshairs.map((w) => w.getBounds()),
					crosshairPng: crosshairs[0] && (await shot(crosshairs[0])),
				};
			});

			expect(info.settings).toBeTruthy();
			const s = info.settings!;
			for (const c of info.crosshairs) {
				const hit = s.x < c.x + c.width && c.x < s.x + s.width && s.y < c.y + c.height && c.y < s.y + s.height;
				expect(hit, `settings ${JSON.stringify(s)} overlaps crosshair ${JSON.stringify(c)}`).toBe(false);
			}
			let cg = '[]';
			try { cg = execFileSync('osascript', ['-l', 'JavaScript', '-e', JXA]).toString(); } catch (e) { cg = String(e); }
			fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ workArea: wa, settings: s, crosshairs: info.crosshairs, cgWindowList: cg }, null, 2));
			fs.writeFileSync(path.join(OUT, `${name}-settings.png`), Buffer.from(info.settingsPng!, 'base64'));
			if (info.crosshairPng) fs.writeFileSync(path.join(OUT, `${name}-crosshair.png`), Buffer.from(info.crosshairPng, 'base64'));
		} finally {
			await electronApp.close();
		}
	});
}
