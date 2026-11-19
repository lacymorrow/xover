/**
 * Which app is in front, and which apps are running, by process or bundle name.
 *
 * Never the window title: on macOS that needs the Screen Recording permission
 * and shows a prompt. Nothing here needs a permission:
 *
 * - macOS: `lsappinfo`, which ships with the OS and reads LaunchServices.
 * - Windows: in-process koffi calls to user32 and kernel32 (win-foreground.ts).
 *   No PowerShell and no child process, which anti-cheat flags.
 * - Linux X11: `xprop` on the root window. Best effort. Wayland is off,
 *   because a Wayland client cannot see which window has focus.
 *
 * No platform offers a cheap foreground event to Electron without a native
 * module, so this polls at 1s, the floor the brief set. The watcher only exists
 * while a Pro user has a preset naming an app.
 *
 * The parsers are pure and exported for the unit tests. The spawning is thin.
 */
import { execFile } from 'child_process';
import fs from 'fs';
import { RunningAppType } from '../config/presets';
import { loadWin, winForeground, winRunningApps } from './win-foreground';

export const POLL_MS = 1000;

export type ForegroundApp = RunningAppType;

const run = (cmd: string, args: string[], timeout = 3000): Promise<string> =>
	new Promise((resolve) => {
		execFile(
			cmd,
			args,
			{ timeout, windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
			(error, stdout) => resolve(error ? '' : String(stdout)),
		);
	});

/** Windows process names are case-insensitive and the user thinks "valorant", not "valorant.exe". */
export const normalizeAppId = (id: string) =>
	id
		.trim()
		.toLowerCase()
		.replace(/\.exe$/, '');

/* ---------- parsers ---------- */

/** `lsappinfo info -only bundleid -only name -only pid <asn>` */
export const parseLsappinfoInfo = (out: string): ForegroundApp | null => {
	const get = (key: string) =>
		out.match(new RegExp(`"${key}"\\s*=\\s*"?([^"\\n]*)"?`))?.[1]?.trim();
	const bundle = get('CFBundleIdentifier');
	const name = get('LSDisplayName');
	const pid = Number(get('pid'));
	const id = bundle || (name ? normalizeAppId(name) : '');
	if (!id) return null;
	return {
		id,
		name: name || id,
		...(Number.isFinite(pid) && pid > 0 ? { pid } : {}),
	};
};

/** `lsappinfo list`: keep only regular apps (type="Foreground"), as the Dock shows them. */
export const parseLsappinfoList = (out: string): RunningAppType[] => {
	const apps: RunningAppType[] = [];
	out.split(/\n(?=\s*\d+\)\s)/).forEach((block) => {
		const name = block.match(/^\s*\d+\)\s+"(.*?)"\s+ASN:/)?.[1];
		const bundle = block.match(/bundleID="([^"]+)"/)?.[1];
		const type = block.match(/type="([^"]+)"/)?.[1];
		const pid = Number(block.match(/\bpid\s*=\s*(\d+)/)?.[1]);
		if (type !== 'Foreground' || !name) return;
		apps.push({
			id: bundle || normalizeAppId(name),
			name,
			...(pid > 0 ? { pid } : {}),
		});
	});
	return apps;
};

