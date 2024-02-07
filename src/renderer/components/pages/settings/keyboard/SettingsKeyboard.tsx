import { Separator } from '@/components/ui/separator';
import { SettingsType } from '@/config/settings';
import { useGlobalContext } from '@/renderer/context/global-context';
import { InputSwitch } from '@/renderer/components/input/InputSwitch';
import { InputSlider } from '@/renderer/components/input/InputSlider';
import { InputMouseKeyboardBind } from '@/renderer/components/input/InputMouseKeyboardBind';
import { InputKeyboardShortcut } from '@/renderer/components/input/InputKeyboardShortcut';
import { InputColor } from '@/renderer/components/input/InputColor';
import { CustomAcceleratorsType } from '@/types/keyboard';

export function SettingsKeyboard() {
	const { keybinds } = useGlobalContext();

	const handleChangeKeybind = (
		key: keyof CustomAcceleratorsType,
		value: string,
	) => {
		window.electron.setKeybind(key, value);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Keyboard Shortcuts</h3>
				<p className="text-sm text-muted-foreground">
					Customize keyboard shortcuts to control the application. Press
					&quot;Backspace&quot; or &quot;Delete&quot; to clear the current
					shortcut.
				</p>
			</div>
			<Separator />
			<InputKeyboardShortcut
				value={keybinds.lock}
				label="Lock Crosshair in Place"
				description="Lock/Unlock the crosshair in place and hide the UI."
				onChange={(value) => {
					handleChangeKeybind('lock', value);
				}}
			/>
			<InputKeyboardShortcut
				value={keybinds.center}
				label="Center Crosshair"
				description="Center the active window on the screen."
				onChange={(value) => {
					handleChangeKeybind('center', value);
				}}
			/>
			<InputKeyboardShortcut
				value={keybinds.newWindow}
				label="Duplicate Crosshair"
				description="Create a new crosshair window."
				onChange={(value) => {
					handleChangeKeybind('newWindow', value);
				}}
			/>
			<InputKeyboardShortcut
				value={keybinds.focusNextWindow}
				label="Focus Next Window"
				description="Move focus to the next window."
				onChange={(value) => {
					handleChangeKeybind('focusNextWindow', value);
				}}
			/>
			<InputKeyboardShortcut
				value={keybinds.moveUp}
				label="Move Up"
				description="Move the active window up by a single pixel."
				onChange={(value) => {
					handleChangeKeybind('moveUp', value);
				}}
			/>
			<InputKeyboardShortcut
				value={keybinds.moveDown}
				label="Move Down"
				description="Move the active window down by a single pixel."
				onChange={(value) => {
					handleChangeKeybind('moveDown', value);
				}}
			/>
			<InputKeyboardShortcut
				value={keybinds.moveLeft}
				label="Move Left"
				description="Move the active window left by a single pixel."
				onChange={(value) => {
					handleChangeKeybind('moveLeft', value);
				}}
			/>
			<InputKeyboardShortcut
				value={keybinds.moveRight}
				label="Move Right"
				description="Move the active window right by a single pixel."
				onChange={(value) => {
					handleChangeKeybind('moveRight', value);
				}}
			/>
			<InputKeyboardShortcut
				value={keybinds.changeDisplay}
				label="Move Window to Next Display"
				description="Move the active window to the next connected display."
				onChange={(value) => {
					handleChangeKeybind('changeDisplay', value);
				}}
			/>
			<Separator />
			<InputKeyboardShortcut
				value={keybinds.hide}
				label="Hide Application"
				description="Show/Hide all application windows."
				onChange={(value) => {
					handleChangeKeybind('hide', value);
				}}
			/>
			<InputKeyboardShortcut
				value={keybinds.quit}
				label="Quit Application"
				description="Close the application."
				onChange={(value) => {
					handleChangeKeybind('quit', value);
				}}
			/>
			<InputKeyboardShortcut
				value={keybinds.reset}
				label="Reset Application Settings"
				description="Clear all settings and restore the app to its default state."
				onChange={(value) => {
					handleChangeKeybind('reset', value);
				}}
			/>
		</div>
	);
}
