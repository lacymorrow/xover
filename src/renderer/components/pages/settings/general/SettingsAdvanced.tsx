import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ipcChannels } from '@/config/ipc-channels';
import { CrosshairWindowStateType, SettingsType } from '@/config/settings';
import { $settings } from '@/config/strings';
import { InputCheckboxGroup } from '@/renderer/components/input/InputCheckboxGroup';
import { InputColor } from '@/renderer/components/input/InputColor';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { SettingsNotifications } from '@/renderer/components/pages/settings/notifications/SettingsNotifications';
import { useGlobalContext } from '@/renderer/context/global-context';
import { useState } from 'react';

/**
 * The Advanced pane (LAC-5868): everything a crosshair overlay does not need
 * you to see on day one. Notifications and sounds, the app's own colours,
 * analytics, quit-on-close, auto-hide settings, the GPU switches and the
 * maintenance buttons all landed here from the panes they used to own. Same
 * keys, same behavior, nothing dropped.
 */
export function SettingsAdvanced() {
	const { app, settings, windowState } = useGlobalContext();
	const [updateStatus, setUpdateStatus] = useState<string | null>(null);

	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};

	const handleChangeWindowState = (
		setting: Partial<CrosshairWindowStateType>,
	) => {
		window.electron.setWindowState(setting);
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

			<SettingsNotifications />

			<Separator />
			<div>
				<h4 className="font-medium text-base">App colors</h4>
				<p className="text-sm text-muted-foreground">
					The CrossOver window itself, not the crosshair.
				</p>
			</div>
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
			<div className="flex flex-col gap-4">
				<InputSwitch
					value={settings.allowAnalytics}
					onChange={() => {
						handleChangeSetting({ allowAnalytics: !settings.allowAnalytics });
					}}
					label="Anonymous usage analytics"
					description="Help improve the app by sending anonymous usage data."
					card
				/>

				{(app.isMac || app.isDev) && (
					<InputSwitch
						value={settings.quitOnWindowClose}
						onChange={() => {
							handleChangeSetting({
								quitOnWindowClose: !settings.quitOnWindowClose,
							});
						}}
						label="Quit when all windows close"
						description="Don't keep the app running when all windows are closed. (macOS only)"
						card
					/>
				)}

				<InputSwitch
					value={settings.settingsCloseOnBlur}
					onChange={() => {
						handleChangeSetting({
							settingsCloseOnBlur: !settings.settingsCloseOnBlur,
						});
					}}
					label="Auto-hide settings window"
					description="Close the settings window when it loses focus."
					card
				/>

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
