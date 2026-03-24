import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ipcChannels } from '@/config/ipc-channels';
import { SettingsType } from '@/config/settings';
import { $settings } from '@/config/strings';
import { InputCheckboxGroup } from '@/renderer/components/input/InputCheckboxGroup';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { useGlobalContext } from '@/renderer/context/global-context';
import { useState } from 'react';

// if (flagDisableGpu) {
// 	app.commandLine.appendSwitch('disable-gpu');
// }

// if (flagDisableSoftwareRasterizer) {
// 	app.commandLine.appendSwitch('disable-software-rasterizer');
// }

// if (flagDisableSoftwareRasterizer) {
// 	app.commandLine.appendSwitch('enable-transparent-visuals');
// }

// if (flagInProcessGpu) {
// 	app.commandLine.appendSwitch('in-process-gpu');
// }

// 		--force_high_performance_gpu
// Force using discrete GPU when there are multiple GPUs available.

// --force_low_power_gpu
// Force using integrated GPU when there are multiple GPUs available.
export function SettingsAdvanced() {
	const { app, settings } = useGlobalContext();
	const [updateStatus, setUpdateStatus] = useState<string | null>(null);

	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};

	const handleCheckUpdate = () => {
		setUpdateStatus('Checking for updates...');
		window.electron.ipcRenderer.send(ipcChannels.UPDATE_APP);
		setTimeout(() => setUpdateStatus(null), 5000);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Advanced Settings</h3>
				<p className="text-sm text-muted-foreground">
					Tweaks and settings for advanced users and debugging.
					<br />
					Use with caution.
				</p>
			</div>
			<Separator />
			<div className="flex flex-col gap-4">
				<InputSwitch
					value={settings.hardwareAcceleration}
					onChange={() => {
						handleChangeSetting({
							hardwareAcceleration: !settings.hardwareAcceleration,
						});
					}}
					label="Hardware Acceleration"
					description={`Use hardware acceleration to improve performance. ${$settings.reloadToApply}`}
					card
				/>

				<InputCheckboxGroup
					label="Command-line flags"
					description={
						<>
							Enable additional Electron command-line switches. See{' '}
							<a href="https://www.electronjs.org/docs/latest/api/command-line-switches">
								the Electron documentation
							</a>{' '}
							for details. {$settings.reloadToApply}
						</>
					}
					items={[
						{
							label: 'Enable transparent visuals',
							value: 'enable-transparent-visuals',
						},
						{
							label: 'Disable Renderer Backgrounding',
							value: 'disable-renderer-backgrounding',
						},
						{
							label: 'In-process GPU',
							value: 'in-process-gpu',
						},
						{
							label: 'Disable GPU',
							value: 'disable-gpu',
						},
						{
							label: 'Disable software rasterizer',
							value: 'disable-software-rasterizer',
						},
						{
							label: 'Enable logging',
							value: 'enable-logging',
						},
						{
							label: 'Enable remote debugging (port 9222)',
							value: 'remote-debugging-port=9222',
						},
						{
							label: 'Force high performance GPU',
							value: 'force_high_performance_gpu',
						},
						{
							label: 'Force low power GPU',
							value: 'force_low_power_gpu',
						},
					]}
					value={settings.commandLineFlags}
					onChange={(value) => {
						handleChangeSetting({ commandLineFlags: value });
					}}
					card
				/>

				<Button
					onClick={() => {
						window.electron.ipcRenderer.send(ipcChannels.CENTER_WINDOW_MAIN);
					}}
				>
					Center main window
				</Button>

				<Button
					onClick={() => {
						window.electron.ipcRenderer.send(ipcChannels.FOCUS_WINDOW_MAIN);
						window.electron.playSound('DONE');
					}}
				>
					Focus next window
				</Button>

				<Button onClick={handleCheckUpdate} disabled={updateStatus !== null}>
					{updateStatus ?? 'Check for updates'}
				</Button>
				{updateStatus && (
					<p className="text-sm text-muted-foreground">{updateStatus}</p>
				)}
				<Button
					variant="destructive"
					onClick={() => {
						window.electron.ipcRenderer.send(ipcChannels.RESET_APP);
					}}
				>
					Reset all settings to default
				</Button>
			</div>
		</div>
	);
}