export const parseXpropActive = (out: string): string | null => {
	const id = out.match(/#\s*(0x[0-9a-f]+)/i)?.[1];
	return id && Number(id) !== 0 ? id : null;
};

export const parseXpropClientList = (out: string): string[] =>
	out.match(/0x[0-9a-f]+/gi) ?? [];

export const parseXpropWindow = (
	out: string,
): { pid?: number; wmClass?: string } => {
	const pid = Number(out.match(/_NET_WM_PID\(CARDINAL\)\s*=\s*(\d+)/)?.[1]);
	const classes = out.match(/WM_CLASS\(STRING\)\s*=\s*(.*)/)?.[1];
	const wmClass = classes
		?.split(',')
		.map((s) => s.trim().replace(/^"|"$/g, ''))
		.filter(Boolean)
		.pop();
	return { ...(pid > 0 ? { pid } : {}), ...(wmClass ? { wmClass } : {}) };
};

/* ---------- support ---------- */

/** Linux needs an X server it can ask. A Wayland session is off, XWayland included. */
export const linuxAutoSupported = (env: Record<string, string | undefined>) =>
	!(env.XDG_SESSION_TYPE === 'wayland' || env.WAYLAND_DISPLAY) && !!env.DISPLAY;

export const foregroundSupported = (
	platform: typeof process.platform = process.platform,
	env: Record<string, string | undefined> = process.env,
) => {
	if (platform === 'darwin') return true;
	// Windows is supported when koffi loads. A load failure turns auto profiles off.
	if (platform === 'win32') return loadWin() !== null;
	if (platform === 'linux') return linuxAutoSupported(env);
	return false;
};

/* ---------- platform readers ---------- */

const macForeground = async (): Promise<ForegroundApp | null> => {
	const asn = (await run('/usr/bin/lsappinfo', ['front'])).trim();
	if (!asn) return null;
	return parseLsappinfoInfo(
		await run('/usr/bin/lsappinfo', [
			'info',
			'-only',
			'bundleid',
			'-only',
			'name',
			'-only',
			'pid',
			asn,
		]),
	);
};

const linuxApp = async (windowId: string): Promise<ForegroundApp | null> => {
	const { pid, wmClass } = parseXpropWindow(
		await run('xprop', ['-id', windowId, '_NET_WM_PID', 'WM_CLASS']),
	);
	let name = '';
	if (pid) {
		try {
			name = fs.readFileSync(`/proc/${pid}/comm`, 'utf8').trim();
		} catch {
			// Process gone, or no /proc. The class name is the fallback.
		}
	}
	name = name || wmClass || '';
	if (!name) return null;
	return { id: normalizeAppId(name), name, ...(pid ? { pid } : {}) };
};

const linuxForeground = async (): Promise<ForegroundApp | null> => {
	const id = parseXpropActive(
		await run('xprop', ['-root', '_NET_ACTIVE_WINDOW']),
	);
	return id ? linuxApp(id) : null;
};

const dedupe = (apps: RunningAppType[]) => {
	const seen = new Map<string, RunningAppType>();
	apps.forEach((a) => {
		const key = normalizeAppId(a.id);
		if (!seen.has(key)) seen.set(key, a);
	});
	return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
};

/** Apps the picker offers: running, with a window the user could have in front. */
export const listRunningApps = async (
	platform: typeof process.platform = process.platform,
): Promise<RunningAppType[]> => {
	if (platform === 'darwin') {
		return dedupe(
			parseLsappinfoList(await run('/usr/bin/lsappinfo', ['list'])),
		);
	}
	if (platform === 'win32') {
		return dedupe(winRunningApps());
	}
	if (platform === 'linux' && linuxAutoSupported(process.env)) {
		const ids = parseXpropClientList(
			await run('xprop', ['-root', '_NET_CLIENT_LIST']),
		);
		const apps = await Promise.all(ids.map(linuxApp));
		return dedupe(apps.filter((a): a is ForegroundApp => !!a));
	}
	return [];
};

export interface ForegroundWatcher {
	stop: () => void;
}

/**
 * Calls `onChange` when the app in front changes. Returns null where
 * unsupported. Calls repeat only on a change, so a still desktop costs one
 * cheap read a second on macOS and Linux, and nothing but a sleeping process
 * on Windows.
 */
export const watchForeground = (
	onChange: (app: ForegroundApp) => void,
	platform: typeof process.platform = process.platform,
): ForegroundWatcher | null => {
	if (!foregroundSupported(platform)) return null;

	let read: () => Promise<ForegroundApp | null> = linuxForeground;
	if (platform === 'darwin') read = macForeground;
	if (platform === 'win32') read = async () => winForeground();
	let last = '';
	let busy = false;
	let stopped = false;
	const tick = async () => {
		// A slow read must not stack up behind the next tick.
		if (busy || stopped) return;
		busy = true;
		try {
			const app = await read();
			if (app && !stopped && `${app.id}:${app.pid ?? ''}` !== last) {
				last = `${app.id}:${app.pid ?? ''}`;
				onChange(app);
			}
		} finally {
			busy = false;
		}
	};
	const timer = setInterval(tick, POLL_MS);
	tick();
	return {
		stop: () => {
			stopped = true;
			clearInterval(timer);
		},
	};
};
