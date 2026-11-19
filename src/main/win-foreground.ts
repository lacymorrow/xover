/**
 * Windows foreground app and visible-app list, in process, through koffi
 * calling user32 and kernel32. No PowerShell and no child process: a hidden
 * `powershell -EncodedCommand` that P/Invokes user32 is exactly what Defender,
 * EDR and anti-cheat (Vanguard, EAC) flag, and a crosshair app must never look
 * like that.
 *
 * Only the executable name is read (OpenProcess with
 * PROCESS_QUERY_LIMITED_INFORMATION + QueryFullProcessImageNameW). No window
 * title, no process memory, no hooks.
 *
 * koffi is loaded lazily. If it cannot load (missing binary, blocked by
 * policy) `loadWin()` returns null once, logs one line, and auto profiles turn
 * themselves off. Nothing throws into the app.
 */
import Logger from 'electron-log';
import path from 'path';
import { RunningAppType } from '../config/presets';

const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
const PATH_CHARS = 1024;

interface WinApi {
	foregroundPid: () => number | null;
	visiblePids: () => number[];
	exePath: (pid: number) => string | null;
}

let api: WinApi | null | undefined;

const build = (): WinApi => {
	// Lazy and by name so webpack leaves the native module to node's resolver.
	// eslint-disable-next-line global-require, import/no-unresolved
	const koffi = require('koffi');
	const user32 = koffi.load('user32.dll');
	const kernel32 = koffi.load('kernel32.dll');

	const GetForegroundWindow = user32.func(
		'void* __stdcall GetForegroundWindow()',
	);
	const GetWindowThreadProcessId = user32.func(
		'uint32_t __stdcall GetWindowThreadProcessId(void* hWnd, _Out_ uint32_t* pid)',
	);
	const IsWindowVisible = user32.func(
		'int __stdcall IsWindowVisible(void* hWnd)',
	);
	const EnumProc = koffi.proto(
		'bool __stdcall CrossOverEnumProc(void* hwnd, intptr_t lparam)',
	);
	const EnumWindows = user32.func(
		'int __stdcall EnumWindows(CrossOverEnumProc* cb, intptr_t lparam)',
	);
	const OpenProcess = kernel32.func(
		'void* __stdcall OpenProcess(uint32_t access, int inherit, uint32_t pid)',
	);
	const CloseHandle = kernel32.func('int __stdcall CloseHandle(void* h)');
	const QueryFullProcessImageNameW = kernel32.func(
		'int __stdcall QueryFullProcessImageNameW(void* h, uint32_t flags, _Out_ uint16_t* name, _Inout_ uint32_t* size)',
	);

	const pidOf = (hwnd: unknown): number | null => {
		const out = [0];
		GetWindowThreadProcessId(hwnd, out);
		return out[0] > 0 ? out[0] : null;
	};

	return {
		foregroundPid: () => {
			const hwnd = GetForegroundWindow();
			return hwnd ? pidOf(hwnd) : null;
		},
		visiblePids: () => {
			const pids = new Set<number>();
			const callback = koffi.register((hwnd: unknown) => {
				if (IsWindowVisible(hwnd)) {
					const pid = pidOf(hwnd);
					if (pid) pids.add(pid);
				}
				return true;
			}, koffi.pointer(EnumProc));
			try {
				EnumWindows(callback, 0);
			} finally {
				koffi.unregister(callback);
			}
			return [...pids];
		},
		exePath: (pid: number) => {
			const handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
			if (!handle) return null;
			try {
				const buffer = new Uint16Array(PATH_CHARS);
				const size = [PATH_CHARS];
				if (!QueryFullProcessImageNameW(handle, 0, buffer, size)) return null;
				return String.fromCharCode(...buffer.subarray(0, size[0]));
			} finally {
				CloseHandle(handle);
			}
		},
	};
};

/** The API, or null if koffi will not load. Tried once. */
export const loadWin = (): WinApi | null => {
	if (api !== undefined) return api;
	if (process.platform !== 'win32') {
		api = null;
		return api;
	}
	try {
		api = build();
	} catch (error) {
		Logger.warn(
			'Auto profiles are off: could not load the Windows foreground reader (koffi).',
			error,
		);
		api = null;
	}
	return api;
};

/** `C:\\Games\\Valorant\\VALORANT-Win64-Shipping.exe` -> the app the user sees. */
export const appFromExePath = (
	exe: string,
	pid: number,
): RunningAppType | null => {
	const base = path.win32.basename(exe).replace(/\.exe$/i, '');
	if (!base) return null;
	return { id: base.toLowerCase(), name: base, pid };
};

export const winForeground = (): RunningAppType | null => {
	const win = loadWin();
	if (!win) return null;
	try {
		const pid = win.foregroundPid();
		const exe = pid ? win.exePath(pid) : null;
		return pid && exe ? appFromExePath(exe, pid) : null;
	} catch (error) {
		Logger.warn('Foreground read failed', error);
		return null;
	}
};

export const winRunningApps = (): RunningAppType[] => {
	const win = loadWin();
	if (!win) return [];
	try {
		return win
			.visiblePids()
			.map((pid) => {
				const exe = win.exePath(pid);
				return exe ? appFromExePath(exe, pid) : null;
			})
			.filter((a): a is RunningAppType => !!a);
	} catch (error) {
		Logger.warn('Running apps read failed', error);
		return [];
	}
};
