import { ipcChannels } from '@/config/ipc-channels';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { IconButton } from '../ui/IconButton';

export function QuitButton() {
	const handleClick = () => {
		window.electron.ipcRenderer.send(ipcChannels.QUIT_APP);
	};
	return (
		<IconButton onClick={handleClick}>
			<CrossCircledIcon />
		</IconButton>
	);
}
