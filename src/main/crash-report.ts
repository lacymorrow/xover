import { app, BrowserWindow, dialog, shell } from 'electron';
import Logger from 'electron-log';
import { debugInfo } from './util';

const ISSUES_URL = 'https://github.com/lacymorrow/crossover/issues/new';

const buildIssueUrl = (error: Error): string => {
	const title = `Crash: ${error.message.split('\n')[0]}`;
	const body = [
		'## Error',
		'```',
		error.stack ?? error.message,
		'```',
		'',
		'## Environment',
		'```',
		debugInfo(),
		'```',
	].join('\n');

	const params = new URLSearchParams({ title, body });
	return `${ISSUES_URL}?${params.toString()}`;
};

/**
 * Only packaged builds get the crash dialog with the "Report Issue" button.
 * In dev and under Playwright the dialog auto-resolves to its default button,
 * which opened a GitHub new-issue tab for every crash during a test run
 * (176 tabs from one afternoon of e2e runs). Errors are still logged either
 * way, so nothing is lost for developers.
 */
export const shouldShowCrashDialog = (): boolean => app.isPackaged;

export const showCrashReportDialog = async (error: Error): Promise<void> => {
	if (!shouldShowCrashDialog()) {
		Logger.error('Crash dialog suppressed (unpackaged build):', error);
		return;
	}

	try {
		const { response } = await dialog.showMessageBox({
			type: 'error',
			title: 'CrossOver encountered an error',
			message: error.message,
			detail: error.stack,
			buttons: ['Report Issue', 'Restart', 'Quit'],
			defaultId: 0,
			cancelId: 2,
			noLink: true,
		});

		if (response === 0) {
			// Report Issue
			shell.openExternal(buildIssueUrl(error));
		} else if (response === 1) {
			// Restart
			app.relaunch();
			app.quit();
		} else {
			// Quit
			app.quit();
		}
	} catch (dialogError) {
		Logger.error('Failed to show crash report dialog:', dialogError);
		app.quit();
	}
};

export const wireRenderProcessGone = (win: BrowserWindow): void => {
	win.webContents.on('render-process-gone', (_event, details) => {
		Logger.error('Render process gone:', details);
		const error = new Error(
			`Render process gone: ${details.reason}${details.exitCode !== undefined ? ` (exit code ${details.exitCode})` : ''}`,
		);
		showCrashReportDialog(error);
	});
};

export const installCrashHandlers = (): void => {
	process.on('uncaughtException', (error: Error) => {
		Logger.error('Uncaught exception:', error);
		showCrashReportDialog(error);
	});

	process.on('unhandledRejection', (reason: unknown) => {
		Logger.error('Unhandled rejection:', reason);
		const error = reason instanceof Error ? reason : new Error(String(reason));
		showCrashReportDialog(error);
	});

	app.on('child-process-gone', (_event, details) => {
		Logger.error('Child process gone:', details);
		const error = new Error(
			`Child process gone (${details.type}): ${details.reason}`,
		);
		showCrashReportDialog(error);
	});
};
