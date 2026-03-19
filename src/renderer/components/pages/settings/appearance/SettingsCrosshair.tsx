import { Separator } from '@/components/ui/separator';
import { CrosshairWindowStateType } from '@/config/settings';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { useGlobalContext } from '@/renderer/context/global-context';
import { useCallback, useMemo } from 'react';
import { CrosshairGallery } from './CrosshairGallery';
import { SettingsReticle } from './SettingsReticle';
import { InputColor } from '@/renderer/components/input/InputColor';

export function SettingsCrosshair() {
	const { windowState } = useGlobalContext();

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
		</div>
	);
}
