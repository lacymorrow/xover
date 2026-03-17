import { Separator } from '@/components/ui/separator';
import { SettingsType } from '@/config/settings';
import { $settings } from '@/config/strings';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { useGlobalContext } from '@/renderer/context/global-context';

export function SettingsApplication() {
	const { app, settings } = useGlobalContext();

	const handleChangeSetting = (setting: Partial<SettingsType>) => {
		window.electron.setSettings(setting);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Application Settings</h3>
				<p className="text-sm text-muted-foreground">
					Select your application preferences.
				</p>
			</div>
			<Separator />
			<InputSwitch
				value={settings.allowAutoUpdate}
				onChange={() => {
					handleChangeSetting({ allowAutoUpdate: !settings.allowAutoUpdate });
				}}
				label="Automatic updates"
				description="Automatically download and install new updates."
				card
			/>
			<InputSwitch
				value={settings.startLocked}
				onChange={() => {
					handleChangeSetting({ startLocked: !settings.startLocked });
				}}
				label="Allow start locked"
				description="Allow the app in a locked state, if it was locked when it was closed."
				card
			/>
			{(app.isMac || app.isDev) && (
				<InputSwitch
					value={settings.showDockIcon}
					onChange={() => {
						handleChangeSetting({ showDockIcon: !settings.showDockIcon });
					}}
					label="Dock icon"
					description="Show the app icon in the dock. (macOS only)"
					card
				/>
			)}
			{(app.isWindows || app.isDev) && (
				<InputSwitch
					value={settings.showTaskbarIcon}
					onChange={() => {
						handleChangeSetting({ showTaskbarIcon: !settings.showTaskbarIcon });
					}}
					label="Taskbar Icon"
					description={`Show the app icon in the taskbar. ${$settings.reloadToApply} (Windows only)`}
					card
				/>
			)}
			<InputSwitch
				value={settings.showTrayIcon}
				onChange={() => {
					handleChangeSetting({ showTrayIcon: !settings.showTrayIcon });
				}}
				label="Tray icon"
				description="Show the app icon in the system tray."
				card
			/>
			<InputSwitch
				value={settings.startOnLogin}
				onChange={() => {
					handleChangeSetting({ startOnLogin: !settings.startOnLogin });
				}}
				label="Start on Login"
				description="Automatically start the app when you log into your computer."
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
				label="Close settings on blur"
				description="Automatically hide the settings window when it loses focus."
				card
			/>
			<Separator />
			<InputSwitch
				value={settings.allowAnalytics}
				onChange={() => {
					handleChangeSetting({ allowAnalytics: !settings.allowAnalytics });
				}}
				label="Enable telemetry"
				description="Help improve the app by sending anonymous usage data."
			/>
		</div>
	);
}
