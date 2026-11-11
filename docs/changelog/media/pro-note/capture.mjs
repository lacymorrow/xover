import { chromium } from 'playwright';
import path from 'path';
const repo = process.argv[2];
const out = process.argv[3];
const url = 'file://' + path.join(repo, 'release/app/dist/renderer/index.html') + '#/license';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 820 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0, 200)));

await page.addInitScript(() => {
  const noop = () => {};
  const api = {
    ipcRenderer: new Proxy({}, { get(_t, p) {
      if (p === 'invoke') return async () => ({});
      return () => {};
    } }),
    getLicenseStatus: async () => ({ isPremium: false, licenseKey: '', activationId: '', lastValidated: 0 }),
    activateLicense: async () => ({ success: false }),
    deactivateLicense: async () => ({ success: false }),
    openUrl: noop,
  };
  window.electron = new Proxy(api, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return async () => ({});
    },
  });
});

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);

const txt = await page.evaluate(() => document.body.innerText.slice(0, 400));
console.log('BODY_TEXT_START>>>' + txt.replace(/\n/g, ' | ').slice(0, 300) + '<<<');

const hasNote = await page.getByText('I started CrossOver in October 2019').count();
console.log('NOTE_FOUND:', hasNote);
if (hasNote > 0) {
  await page.screenshot({ path: path.join(out, 'pro-note-license-pane.png'), fullPage: true });
  await page.locator('blockquote').first().screenshot({ path: path.join(out, 'pro-note-closeup.png') });
  console.log('CAPTURED');
}
await browser.close();
