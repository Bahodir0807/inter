import { PropsWithChildren, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { Toaster } from '../../shared/ui/feedback/toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function SessionBootstrap({ children }: PropsWithChildren) {
  const bootstrap = useAuthStore(state => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionBootstrap>{children}</SessionBootstrap>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
