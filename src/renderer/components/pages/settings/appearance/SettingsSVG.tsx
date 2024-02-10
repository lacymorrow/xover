import { Separator } from '@/components/ui/separator';
import { SettingsType } from '@/config/settings';
import { InputColor } from '@/renderer/components/input/InputColor';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsSVG() {
	const { settings } = useGlobalContext();
	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">SVG</h3>
				<p className="text-sm text-muted-foreground">
					Customize the appearance of the app. Switch between light and dark
					themes.
				</p>
			</div>
			<Separator />
			<InputColor
				value={settings.fillColor}
				label="Fill Color"
				details="The background color of the Crosshair application window."
				onChange={(value) => {
					handleChangeSetting({ fillColor: value });
				}}
			/>
			<InputColor
				value={settings.strokeColor}
				label="Stroke Color"
				details="Highlight color used for buttons, links, and other interactive elements."
				onChange={(value) => {
					handleChangeSetting({ strokeColor: value });
				}}
			/>

			<InputSlider
				value={settings.strokeWidth}
				onChange={(value) => {
					handleChangeSetting({ strokeWidth: value });
				}}
				label="Stroke Width"
				details="Adjust the size of the crosshair."
				min={0}
				max={10}
				step={0.1}
			/>
		</div>
	);
}
