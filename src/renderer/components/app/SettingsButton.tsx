import { ipcChannels } from '@/config/ipc-channels';
import { GearIcon } from '@radix-ui/react-icons';
import { IconButton } from '../ui/IconButton';

export function SettingsButton() {
	const handleClick = () => {
		window.electron.ipcRenderer.send(ipcChannels.OPEN_SETTINGS);
	};
	return (
		<IconButton onClick={handleClick}>
			<GearIcon />
		</IconButton>
	);
}
