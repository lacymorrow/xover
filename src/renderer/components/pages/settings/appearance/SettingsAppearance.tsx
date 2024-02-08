import { Separator } from '@/components/ui/separator';
import { SettingsType } from '@/config/settings';
import { InputColor } from '@/renderer/components/input/InputColor';
import { ThemeForm } from '@/renderer/components/pages/settings/appearance/ThemeForm';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsAppearance() {
	const { settings } = useGlobalContext();
	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Appearance</h3>
				<p className="text-sm text-muted-foreground">
					Customize the appearance of the app. Switch between light and dark
					themes.
				</p>
			</div>
			<Separator />
			<InputColor
				value={settings.backgroundColor}
				label="Background Color"
				details="The background color of the Crosshair application window."
				onChange={(value) => {
					handleChangeSetting({ backgroundColor: value });
				}}
			/>
			<InputColor
				value={settings.accentColor}
				label="Accent Color"
				details="Highlight color used for buttons, links, and other interactive elements."
				onChange={(value) => {
					handleChangeSetting({ accentColor: value });
				}}
			/>
			<ThemeForm />
		</div>
	);
}
