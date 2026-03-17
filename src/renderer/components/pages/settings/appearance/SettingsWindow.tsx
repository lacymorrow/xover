import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGlobalContext } from '@/renderer/context/global-context';
import { Link } from 'react-router-dom';
import { SettingsCrosshair } from './SettingsCrosshair';
import { SettingsSecondaryCrosshair } from './SettingsSecondaryCrosshair';

export function SettingsWindow() {
	const { settings } = useGlobalContext();

	// const handleChangeSetting = useCallback(
	// 	(setting: Partial<CrosshairWindowStateType>) => {
	// 		window.electron.setWindowState(setting);
	// 	},
	// 	[],
	// );

	if (!settings.secondaryActionEnabled) {
		return <SettingsCrosshair />;
	}

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<Tabs defaultValue="primary" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="primary">Primary</TabsTrigger>

						<Tooltip>
							<TooltipTrigger>
								<TabsTrigger
									value="secondary"
									disabled={!settings.secondaryActionEnabled}
								>
									Secondary
								</TabsTrigger>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									Enable <b>Secondary Crosshair</b> in the{' '}
									<Link to="actions">Actions</Link> panel.
								</p>
							</TooltipContent>
						</Tooltip>
					</TabsList>
					<TabsContent value="primary">
						<SettingsCrosshair />
					</TabsContent>
					<TabsContent value="secondary">
						<SettingsSecondaryCrosshair />
					</TabsContent>
				</Tabs>
			</div>
		</TooltipProvider>
	);
}
