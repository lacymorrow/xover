import { Separator } from '@/components/ui/separator';
import { AppSizeModeType, CrosshairWindowStateType } from '@/config/settings';
import { InputColor } from '@/renderer/components/input/InputColor';
import { InputRadioGroup } from '@/renderer/components/input/InputRadioGroup';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { useGlobalContext } from '@/renderer/context/global-context';
import { useCallback, useMemo } from 'react';
import { CrosshairGallery } from './CrosshairGallery';
import { SettingsReticle } from './SettingsReticle';

const APP_SIZE_MODE_ITEMS = [
	{ value: 'normal', label: 'Normal' },
	{ value: 'resizable', label: 'Resizable' },
	{ value: 'fullscreen', label: 'Fullscreen' },
];

const WINDOW_SIZE_MODE_ITEMS = [
	{ value: 'compact', label: 'Compact' },
	{ value: 'normal', label: 'Normal' },
	{ value: 'large', label: 'Large' },
];

export function SettingsCrosshair() {
	const { windowState, settings, setSettings } = useGlobalContext();

	const isSvgSelected = useMemo(() => {
		return windowState.crosshair?.toLowerCase().endsWith('.svg') ?? false;
	}, [windowState.crosshair]);

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
			<CrosshairGallery />
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
			{isSvgSelected && (
				<>
					<Separator />
					<h4 className="text-md font-medium">SVG Customization</h4>
					<InputColor
						value={windowState.fillColor}
						label="Fill Color"
						details="The fill color applied to the SVG crosshair."
						onChange={(value) => {
							handleChangeSetting({ fillColor: value });
						}}
					/>
					<InputColor
						value={windowState.strokeColor}
						label="Stroke Color"
						details="The stroke (outline) color applied to the SVG crosshair."
						onChange={(value) => {
							handleChangeSetting({ strokeColor: value });
						}}
					/>
					<InputSlider
						value={windowState.strokeWidth}
						onChange={(value) => {
							handleChangeSetting({ strokeWidth: value });
						}}
						label="Stroke Width"
						details="Adjust the stroke width of the SVG crosshair."
						min={0}
						max={10}
					/>
				</>
			)}
			<SettingsReticle />
			<Separator />
			<InputRadioGroup
				label="Window Size Mode"
				details="Normal: fixed size. Resizable: drag to resize. Fullscreen: fills the entire screen."
				items={APP_SIZE_MODE_ITEMS}
				value={settings.appSizeMode}
				onChange={(value) => {
					setSettings({ appSizeMode: value as AppSizeModeType });
				}}
				card
			/>
			<InputRadioGroup
				label="Crosshair Size"
				details="Compact: minimal, no controls. Normal: default size with controls. Large: bigger window with controls."
				items={WINDOW_SIZE_MODE_ITEMS}
				value={windowState.sizeMode ?? 'normal'}
				onChange={(value) => {
					handleChangeSetting({ sizeMode: value as CrosshairWindowStateType['sizeMode'] });
				}}
				card
			/>
		</div>
	);
}
