import { PropsWithChildren, useEffect } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/model/auth-store';
import { Toaster } from '../../shared/ui/feedback/toaster';
import { ErrorBoundary } from '../../shared/ui/feedback/error-boundary';
import { captureFrontendError, initObservability } from '../../shared/lib/observability';
import { I18nProvider } from '../../shared/i18n/i18n';
import { LanguagePreferenceGate } from '../../shared/i18n/language-preference';
import { ThemeProvider } from '../../shared/theme/theme';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      captureFrontendError(error, {
        source: 'react-query',
        queryHash: query.queryHash,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      captureFrontendError(error, {
        source: 'react-query-mutation',
        mutationKey: mutation.options.mutationKey,
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      gcTime: 10 * 60_000,
    },
    mutations: {
      retry: false,
    },
  },
});

function SessionBootstrap({ children }: PropsWithChildren) {
  const bootstrap = useAuthStore(state => state.bootstrap);

  useEffect(() => {
    initObservability();
    void bootstrap();

    const handleAuthExpired = () => {
      queryClient.clear();
      void bootstrap();
    };

    window.addEventListener('ibrat:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('ibrat:auth-expired', handleAuthExpired);
  }, [bootstrap]);

  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <SessionBootstrap>{children}</SessionBootstrap>
            </ErrorBoundary>
            <LanguagePreferenceGate />
            <Toaster />
          </BrowserRouter>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
