import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DocsSkeleton } from '@/components/layout/DocsSkeleton';

const LazyDocsPage = lazy(() => import('@/pages/DocsPage'));

export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      children: [
        {
          path: '/',
          element: <HomePage />,
        },
        {
          path: '/docs',
          element: (
            <Suspense fallback={<DocsSkeleton />}>
              <LazyDocsPage />
            </Suspense>
          ),
        },
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);
