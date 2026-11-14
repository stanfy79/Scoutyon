import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from './providers/PrivyProvider';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './features/auth/guards/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';
import { ResearchHistory } from './pages/ResearchHistory';
import { BudgetsPage } from './pages/Budgets';
import { TransactionsPage } from './pages/Transactions';
import { SettingsPage } from './pages/Settings';
import { NotFound } from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public authentication route */}
              <Route path="/" element={<AuthPage />} />

              {/* Protected routes within persistent shell */}
              <Route
                element={
                  <AuthGuard>
                    <AppLayout />
                  </AuthGuard>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/workspace" element={<Workspace />} />
                <Route path="/history" element={<ResearchHistory />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

export default App;
