import { SettingsAbout } from '@/renderer/components/pages/settings/about/SettingsAbout';
import {
	Component1Icon,
	Crosshair1Icon,
	GearIcon,
	IdCardIcon,
	KeyboardIcon,
	LightningBoltIcon,
	LockClosedIcon,
} from '@radix-ui/react-icons';

import { SettingsApplication } from '@/renderer/components/pages/settings/general/SettingsApplication';
import { SettingsKeyboard } from '@/renderer/components/pages/settings/keyboard/SettingsKeyboard';
import { SettingsCrosshair } from '../components/pages/settings/appearance/SettingsCrosshair';
import { SettingsActions } from '../components/pages/settings/general/SettingsActions';
import { SettingsAdvanced } from '../components/pages/settings/general/SettingsAdvanced';
import { SettingsLicense } from '../components/pages/settings/license/SettingsLicense';

export const nav = {
	home: {
		title: 'Home',
		href: '/',
	},
	settings: {
		title: 'Settings',
		href: '/settings',
	},
};

/**
 * Four panes plus Advanced (LAC-5868). Appearance and Notifications are gone
 * as destinations, not as controls: theme and the two window-size settings
 * moved to App, app colours and the whole notification group moved to
 * Advanced. License and About stay reachable from the nav.
 */
export const settingsNavItems = [
	{
		title: 'Crosshair',
		href: 'crosshair',
		element: <SettingsCrosshair />,
		icon: Crosshair1Icon,
		index: true,
	},
	{
		title: 'In game',
		href: 'in-game',
		element: <SettingsActions />,
		icon: LightningBoltIcon,
	},
	{
		title: 'Shortcuts',
		href: 'shortcuts',
		element: <SettingsKeyboard />,
		icon: KeyboardIcon,
	},
	{
		title: 'App',
		href: 'app',
		element: <SettingsApplication />,
		icon: GearIcon,
	},
	{
		title: 'Advanced',
		href: 'advanced',
		element: <SettingsAdvanced />,
		icon: Component1Icon,
	},
	{
		title: 'License',
		href: 'license',
		element: <SettingsLicense />,
		icon: LockClosedIcon,
	},
	{
		title: 'About',
		href: 'about',
		element: <SettingsAbout />,
		icon: IdCardIcon,
	},
];
