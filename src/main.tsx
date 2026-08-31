import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PublicPortfolioPage } from './components/PublicPortfolioPage';
import { AboutPage } from './components/AboutPage';
import './index.css';

const publicPortfolioMatch = window.location.pathname.match(/^\/p\/([^/]+)\/?$/);
const isAboutPage = /^\/sobre\/?$/.test(window.location.pathname);

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
      <Root />
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