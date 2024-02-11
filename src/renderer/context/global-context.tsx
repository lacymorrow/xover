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
				})
				.catch(console.error);

			// Get crosshair images
			window.electron.ipcRenderer
				.invoke(ipcChannels.GET_CROSSHAIR_IMAGES)
				.then((res) => {
					const images = res.map((img: any) => {
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

		// Listen for messages from the main process
		window.electron.ipcRenderer.on(ipcChannels.APP_UPDATED, async (_event) => {
			await synchronizeAppState();
		});

		// Create notifications using the renderer
		window.electron.ipcRenderer.on(
			ipcChannels.APP_NOTIFICATION,
			({ title, body, action }: any) => {
				toast(title, {
					...(body ? { description: body } : {}),
					...(action ? { action } : {}),
					// action: {
					// 	label: 'Ok',
					// 	onClick: () => {},
					// },
				});

				// Renderer Web Notifications
				// new Notification(title, {
				// 	body,
				// });
			},
		);

		// Get app info: name, version, paths, os - DOES NOT CHANGE
		window.electron.ipcRenderer
			.invoke(ipcChannels.GET_APP_INFO)
			.then((info) => {
				setAppInfo(info);
				return info;
			})
			.then(({ paths }) => {
				// SOUNDS
				preload(paths.sounds);

				// Setup listener to play sounds
				window.electron.ipcRenderer.on(ipcChannels.PLAY_SOUND, (sound: any) => {
					if (!settings.allowSounds) return;
					play({ name: sound, path: paths.sounds });
				});
			})
			.catch(console.error);

		// Request initial data when the app loads
		synchronizeAppState();

		// Let the main process know that the renderer is ready
		window.electron.ipcRenderer.send(ipcChannels.RENDERER_READY);

		return () => {
			// Clean up listeners when the component unmounts
			window.electron.ipcRenderer.removeAllListeners(ipcChannels.APP_UPDATED);
			window.electron.ipcRenderer.removeAllListeners(ipcChannels.PLAY_SOUND);
			window.electron.ipcRenderer.removeAllListeners(
				ipcChannels.APP_NOTIFICATION,
			);
		};
	}, [settings.allowSounds]);

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
