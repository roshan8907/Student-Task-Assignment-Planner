import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';

// Register Service Worker in production or explicit dev environments
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[ServiceWorker] Registered successfully with scope:', registration.scope);
    } catch (error) {
      console.warn('[ServiceWorker] Registration failed or disabled in current origin:', error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
