import { Separator } from '@/components/ui/separator';
import { AppSizeModeType, CrosshairWindowStateType } from '@/config/settings';
import { InputColor } from '@/renderer/components/input/InputColor';
import { InputRadioGroup } from '@/renderer/components/input/InputRadioGroup';
import { ThemeForm } from '@/renderer/components/pages/settings/appearance/ThemeForm';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsAppearance() {
	const { windowState, settings, setSettings } = useGlobalContext();

	const handleChangeWindowState = (
		setting: Partial<CrosshairWindowStateType>,
	) => {
		window.electron.setWindowState(setting);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Appearance</h3>
				<p className="text-sm text-muted-foreground">
					Theme, colors, and window sizing.
				</p>
			</div>
			<Separator />
			<ThemeForm />
			<Separator />
			<InputColor
				value={windowState.backgroundColor}
				label="Background Color"
				details="The background color of the Crosshair application window."
				onChange={(value) => {
					handleChangeWindowState({ backgroundColor: value });
				}}
			/>
			<InputColor
				value={windowState.foregroundColor}
				label="Accent Color"
				details="Highlight color used for buttons, links, and other interactive elements."
				onChange={(value) => {
					handleChangeWindowState({ foregroundColor: value });
				}}
			/>
			<Separator />
			<InputRadioGroup
				label="Window Size Mode"
				details="Normal: fixed size. Resizable: drag to resize. Fullscreen: fills the entire screen."
				items={[
					{ value: 'normal', label: 'Normal' },
					{ value: 'resizable', label: 'Resizable' },
					{ value: 'fullscreen', label: 'Fullscreen' },
				]}
				value={settings.appSizeMode}
				onChange={(value) => {
					setSettings({ appSizeMode: value as AppSizeModeType });
				}}
				card
			/>
			<InputRadioGroup
				label="Crosshair Window Size"
				details="Compact: minimal, no controls. Normal: default size with controls. Large: bigger window with controls."
				items={[
					{ value: 'compact', label: 'Compact' },
					{ value: 'normal', label: 'Normal' },
					{ value: 'large', label: 'Large' },
				]}
				value={windowState.sizeMode ?? 'normal'}
				onChange={(value) => {
					handleChangeWindowState({
						sizeMode: value as CrosshairWindowStateType['sizeMode'],
					});
				}}
				card
			/>
		</div>
	);
}
