import { DocsPage } from '@/components/layout/DocsPage';
import { TooltipProvider } from '@/components/ui/Tooltip';

export function App(): JSX.Element {
  return (
    <TooltipProvider delay={{ open: 250, close: 100 }}>
      <DocsPage />
    </TooltipProvider>
  );
}

export default App;
