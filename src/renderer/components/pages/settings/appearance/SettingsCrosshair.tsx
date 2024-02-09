import { Separator } from '@/components/ui/separator';
import { SettingsType } from '@/config/settings';
import { InputColor } from '@/renderer/components/input/InputColor';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsCrosshair() {
	const { settings } = useGlobalContext();
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
