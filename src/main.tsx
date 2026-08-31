import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PublicPortfolioPage } from './components/PublicPortfolioPage';
import './index.css';

const publicPortfolioMatch = window.location.pathname.match(/^\/p\/([^/]+)\/?$/);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {publicPortfolioMatch ? <PublicPortfolioPage slug={decodeURIComponent(publicPortfolioMatch[1])} /> : <App />}
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