import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppearanceProvider } from './context/AppearanceContext';
import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <AppearanceProvider>
        <App />
      </AppearanceProvider>
    </HelmetProvider>
  </StrictMode>
);
