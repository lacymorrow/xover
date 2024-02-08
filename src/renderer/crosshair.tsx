import { Layout } from '@/renderer/components/layout/Layout';
import App from '@/renderer/windows/crosshair/CrosshairApp';
import { createRoot } from 'react-dom/client';
import { ActionStateContextProvider } from './context/action-state-context';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
	<Layout>
		<ActionStateContextProvider>
			<App />
		</ActionStateContextProvider>
	</Layout>,
);
