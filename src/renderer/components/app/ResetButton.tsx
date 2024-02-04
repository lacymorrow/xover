import { ipcChannels } from '@/config/ipc-channels';
import { RefreshCwIcon } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

export function ResetButton() {
	const handleClick = () => {
		window.electron.ipcRenderer.send(ipcChannels.RESET_APP);
	};
	return (
		<IconButton onClick={handleClick}>
			<RefreshCwIcon />
		</IconButton>
	);
}
