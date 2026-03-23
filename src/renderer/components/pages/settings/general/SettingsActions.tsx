// todo: disable settings for disabled actions

import { Separator } from '@/components/ui/separator';
import { IOHookBehaviorType, SettingsType } from '@/config/settings';
import { InputMouseKeyboardBind } from '@/renderer/components/input/InputMouseKeyboardBind';
import { InputSelectForm } from '@/renderer/components/input/InputSelectForm';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { POLAR_CHECKOUT_URL } from '@/config/license';
import { PremiumGate } from '@/renderer/components/ui/PremiumGate';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsActions() {
	const { settings } = useGlobalContext();

	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Input Bindings</h3>
				<p className="text-sm text-muted-foreground">
					Bind mouse and keyboard inputs to crosshair actions. Hooks are loaded
					when a binding is enabled and the crosshair is active.
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

			{/* Hide on Action */}
			<InputSwitch
				value={settings.hideOnMouseEnabled || settings.hideOnKeyEnabled}
				onChange={() => {
					const newEnabled = !(settings.hideOnMouseEnabled || settings.hideOnKeyEnabled);
					handleChangeSetting({
						hideOnMouseEnabled: newEnabled,
						hideOnKeyEnabled: newEnabled,
					});
				}}
				label="Auto-Hide"
				description="Hide the crosshair on input (key or mouse button press)."
			/>
			{(settings.hideOnMouseEnabled || settings.hideOnKeyEnabled) && (
				<>
					<InputMouseKeyboardBind
						value={settings.hideOnKeyBind || `mouse:${settings.hideOnMouseButton}`}
						onChange={(value) => {
							const [input, trigger] = value.split(':');
							if (input === 'mouse') {
								handleChangeSetting({
									hideOnMouseEnabled: true,
									hideOnKeyEnabled: false,
									hideOnMouseButton: parseInt(trigger, 10),
								});
							} else {
								handleChangeSetting({
									hideOnMouseEnabled: false,
									hideOnKeyEnabled: true,
									hideOnKeyBind: value,
								});
							}
						}}
						label="Hide bind"
					/>
					<InputSelectForm
						value={settings.hideOnMouseBehavior}
						onChange={(value) => {
							handleChangeSetting({
								hideOnMouseBehavior: value as IOHookBehaviorType,
							});
						}}
						label="Hide Behavior"
						description="Hold hides while pressed, toggle flips on each press."
						items={[
							{ label: 'Hold to hide', value: 'hold' },
							{ label: 'Press to toggle', value: 'toggle' },
						]}
					/>
				</>
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
				label="ADS Zoom"
				description="Resize the crosshair when aiming down sights."
			/>
			{settings.adsResizeEnabled && (
				<>
					<InputMouseKeyboardBind
						value={`mouse:${settings.adsResizeButton}`}
						onChange={(value) => {
							const [_input, trigger] = value.split(':');
							handleChangeSetting({
								adsResizeButton: parseInt(trigger, 10),
							});
						}}
						label="ADS bind"
					/>
					<InputSelectForm
						value={settings.adsResizeBehavior}
						onChange={(value) => {
							handleChangeSetting({
								adsResizeBehavior: value as IOHookBehaviorType,
							});
						}}
						label="ADS Behavior"
						description="Hold resizes while pressed, toggle flips on each press."
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

			{/* Secondary Action (Premium) */}
			<PremiumGate
				fallback={
					<div className="space-y-2">
						<InputSwitch
							value={false}
							onChange={() => {
								window.electron.openUrl(POLAR_CHECKOUT_URL);
							}}
							label="Secondary Crosshair"
							description="Switch to a second crosshair when the bind is active."
							details="Upgrade to premium to unlock this feature."
						/>
					</div>
				}
			>
				<InputSwitch
					value={settings.secondaryActionEnabled}
					onChange={() => {
						handleChangeSetting({
							secondaryActionEnabled: !settings.secondaryActionEnabled,
						});
					}}
					label="Secondary Crosshair"
					description="Switch to a second crosshair when the bind is active."
					details="Configure the secondary crosshair appearance in the Crosshair tab."
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
			</PremiumGate>
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
				details="Animation speed for tilt, secondary swap, and other binding transitions (ms)."
				min={0}
				max={1000}
			/>
		</div>
	);
}
