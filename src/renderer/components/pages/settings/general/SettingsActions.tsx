// todo: disable settings for disabled actions

import { Separator } from '@/components/ui/separator';
import { IOHookBehaviorType, SettingsType } from '@/config/settings';
import { InputMouseKeyboardBind } from '@/renderer/components/input/InputMouseKeyboardBind';
import { InputSelectForm } from '@/renderer/components/input/InputSelectForm';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsActions() {
	const { app, settings } = useGlobalContext();

	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Mouse and Keyboard Actions</h3>
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
			/>
			<Separator />
			<InputSwitch
				value={settings.tiltActionEnabled}
				onChange={() => {
					handleChangeSetting({
						tiltActionEnabled: !settings.tiltActionEnabled,
					});
				}}
				label="Enable Tilt Action"
				description="Enable tilting the crosshair when the bind is pressed/held."
			/>
			<InputSelectForm
				value={settings.tiltBehavior}
				onChange={(value) => {
					handleChangeSetting({ tiltBehavior: value as IOHookBehaviorType });
				}}
				label="Tilt Behavior"
				description="Select the tilt behavior. Hold will tilt while the bind is held, press will toggle tilt on/off."
				items={[
					{ label: 'Hold to enable tilt', value: 'hold' },
					{ label: 'Press to toggle on/off', value: 'toggle' },
				]}
			/>

			<InputSlider
				value={settings.tiltAngle}
				onChange={(value) => {
					handleChangeSetting({ tiltAngle: value });
				}}
				label="Tilt angle"
				details="Adjust the tilted angle. Negative values tilt counter-clockwise, positive values tilt clockwise."
				min={0}
				max={90}
			/>
			<InputMouseKeyboardBind
				value={settings.tiltLeftBind}
				onChange={(value) => {
					handleChangeSetting({ tiltLeftBind: value });
				}}
				label="Left tilt bind"
			/>
			<InputMouseKeyboardBind
				value={settings.tiltRightBind}
				onChange={(value) => {
					handleChangeSetting({ tiltRightBind: value });
				}}
				label="Right tilt bind"
			/>
			<Separator />
		</div>
	);
}
