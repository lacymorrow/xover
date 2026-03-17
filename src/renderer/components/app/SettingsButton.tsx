import { DOUBLE_CLICK_DELAY } from '@/config/config';
import { ipcChannels } from '@/config/ipc-channels';
import { useGlobalContext } from '@/renderer/context/global-context';
import { debounce } from '@/utils/debounce';
import { GearIcon } from '@radix-ui/react-icons';
import React, { useCallback } from 'react';
import { IconButton } from '../ui/IconButton';

export function SettingsButton() {
	const { settings } = useGlobalContext();
	const handleOpenOrCenterSettings = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			// Open settings if not already open
			if (!settings.isSettingsWindowOpen) {
				window.electron.ipcRenderer.send(ipcChannels.OPEN_SETTINGS);
				return;
			}

			// Double click: center settings window
			switch (e.detail) {
				case 1:
					// Single click: open or close settings
					window.electron.ipcRenderer.send(ipcChannels.OPEN_SETTINGS);
					break;
				case 2:
					// Double click
					// Center app on screen
					window.electron.ipcRenderer.send(ipcChannels.CENTER_WINDOW_SETTINGS);
					break;

				default:
					break;
			}
		},
		[settings],
	);

	const debouncedHandleClick = debounce(
		handleOpenOrCenterSettings,
		DOUBLE_CLICK_DELAY,
	);

	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			debouncedHandleClick(e);
		},
		[debouncedHandleClick],
	);

	return (
		<IconButton onClick={handleClick} data-testid="settings-button">
			<GearIcon />
		</IconButton>
	);
}
