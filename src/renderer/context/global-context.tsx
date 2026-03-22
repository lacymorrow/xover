// DATA SHOULD ONLY FLOW DOWNWARDS
// We pass data from the main process to the renderer process using IPC
// We also use IPC to update data

// todo: add os here

import { ipcChannels } from '@/config/ipc-channels';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';

import {
	CrosshairWindowStateType,
	DEFAULT_CROSSHAIR_WINDOW_STATE,
	DEFAULT_KEYBINDS,
	DEFAULT_SETTINGS,
	SettingsType,
} from '@/config/settings';
import { play, preload } from '@/renderer/lib/sounds';
import { AppInfoType } from '@/types/app';
import { CustomAcceleratorsType } from '@/types/keyboard';
import { getNativeWindowBorderRadius } from '@/utils/platform';
import { MenuItemConstructorOptions } from 'electron/renderer';
import { toast } from 'sonner';

interface ItemType {
	label: string;
	value: string;
}

interface GlobalContextType {
	app: Partial<AppInfoType>;
	appMenu: MenuItemConstructorOptions[];
	keybinds: CustomAcceleratorsType;
	message: string;
	messages: string[];
	settings: SettingsType;
	setSettings: (newSettings: Partial<SettingsType>) => void;
	windowState: CrosshairWindowStateType;
	crosshairImages: { label: string; value: string }[];
	isPremium: boolean;
	refreshLicense: () => Promise<void>;
}

const params = new Proxy(new URLSearchParams(window.location.search), {
	get: (searchParams, prop: string) => searchParams.get(prop),
});

// @ts-ignore
const id = params?.id ?? '';

export const GlobalContext = React.createContext<GlobalContextType>({
	app: {},
	appMenu: [],
	keybinds: DEFAULT_KEYBINDS,
	message: '',
	messages: [],
	settings: DEFAULT_SETTINGS,
	setSettings: () => {},
	windowState: DEFAULT_CROSSHAIR_WINDOW_STATE,
	crosshairImages: [],
	isPremium: false,
	refreshLicense: async () => {},
});

