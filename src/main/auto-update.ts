import { ProgressInfo, autoUpdater } from 'electron-updater';
import { shell } from 'electron';
import Logger from 'electron-log/main';
import { $autoUpdate } from '../config/strings';
import dialog from './dialog';
import dock from './dock';
import { notification } from './notifications';
import sound from './sounds';
import { getSetting } from './store-actions';
import { is } from './util';
import windows from './windows';

const FOUR_HOURS = 1000 * 60 * 60 * 4;

export class AutoUpdate {
    constructor() {
        if (!getSetting('allowAutoUpdate')) return;

        Logger.status($autoUpdate.autoUpdate);
        Logger.transports.file.level = 'silly';
        autoUpdater.logger = Logger;

        // Wire events
        autoUpdater.on('update-available', onUpdateAvailable);
        if (!is.linux) {
            autoUpdater.on('download-progress', onDownloadProgress);
            autoUpdater.on('update-downloaded', onUpdateDownloaded);
        }

        // Initial check and schedule periodic checks
        autoUpdater.checkForUpdatesAndNotify();
        setInterval(() => {
            autoUpdater.checkForUpdates();
        }, FOUR_HOURS);
    }
}

const checkForUpdates = () => {
    Logger.status($autoUpdate.autoUpdate);
    autoUpdater.checkForUpdatesAndNotify();
};

const install = () => autoUpdater.quitAndInstall();

const onDownloadProgress = (progressObject: ProgressInfo) => {
    try {
        let message = `Download speed: ${progressObject.bytesPerSecond}`;
        message = `${message} - Downloaded ${progressObject.percent}%`;
        message = `${message} (${progressObject.transferred}/${progressObject.total})`;
        Logger.info(message);
        windows.settingsWindow?.setProgressBar(progressObject.percent / 100);
    } catch (error) {
        Logger.error('onDownloadProgress', error);
    }
};

const onUpdateAvailable = () => {
    try {
        notification({
            title: $autoUpdate.updateAvailable,
            body: $autoUpdate.updateAvailableBody,
        });
        sound.play('UPDATE');
        if (is.linux) {
            dialog.openUpdateDialog(() => {
                shell.openExternal('https://github.com/lacymorrow/crossover/releases/latest');
            });
        }
    } catch (error) {
        Logger.error(error);
    }
};

const onUpdateDownloaded = () => {
    try {
        windows.settingsWindow?.setProgressBar(-1);
        dock.setBadge('!');
        notification({ title: 'CrossOver has been Updated', body: 'Relaunch to take effect' });
        sound.play('DONE');
    } catch (error) {
        Logger.error(error);
    }
};

const update = () => {
    try {
        if (!getSetting('allowAutoUpdate')) return;
        autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
        Logger.error(error);
    }
};

export default { checkForUpdates, install, onDownloadProgress, onUpdateAvailable, onUpdateDownloaded, update };
