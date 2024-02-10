import { Separator } from '@/components/ui/separator';
import { SettingsType } from '@/config/settings';
import { InputColor } from '@/renderer/components/input/InputColor';
import { InputComboboxForm } from '@/renderer/components/input/InputComboboxForm';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { reticleItems } from '@/renderer/config/reticles';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsReticle() {
	const { settings } = useGlobalContext();
	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Reticle</h3>
				<p className="text-sm text-muted-foreground">
					Adjust the crosshair size, color, and opacity.
				</p>
			</div>
			<Separator />

			<InputComboboxForm
				value={settings.reticle}
				onChange={(value) => {
					handleChangeSetting({ reticle: value });
				}}
				label="Reticle Style"
				details="Select the crosshair style."
				items={reticleItems}
				className="w-[250px] h-60 h"
			/>
			<InputSlider
				value={settings.reticleSize}
				onChange={(value) => {
					handleChangeSetting({ reticleSize: value });
				}}
				label="Reticle Size"
				details="Adjust the size of the reticle in the center of the crosshair."
				min={0}
				max={100}
			/>
			<InputSlider
				value={settings.reticleRotation}
				onChange={(value) => {
					handleChangeSetting({ reticleRotation: value });
				}}
				label="Reticle Rotation"
				details="Adjust the rotation of the reticle in the center of the crosshair."
				min={-180}
				max={180}
				throttleDelay={5}
			/>
			<InputColor
				value={settings.reticleColor}
				label="Reticle Color"
				details="The color of the reticle in the center of the crosshair."
				onChange={(value) => {
					handleChangeSetting({ reticleColor: value });
				}}
			/>
			<InputColor
				value={settings.strokeColor}
				label="Stroke Color"
				details="The color of the stroke around the crosshair."
				onChange={(value) => {
					handleChangeSetting({ strokeColor: value });
				}}
			/>
		</div>
	);
}
