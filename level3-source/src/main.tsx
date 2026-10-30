import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const showCinematicDemo = new URLSearchParams(window.location.search).get('cinematic') === 'demo';
const CinematicToolingDemo = React.lazy(() => import('./cinematics/CinematicToolingDemo'));

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {showCinematicDemo
      ? <React.Suspense fallback={<main className="game-shell"><p className="load-status">Preparing cinematic tools…</p></main>}><CinematicToolingDemo /></React.Suspense>
      : <App />}
  </React.StrictMode>,
);
