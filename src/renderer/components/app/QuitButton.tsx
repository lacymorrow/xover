import { ipcChannels } from '@/config/ipc-channels';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { useCallback } from 'react';
import { IconButton } from '../ui/IconButton';

export function QuitButton() {
	const handleClick = useCallback(() => {
		window.electron.ipcRenderer.send(ipcChannels.CLOSE_WINDOW);
	}, []);

	return (
		<IconButton onClick={handleClick}>
			<CrossCircledIcon />
		</IconButton>
	);
}
