import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { lazy, Suspense, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { AppShell } from './app/AppShell';
import { AuthProvider, useAuth } from './app/AuthProvider';
import { BadgeProvider } from './app/BadgeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useDarkMode } from './hooks/useDarkMode';
import { usePersistedState } from './hooks/usePersistedState';
import { usePwaInstall } from './hooks/usePwaInstall';
import { createQueryClient, persistOptions } from './lib/queryClient';
import { readLastTab, ROUTES, TAB_PATHS } from './routes';

const HomePage = lazy(() => import('./components/HomePage').then((m) => ({ default: m.HomePage })));
const AuthScreen = lazy(() => import('./components/AuthScreen').then((m) => ({ default: m.AuthScreen })));
const AboutPage = lazy(() => import('./components/AboutPage').then((m) => ({ default: m.AboutPage })));
const PublicPortfolioPage = lazy(() =>
  import('./components/PublicPortfolioPage').then((m) => ({ default: m.PublicPortfolioPage })),
);
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })))
  : () => null;

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="animate-pulse text-sm text-gray-600" role="status">
        Carregando...
      </div>
    </div>
  );
}

function PortfolioRoute() {
  const { slug = '' } = useParams();
  return <PublicPortfolioPage slug={slug} />;
}

function AuthGate({ signedIn, signedOut }: { signedIn: ReactNode; signedOut: ReactNode }) {
  const { session, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  return <>{session ? signedIn : signedOut}</>;
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const pwa = usePwaInstall();
  const [isPwaModalOpen, setIsPwaModalOpen] = usePersistedState('gsa_pwa_modal_open', false);

  const handleInstallPwa = async () => {
    const prompted = await pwa.install();
    if (!prompted) setIsPwaModalOpen(true);
  };

  const returnTo = (location.state as { from?: string } | null)?.from ?? TAB_PATHS[readLastTab()];
  const toDashboard = <Navigate to={returnTo} replace />;

  const authScreen = (mode: 'signIn' | 'signUp') => (
    <AuthScreen
      key={mode}
      initialMode={mode}
      onBack={() => navigate(ROUTES.home)}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
    />
  );

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path={ROUTES.about} element={<AboutPage />} />
        <Route path={ROUTES.portfolio} element={<PortfolioRoute />} />
        <Route
          path={ROUTES.home}
          element={
            <AuthGate
              signedIn={toDashboard}
              signedOut={
                <HomePage
                  onLogin={() => navigate(ROUTES.signIn)}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={toggleDarkMode}
                  deferredPrompt={pwa.deferredPrompt}
                  onInstallPwa={handleInstallPwa}
                  isPwaModalOpen={isPwaModalOpen}
                  onClosePwaModal={() => setIsPwaModalOpen(false)}
                />
              }
            />
          }
        />
        <Route path={ROUTES.signIn} element={<AuthGate signedIn={toDashboard} signedOut={authScreen('signIn')} />} />
        <Route path={ROUTES.signUp} element={<AuthGate signedIn={toDashboard} signedOut={authScreen('signUp')} />} />
        <Route
          path="*"
          element={
            <AuthGate
              signedIn={
                <BadgeProvider>
                  <AppShell isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
                </BadgeProvider>
              }
              signedOut={<Navigate to={ROUTES.signIn} replace state={{ from: location.pathname }} />}
            />
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
        <Suspense fallback={null}>
          <ReactQueryDevtools />
        </Suspense>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}
