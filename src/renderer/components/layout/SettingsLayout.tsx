import { IMAGE_EXTENSIONS } from '@/config/config';
import { cn } from '@/lib/utils';
import { SidebarNav } from '@/renderer/components/ui/SidebarNav';
import { settingsNavItems } from '@/renderer/config/nav';
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Outlet } from 'react-router-dom';
import DropIndicator from '../app/DropIndicator';

interface SettingsLayoutProps {
	children?: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
	const onDrop = useCallback((acceptedFiles: any[], rejectedFiles: any[]) => {
		if (rejectedFiles.length) {
			console.warn('Rejected files:', rejectedFiles);
			return window.electron.notify({
				title: `Invalid file (${rejectedFiles[0].errors[0].code})`,
				body: `${rejectedFiles[0].errors[0].message} - ${rejectedFiles[0].file.name}`,
			});
		}
		if (acceptedFiles.length) {
			window.electron.openFile(acceptedFiles[0].path);
		}
	}, []);

	const { getRootProps, isDragActive } = useDropzone({
		onDrop,
		noClick: true,
		noKeyboard: true,
		accept: {
			'image/png': IMAGE_EXTENSIONS,
		},
	});

	return (
		<>
			<div className={cn('space-y-6 p-10 py-8')} {...getRootProps()}>
				<div className="flex flex-col space-y-8 md:flex-row md:space-x-12 md:space-y-0">
					<aside className="-mx-4 md:w-1/5">
						<SidebarNav items={[...settingsNavItems]} />
					</aside>
					<div className="flex-1 md:max-w-2xl">{children || <Outlet />}</div>
				</div>
			</div>
			<DropIndicator isDragActive={isDragActive} />
		</>
	);
}
