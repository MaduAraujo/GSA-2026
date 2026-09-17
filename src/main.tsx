import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const publicPortfolioMatch = window.location.pathname.match(/^\/p\/([^/]+)\/?$/);
const isAboutPage = /^\/sobre\/?$/.test(window.location.pathname);

if (publicPortfolioMatch) {
  import('./components/PublicPortfolioPage').catch(() => {});
} else if (isAboutPage) {
  import('./components/AboutPage').catch(() => {});
} else {
  import('./App.tsx').catch(() => {});
}

const App = lazy(() => import('./App.tsx'));
const PublicPortfolioPage = lazy(() => import('./components/PublicPortfolioPage').then((m) => ({ default: m.PublicPortfolioPage })));
const AboutPage = lazy(() => import('./components/AboutPage').then((m) => ({ default: m.AboutPage })));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-sm text-gray-600">Carregando...</div>
    </div>
  );
}

function Root() {
  if (publicPortfolioMatch) {
    return <PublicPortfolioPage slug={decodeURIComponent(publicPortfolioMatch[1])} />;
  }
  if (isAboutPage) {
    return <AboutPage />;
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Root />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}