export function GlobalContextProvider({
	children,
}: {
	children?: React.ReactNode;
}) {
	const [appInfo, setAppInfo] = React.useState<Partial<AppInfoType>>({});
	const [appMenu, setAppMenu] = React.useState<MenuItemConstructorOptions[]>(
		[],
	);
	const [messages, setMessages] = React.useState<string[]>([]);

	const [settings, setCurrentSettings] =
		React.useState<SettingsType>(DEFAULT_SETTINGS);

	const [windowState, setCurrentWindowState] =
		React.useState<CrosshairWindowStateType>(DEFAULT_CROSSHAIR_WINDOW_STATE);

	const [keybinds, setCurrentKeybinds] =
		React.useState<CustomAcceleratorsType>(DEFAULT_KEYBINDS);

	const [crosshairImages, setCrosshairImages] = React.useState<ItemType[]>([]);
	const [isPremium, setIsPremium] = React.useState(false);

	const refreshLicense = useCallback(async () => {
		try {
			const status = await window.electron.getLicenseStatus();
			setIsPremium(status?.isPremium ?? false);
		} catch (error) {
			console.error('Failed to fetch license status:', error);
		}
	}, []);

	useEffect(() => {
		// Create handler for receiving asynchronous messages from the main process
		const synchronizeAppState = async () => {
			console.log(ipcChannels.APP_UPDATED);

			window.electron.ipcRenderer
				// @ts-ignore
				.invoke(ipcChannels.GET_RENDERER_SYNC, id ?? 'settings')
				.then((res) => {
					if (!res) return;

					// Set the state of the app
					if (res.appMenu) setAppMenu(res.appMenu);
					if (res.messages) setMessages(res.messages);
					if (res.keybinds) setCurrentKeybinds(res.keybinds);
					if (res.settings) setCurrentSettings(res.settings);
					if (res.windowState) setCurrentWindowState(res.windowState);

					// Highlight the active window
					const root = window.document.documentElement;
					if (res.active) {
						root.classList.add('active');
					} else {
						root.classList.remove('active');
					}
				})
				.catch(console.error);

			// Get crosshair images
			window.electron.ipcRenderer
				.invoke(ipcChannels.GET_CROSSHAIR_IMAGES)
				.then((res) => {
					const images = res
						.filter((img: string) => img.startsWith('/') || img.startsWith('\\') || /^[A-Z]:\\/i.test(img))
						.map((img: any) => {
							return {
								label: (
									<div className="flex gap-2 justify-between items-center">
										<div className="w-6 h-6">
											<img src={`file://${img}`} alt="" />
										</div>
										{img.split('/').pop()}
									</div>
								),
								value: img,
							};
						});
					setCrosshairImages(images);
				})
				.catch(console.error);
		};

		// Store unsubscribe functions for proper cleanup
		const unsubscribers: Array<(() => void) | undefined> = [];

		// Listen for messages from the main process
		const unsubAppUpdated = window.electron.ipcRenderer.on(ipcChannels.APP_UPDATED, async (data) => {
			console.log('APP_UPDATED', data);

			await synchronizeAppState();
		});
		unsubscribers.push(unsubAppUpdated);

		// Create notifications using the renderer
		const unsubNotification = window.electron.ipcRenderer.on(
			ipcChannels.APP_NOTIFICATION,
			({ title, body, action }: any) => {
				toast(title, {
					...(body ? { description: body } : {}),
					...(action ? { action } : {}),
				});
			},
		);
		unsubscribers.push(unsubNotification);

		// Get app info: name, version, paths, os - DOES NOT CHANGE
		window.electron.ipcRenderer
			.invoke(ipcChannels.GET_APP_INFO)
			.then((info) => {
				setAppInfo(info);

				// Set native window border radius based on OS and version
				if (info.platform) {
					const root = window.document.documentElement;
					root.style.setProperty(
						'--window-border-radius',
						getNativeWindowBorderRadius(info.platform),
					);
				}

				return info;
			})
			.then(({ paths }) => {
				// SOUNDS
				preload(paths.sounds);

				// Setup listener to play sounds
				const unsubSound = window.electron.ipcRenderer.on(ipcChannels.PLAY_SOUND, (sound: any) => {
					// Read latest settings from state via invoke to avoid stale closure
					window.electron.ipcRenderer
						// @ts-ignore
						.invoke(ipcChannels.GET_RENDERER_SYNC, id ?? 'settings')
						.then((res) => {
							if (res?.settings?.allowSounds) {
								play({ name: sound, path: paths.sounds });
							}
						})
						.catch(console.error);
				});
				unsubscribers.push(unsubSound);
			})
			.catch(console.error);

		// Request initial data when the app loads
		synchronizeAppState();

		// Fetch license status
		refreshLicense();

		// Let the main process know that the renderer is ready
		window.electron.ipcRenderer.send(ipcChannels.RENDERER_READY);

		return () => {
			// Clean up listeners using stored unsubscribe functions
			unsubscribers.forEach((unsub) => unsub?.());
		};
	}, []);

	// Electron API functions
	const setSettings = useCallback((newSettings: Partial<SettingsType>) => {
		window.electron.setSettings(newSettings);
	}, []);

	const value = useMemo(() => {
		return {
			app: appInfo,
			appMenu,
			keybinds,
			settings,
			setSettings,
			messages,
			message: messages[messages.length - 1] ?? '',
			crosshairImages,
			windowState,
			isPremium,
			refreshLicense,
		};
	}, [
		appInfo,
		appMenu,
		crosshairImages,
		keybinds,
		settings,
		setSettings,
		messages,
		windowState,
		isPremium,
		refreshLicense,
	]);

	return (
		<GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
	);
}

export const useGlobalContext = () => {
	const context = useContext(GlobalContext);

	if (context === undefined)
		throw new Error('useGlobalContext must be used within a GlobalContext');

	return context;
};
