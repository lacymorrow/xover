import { QuitButton } from './QuitButton';
import { ResetButton } from './ResetButton';
import { SettingsButton } from './SettingsButton';

export function Controls() {
	return (
		<div
			id="controls"
			// className="absolute top-0 right-0 bottom-0 grid grid-cols-[auto_auto] justify-between content-between h-full"
			className="grid grid-cols-[auto_auto] justify-between content-between h-full"
		>
			<QuitButton />
			<ResetButton />

			<SettingsButton />
			<SettingsButton />
		</div>
	);
}
