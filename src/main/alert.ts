import Logger from 'electron-log/main';
import got from 'got';
import { DEV_ALERT_URL } from '../config/config';
import { showDevAlert } from './notifications';

let isFetching = false;
let lastMessage = '';

export const checkDeveloperAlert = async () => {
  if (isFetching) return;
  isFetching = true;
  try {
    const res = await got.get(DEV_ALERT_URL, { timeout: { request: 5000 } });
    const message = String(res.body || '').trim();
    if (message && message !== lastMessage) {
      lastMessage = message;
      showDevAlert(message);
    }
  } catch (error) {
    Logger.info('No developer alerts found.', error?.message || error);
  } finally {
    isFetching = false;
  }
};

export const initDeveloperAlerts = (intervalMs = 1000 * 60 * 60) => {
  // Check immediately on startup
  checkDeveloperAlert();
  // Poll occasionally
  setInterval(checkDeveloperAlert, intervalMs);
};

export default { checkDeveloperAlert, initDeveloperAlerts };


