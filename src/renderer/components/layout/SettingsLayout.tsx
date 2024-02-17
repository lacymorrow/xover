import { SidebarNav } from '@/renderer/components/ui/SidebarNav';
import { settingsNavItems } from '@/renderer/config/nav';
import React from 'react';
import { Outlet } from 'react-router-dom';

interface SettingsLayoutProps {
	children?: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
	return (
		<>
			<div className="space-y-6 p-10 py-8">
				<div className="flex flex-col space-y-8 md:flex-row md:space-x-12 md:space-y-0">
					<aside className="-mx-4 md:w-1/5">
						<SidebarNav items={[...settingsNavItems]} />
					</aside>
					<div className="flex-1 md:max-w-2xl">{children || <Outlet />}</div>
				</div>
			</div>
		</>
	);
}
