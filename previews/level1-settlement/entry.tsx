import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../shared/styles/base.css';
import LevelOneExperience from '../../levels/level1/LevelOneExperience';
import './preview.css';

function Preview() {
  const name = new URLSearchParams(window.location.search).get('name')?.trim() || 'Maya';
  return <div className="l1-settlement-preview"><LevelOneExperience playerName={name} /></div>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>);
