import React from 'react';
import { GearIcon } from '@radix-ui/react-icons';
import { ipcChannels } from '@/config/ipc-channels';
import { debounce } from '@/utils/debounce';
import { DOUBLE_CLICK_DELAY } from '@/config/config';
import { IconButton } from '../ui/IconButton';

export function SettingsButton() {
	const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		console.log(e.detail);
		switch (e.detail) {
			case 1:
				// Single click
				window.electron.ipcRenderer.send(ipcChannels.OPEN_SETTINGS);
				break;
			case 2:
				// Double click
				// Center app on screen
				window.electron.ipcRenderer.send(ipcChannels.CENTER_SETTINGS_WINDOW);
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
