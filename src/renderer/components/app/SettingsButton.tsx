import { DOUBLE_CLICK_DELAY } from '@/config/config';
import { ipcChannels } from '@/config/ipc-channels';
import { debounce } from '@/utils/debounce';
import { GearIcon } from '@radix-ui/react-icons';
import React from 'react';
import { IconButton } from '../ui/IconButton';

export function SettingsButton() {
	const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
	};

	const debouncedHandleClick = debounce(handleClick, DOUBLE_CLICK_DELAY);

	return (
		<IconButton onClick={debouncedHandleClick}>
			<GearIcon />
		</IconButton>
	);
}
