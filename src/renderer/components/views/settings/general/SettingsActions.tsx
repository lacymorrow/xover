// todo: disable settings for disabled actions

import { Separator } from '@/components/ui/separator';
import { UiohookBehaviorType, SettingsType } from '@/config/settings';
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
			{/* <Separator />
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
			<InputMouseKeyboardBind
				value={settings.secondaryBind}
				onChange={(value) => {
					handleChangeSetting({ secondaryBind: value });
				}}
				label="Secondary Bind"
			/> */}
			<Separator />
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
			<InputSelectForm
				value={settings.tiltBehavior}
				onChange={(value) => {
					handleChangeSetting({ tiltBehavior: value as UiohookBehaviorType });
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
      <InputSwitch
        value={settings.adsResizeEnabled}
        onChange={() => {
          handleChangeSetting({ adsResizeEnabled: !settings.adsResizeEnabled });
        }}
        label="ADS Resize"
        description="Resize the crosshair while the specified mouse button is active."
      />
      <InputSelectForm
        value={settings.adsResizeBehavior}
        onChange={(value) => {
          handleChangeSetting({ adsResizeBehavior: value as UiohookBehaviorType });
        }}
        label="ADS Behavior"
        description="Hold will resize while pressed, press will toggle on/off."
        items={[
          { label: 'Hold to resize', value: 'hold' },
          { label: 'Press to toggle on/off', value: 'toggle' },
        ]}
      />
      <InputMouseKeyboardBind
        value={settings.adsResizeBind}
        onChange={(value) => {
          handleChangeSetting({ adsResizeBind: value });
        }}
        label="ADS Mouse Bind"
        description="Choose a mouse button trigger (e.g., Right Mouse Button)."
      />
      <InputSlider
        value={settings.adsResizeSize}
        onChange={(value) => {
          handleChangeSetting({ adsResizeSize: value });
        }}
        label="ADS Resize Size"
        details="Crosshair size (1-100) to use while the ADS bind is active."
        min={1}
        max={100}
      />

      <Separator />
      <InputSelectForm
        value={settings.hideOnMouseBehavior}
        onChange={(value) => {
          handleChangeSetting({ hideOnMouseBehavior: value as UiohookBehaviorType });
        }}
        label="Hide on Mouse Behavior"
        description="Hold will hide while pressed, press will toggle on/off."
        items={[
          { label: 'Hold to hide', value: 'hold' },
          { label: 'Press to toggle on/off', value: 'toggle' },
        ]}
      />
      <InputMouseKeyboardBind
        value={settings.hideOnMouseBind}
        onChange={(value) => {
          handleChangeSetting({ hideOnMouseBind: value });
        }}
        label="Hide on Mouse Bind"
        description="Choose a mouse button trigger."
      />
      <InputMouseKeyboardBind
        value={settings.hideOnKeyBind}
        onChange={(value) => {
          handleChangeSetting({ hideOnKeyBind: value });
        }}
        label="Hide on Key Bind"
        description="Choose a keyboard key trigger."
      />

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
