import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initMonitoring } from './lib/monitoring';
import './index.css';

void initMonitoring();

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado em index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}
