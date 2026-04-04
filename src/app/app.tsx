import { AppProviders } from './providers/app-providers';
import { AppRouter } from './router/app-router';

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
