import { cn } from '@/lib/utils';
import { Layout } from '@/renderer/components/layout/Layout';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/crosshair.scss';
import { useEffect } from 'react';

export default function CrosshairApp() {
	const { settings } = useGlobalContext();

	useEffect(() => {
		document.documentElement.style.setProperty(
			'--app-bg-color',
			settings.backgroundColor,
		);
	}, [settings]);

	return (
		<Layout>
			<div className={cn(!settings.locked && 'drag')}>
				<pre>{JSON.stringify(settings, null, 2)}</pre>
			</div>
		</Layout>
	);
}
