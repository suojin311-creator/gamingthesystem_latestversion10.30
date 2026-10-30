import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const showCinematicDemo = new URLSearchParams(window.location.search).get('cinematic') === 'demo';
const CinematicToolingDemo = React.lazy(() => import('./cinematics/CinematicToolingDemo'));
const Level1DevPreview = import.meta.env.DEV
  ? React.lazy(() => import('./cinematics/level1/Level1DevPreview'))
  : null;
const showLevel1Preview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('cinematic') === 'level1';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {showLevel1Preview && Level1DevPreview
      ? <React.Suspense fallback={<main className="game-shell"><p className="load-status">Preparing Level 1 preview…</p></main>}><Level1DevPreview /></React.Suspense>
      : showCinematicDemo
      ? <React.Suspense fallback={<main className="game-shell"><p className="load-status">Preparing cinematic tools…</p></main>}><CinematicToolingDemo /></React.Suspense>
      : <App />}
  </React.StrictMode>,
);
