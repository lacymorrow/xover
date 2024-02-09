import { ipcChannels } from '@/config/ipc-channels';
import { ReloadIcon } from '@radix-ui/react-icons';
import { IconButton } from '../ui/IconButton';

export function ResetButton() {
	const handleClick = () => {
		window.electron.ipcRenderer.send(ipcChannels.RESET_APP);
	};
	return (
		<IconButton onClick={handleClick}>
			<ReloadIcon />
		</IconButton>
	);
}
