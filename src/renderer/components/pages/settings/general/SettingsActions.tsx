import { Separator } from '@/components/ui/separator';
import {
	HideBehaviorType,
	IOHookBehaviorType,
	SettingsType,
} from '@/config/settings';
import { InputMouseKeyboardBind } from '@/renderer/components/input/InputMouseKeyboardBind';
import { InputSelectForm } from '@/renderer/components/input/InputSelectForm';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { MoreSettings } from '@/renderer/components/ui/MoreSettings';
import { useGlobalContext } from '@/renderer/context/global-context';

/**
 * The "In game" pane, formerly Bindings (LAC-5868).
 *
 * Above the fold: hiding while you aim, and follow-mouse. ADS zoom, tilt and
 * the transition duration moved under "More"; the Secondary Crosshair switch
 * and its bind moved to the Crosshair pane, next to the crosshair they pick.
 * No setting was dropped and no store key changed.
 */
export function SettingsActions() {
	const { settings } = useGlobalContext();

	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">In game</h3>
				<p className="text-sm text-muted-foreground">
					Bind mouse and keyboard inputs to crosshair actions. Hooks are loaded
					when a binding is enabled and the crosshair is active.
				</p>
			</div>
			<Separator />

			{/* Hide on Action */}
			<InputSwitch
				value={settings.hideOnMouseEnabled || settings.hideOnKeyEnabled}
				onChange={() => {
					const newEnabled = !(
						settings.hideOnMouseEnabled || settings.hideOnKeyEnabled
					);
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
						value={
							settings.hideOnKeyBind || `mouse:${settings.hideOnMouseButton}`
						}
						onChange={(value) => {
							const [input, trigger] = value.split(':');
							if (input === 'mouse') {
								handleChangeSetting({
									hideOnMouseEnabled: true,
									hideOnKeyEnabled: false,
									hideOnMouseButton: parseInt(trigger, 10),
									// Press mode is keyboard only, and a mouse bind must not
									// be left on a behavior the select no longer offers.
									...(settings.hideOnMouseBehavior === 'press'
										? { hideOnMouseBehavior: 'hold' as const }
										: {}),
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
								hideOnMouseBehavior: value as HideBehaviorType,
							});
						}}
						label="Hide Behavior"
						description="Hold hides while pressed, toggle flips on each press."
						items={[
							{ label: 'Hold to hide', value: 'hold' },
							{ label: 'Press to toggle', value: 'toggle' },
							// Needs a button to come back on, so it is offered only for a
							// keyboard bind.
							...(settings.hideOnKeyEnabled
								? [
										{
											label: 'Press to hide until the next ADS click',
											value: 'press',
										},
									]
								: []),
						]}
					/>
					<InputSwitch
						value={settings.hideOnMouseInvert}
						onChange={() => {
							handleChangeSetting({
								hideOnMouseInvert: !settings.hideOnMouseInvert,
							});
						}}
						label="Invert"
						description="Hide the crosshair by default and show it on the bind instead."
						details="For games where you only want the crosshair while aiming down sights. Starts hiding once the crosshair is locked, like the hide binds themselves."
					/>
				</>
			)}
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

			<MoreSettings>
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
			</MoreSettings>
		</div>
	);
}
