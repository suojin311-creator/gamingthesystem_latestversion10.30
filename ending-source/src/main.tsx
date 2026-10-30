import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const cinematic = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('cinematic') : null;
const CinematicToolingDemo = import.meta.env.DEV ? React.lazy(() => import('./cinematics/CinematicToolingDemo')) : null;
const EndingDevPreview = import.meta.env.DEV ? React.lazy(() => import('./cinematics/ending/EndingDevPreview')) : null;
const Preview = cinematic === 'ending' ? EndingDevPreview : cinematic === 'demo' ? CinematicToolingDemo : null;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {Preview
      ? <React.Suspense fallback={<main className="game-shell"><p className="load-status">Preparing cinematic tools…</p></main>}><Preview /></React.Suspense>
      : <App />}
  </React.StrictMode>,
);
