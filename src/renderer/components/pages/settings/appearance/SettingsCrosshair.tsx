import { Separator } from '@/components/ui/separator';
import { CrosshairWindowStateType } from '@/config/settings';
import { InputColor } from '@/renderer/components/input/InputColor';
import { InputComboboxForm } from '@/renderer/components/input/InputComboboxForm';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { useGlobalContext } from '@/renderer/context/global-context';
import { useCallback } from 'react';
import { SettingsReticle } from './SettingsReticle';

export function SettingsCrosshair() {
	const { crosshairImages, windowState } = useGlobalContext();

	const handleChangeSetting = useCallback(
		(setting: Partial<CrosshairWindowStateType>) => {
			window.electron.setWindowState(setting);
		},
		[],
	);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Edit Crosshair Window</h3>
				<p className="text-sm text-muted-foreground">
					Adjust the crosshair settings for the active window.
				</p>
			</div>
			<Separator />
			<InputColor
				value={windowState.backgroundColor}
				label="Background Color"
				details="The background color of the Crosshair application window."
				onChange={(value) => {
					handleChangeSetting({ backgroundColor: value });
				}}
			/>
			<InputColor
				value={windowState.foregroundColor}
				label="Accent Color"
				details="Highlight color used for buttons, links, and other interactive elements."
				onChange={(value) => {
					handleChangeSetting({ foregroundColor: value });
				}}
			/>
			<InputComboboxForm
				value={windowState.crosshair}
				onChange={(value) => {
					handleChangeSetting({ crosshair: value });
				}}
				label="Crosshair"
				details="Select the crosshair style."
				items={crosshairImages}
				className="w-[350px] h-60"
			/>
			<InputSlider
				value={windowState.crosshairSize}
				onChange={(value) => {
					handleChangeSetting({ crosshairSize: value });
				}}
				label="Crosshair Size"
				details="Adjust the size of the crosshair."
				min={0}
				max={100}
			/>
			<InputSlider
				value={windowState.crosshairOpacity}
				onChange={(value) => {
					handleChangeSetting({ crosshairOpacity: value });
				}}
				label="Crosshair Opacity"
				details="Adjust the opacity of the crosshair."
				min={0}
				max={100}
			/>
			<InputSlider
				value={windowState.crosshairRotation}
				onChange={(value) => {
					handleChangeSetting({ crosshairRotation: value });
				}}
				label="Crosshair Rotation"
				details="Adjust the rotation of the crosshair."
				min={-180}
				max={180}
			/>
			<SettingsReticle />
			<Separator />
			<InputSwitch
				label="Resizable"
				details="Allow the Crosshair window to be resized."
				value={windowState.resizable}
				onChange={(value) => {
					handleChangeSetting({ resizable: value });
				}}
				card
			/>
		</div>
	);
}
