import { Layout } from '@/renderer/components/layout/Layout';
import { createRoot } from 'react-dom/client';
import ChooserApp from '@/renderer/windows/chooser/ChooserApp';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <Layout>
    <ChooserApp />
  </Layout>,
);


