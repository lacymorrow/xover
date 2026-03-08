// todo: disable settings for disabled actions

import { Separator } from '@/components/ui/separator';
import { IOHookBehaviorType, SettingsType } from '@/config/settings';
import { InputMouseKeyboardBind } from '@/renderer/components/input/InputMouseKeyboardBind';
import { InputSelectForm } from '@/renderer/components/input/InputSelectForm';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsActions() {
	const { settings } = useGlobalContext();

	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">
					Mouse and Keyboard Actions (Beta)
				</h3>
				<p className="text-sm text-muted-foreground">
					These actions use native hooks to control the mouse and keyboard. The
					hooks are not loaded until the action is enabled and the crosshair is
					activated.
					<br />
					Use with caution.
				</p>
			</div>
			<Separator />
			<InputSwitch
				value={settings.followMouseEnabled}
				onChange={() => {
					handleChangeSetting({
						followMouseEnabled: !settings.followMouseEnabled,
					});
				}}
				label="Follow Mouse"
				description="Keep the crosshair centered on the mouse cursor."
			/>
			<Separator />

			{/* Hide on Mouse Button */}
			<InputSwitch
				value={settings.hideOnMouseEnabled}
				onChange={() => {
					handleChangeSetting({
						hideOnMouseEnabled: !settings.hideOnMouseEnabled,
					});
				}}
				label="Hide on Mouse Button"
				description="Hide the crosshair when a mouse button is pressed (ADS hide)."
			/>
			{settings.hideOnMouseEnabled && (
				<>
					<InputSelectForm
						value={String(settings.hideOnMouseButton)}
						onChange={(value) => {
							handleChangeSetting({
								hideOnMouseButton: parseInt(value, 10),
							});
						}}
						label="Mouse Button"
						description="Which mouse button triggers the hide."
						items={[
							{ label: 'Left Click', value: '1' },
							{ label: 'Right Click', value: '2' },
							{ label: 'Middle Click', value: '3' },
						]}
					/>
					<InputSelectForm
						value={settings.hideOnMouseBehavior}
						onChange={(value) => {
							handleChangeSetting({
								hideOnMouseBehavior: value as IOHookBehaviorType,
							});
						}}
						label="Hide Behavior"
						description="Hold hides while button is held, toggle flips on each click."
						items={[
							{ label: 'Hold to hide', value: 'hold' },
							{ label: 'Press to toggle', value: 'toggle' },
						]}
					/>
				</>
			)}
			<Separator />

			{/* Hide on Keypress */}
			<InputSwitch
				value={settings.hideOnKeyEnabled}
				onChange={() => {
					handleChangeSetting({
						hideOnKeyEnabled: !settings.hideOnKeyEnabled,
					});
				}}
				label="Hide on Keypress"
				description="Hide the crosshair while a key is held down."
			/>
			{settings.hideOnKeyEnabled && (
				<InputMouseKeyboardBind
					value={settings.hideOnKeyBind}
					onChange={(value) => {
						handleChangeSetting({ hideOnKeyBind: value });
					}}
					label="Hide key bind"
				/>
			)}
			<Separator />

			{/* ADS Resize */}
			<InputSwitch
				value={settings.adsResizeEnabled}
				onChange={() => {
					handleChangeSetting({
						adsResizeEnabled: !settings.adsResizeEnabled,
					});
				}}
				label="Resize on ADS"
				description="Change the crosshair size when aiming down sights (mouse button press)."
			/>
			{settings.adsResizeEnabled && (
				<>
					<InputSelectForm
						value={String(settings.adsResizeButton)}
						onChange={(value) => {
							handleChangeSetting({
								adsResizeButton: parseInt(value, 10),
							});
						}}
						label="ADS Button"
						description="Which mouse button triggers the resize."
						items={[
							{ label: 'Left Click', value: '1' },
							{ label: 'Right Click', value: '2' },
							{ label: 'Middle Click', value: '3' },
						]}
					/>
					<InputSelectForm
						value={settings.adsResizeBehavior}
						onChange={(value) => {
							handleChangeSetting({
								adsResizeBehavior: value as IOHookBehaviorType,
							});
						}}
						label="ADS Behavior"
						description="Hold resizes while button is held, toggle flips on each click."
						items={[
							{ label: 'Hold to resize', value: 'hold' },
							{ label: 'Press to toggle', value: 'toggle' },
						]}
					/>
					<InputSlider
						value={settings.adsResizeSize}
						onChange={(value) => {
							handleChangeSetting({ adsResizeSize: value });
						}}
						label="ADS crosshair size"
						details="The crosshair scale when ADS is active (percentage)."
						min={1}
						max={100}
					/>
				</>
			)}
			<Separator />

			{/* Secondary Action */}
			<InputSwitch
				value={settings.secondaryActionEnabled}
				onChange={() => {
					handleChangeSetting({
						secondaryActionEnabled: !settings.secondaryActionEnabled,
					});
				}}
				label="Enable Secondary Action"
				description="Enable a secondary action to be performed when the secondary bind is active."
				details="You can show, hide, resize, or change the crosshair when the secondary bind is active."
			/>
			{settings.secondaryActionEnabled && (
				<InputMouseKeyboardBind
					value={settings.secondaryBind}
					onChange={(value) => {
						handleChangeSetting({ secondaryBind: value });
					}}
					label="Secondary Bind"
				/>
			)}
			<Separator />

			{/* Tilt */}
			<InputSwitch
				value={settings.tiltActionEnabled}
				onChange={() => {
					handleChangeSetting({
						tiltActionEnabled: !settings.tiltActionEnabled,
					});
				}}
				label="Enable Tilt"
				description="Enable tilting the crosshair when the bind is pressed/held."
			/>
			{settings.tiltActionEnabled && (
				<>
					<InputSelectForm
						value={settings.tiltBehavior}
						onChange={(value) => {
							handleChangeSetting({
								tiltBehavior: value as IOHookBehaviorType,
							});
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
				</>
			)}

			<Separator />
			<InputSlider
				value={settings.transitionDuration}
				onChange={(value) => {
					handleChangeSetting({ transitionDuration: value });
				}}
				label="Transition duration"
				details="The duration of the transition when the crosshair moves."
				min={0}
				max={1000}
			/>
		</div>
	);
}
