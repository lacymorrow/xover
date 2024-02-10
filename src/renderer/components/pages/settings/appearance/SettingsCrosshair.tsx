import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SettingsType } from '@/config/settings';
import { InputComboboxForm } from '@/renderer/components/input/InputComboboxForm';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { useGlobalContext } from '@/renderer/context/global-context';
import { SettingsReticle } from './SettingsReticle';
import { SettingsSVG } from './SettingsSVG';

export function SettingsCrosshair() {
	const { crosshairImages, settings } = useGlobalContext();
	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Crosshair</h3>
				<p className="text-sm text-muted-foreground">
					Adjust the crosshair size, color, and opacity.
				</p>
			</div>
			<Separator />
			<InputComboboxForm
				value={settings.crosshair}
				onChange={(value) => {
					handleChangeSetting({ crosshair: value });
				}}
				label="Crosshair"
				details="Select the crosshair style."
				items={crosshairImages}
				className="w-[350px] h-60"
			/>
			<InputSlider
				value={settings.crosshairSize}
				onChange={(value) => {
					handleChangeSetting({ crosshairSize: value });
				}}
				label="Crosshair Size"
				details="Adjust the size of the crosshair."
				min={0}
				max={100}
			/>
			<InputSlider
				value={settings.crosshairOpacity}
				onChange={(value) => {
					handleChangeSetting({ crosshairOpacity: value });
				}}
				label="Crosshair Opacity"
				details="Adjust the opacity of the crosshair."
				min={0}
				max={100}
			/>
			<InputSlider
				value={settings.crosshairRotation}
				onChange={(value) => {
					handleChangeSetting({ crosshairRotation: value });
				}}
				label="Crosshair Rotation"
				details="Adjust the rotation of the crosshair."
				min={-180}
				max={180}
			/>
			<SettingsReticle />
			<SettingsSVG />
			WINDOW Size
			<InputSwitch
				label="Resizable"
				description="Allow the app window to be resized."
				card
			/>
			Position X
			<Input value={400} type="number" />
			Position Y
			<Input value={400} type="number" />
		</div>
	);
}
