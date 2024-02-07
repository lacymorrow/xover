import { Separator } from '@/components/ui/separator';
import { SettingsType } from '@/config/settings';
import { useGlobalContext } from '@/renderer/context/global-context';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { InputMouseKeyboardBind } from '@/renderer/components/input/InputMouseKeyboardBind';
import { InputKeyboardShortcut } from '@/renderer/components/input/InputKeyboardShortcut';
import { InputColor } from '@/renderer/components/input/InputColor';
import { THROTTLE_DELAY } from '@/config/config';
import { $settings } from '@/config/strings';
import { Button } from '@/components/ui/button';
import { ipcChannels } from '@/config/ipc-channels';

export function SettingsActions() {
	const { app, settings } = useGlobalContext();

	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Advanced Settings</h3>
				<p className="text-sm text-muted-foreground">
					Tweaks and settings for advanced users and debugging.
					<br />
					Use with caution.
				</p>
			</div>
			<Separator />
			<InputSwitch
				value={settings.followMouse}
				onChange={() => {
					handleChangeSetting({ followMouse: !settings.followMouse });
				}}
				label="Follow Mouse"
				description="Keep the crosshair centered on the mouse cursor."
				card
			/>
		</div>
	);
}
