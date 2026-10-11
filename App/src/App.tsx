import { RouterProvider } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { router } from '@/app/router';

export function App(): JSX.Element {
  return (
    <TooltipProvider delay={{ open: 250, close: 100 }}>
      <RouterProvider router={router} />
    </TooltipProvider>
  );
}

export default App;
