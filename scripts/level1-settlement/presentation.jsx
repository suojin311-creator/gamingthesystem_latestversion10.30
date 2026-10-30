import React from 'react';
import { finalCoverOpacity } from '@preview-transitions';
import { AbsoluteFill } from 'remotion';
import { ConsequenceScene } from '@partner/cinematics/level1/ConsequenceScene';
import { DialogueLayer } from '@partner/cinematics/shared/engine/DialogueLayer/DialogueLayer';
import { branches, LEVEL1 } from '@partner/cinematics/level1/level1Content';
import { SPEAKER_COLORS, CAPTION_SHADOW, professorLabel } from './content.mjs';
import { SharedTransition, transitionImages } from './rev04.jsx';
import '@partner/styles.css';
import '@partner/cinematics/level1/level1.css';

export function filmImages(metric) {
  return [...new Set([branches[metric].plate, ...transitionImages])];
}

// The partner's artwork, prop animation and script stay shared. This adapter owns
// player-facing shot assembly: one opaque scene at a time, with fixed framing.
function SpokenLine({ text, player = false, playerName }) {
  const color = SPEAKER_COLORS[player ? 'player' : 'alex'];
  return <div className="l1-spoken" data-speaker={player ? 'player' : 'alex'}>
    <p className="l1-speaker" style={{ color, textShadow: CAPTION_SHADOW, ...(player ? { textTransform: 'none', overflowWrap: 'anywhere' } : {}) }}>{player ? professorLabel(playerName) : 'Alex'}</p>
    <DialogueLayer style={{ bottom: '7%', left: '10%', right: '10%', fontSize: '2.15cqw', lineHeight: 1.5, fontStyle: player ? 'italic' : 'normal', color, WebkitTextStroke: '.035em #172019', paintOrder: 'stroke fill', textShadow: CAPTION_SHADOW }}>{text}</DialogueLayer>
  </div>;
}

export function LevelOneFilm({ selectedMetric, playerName, seconds, reducedMotion, elapsed, pacing, finished, transitionOnly = false }) {
  const branch = branches[selectedMetric];
  const inTransition = transitionOnly || elapsed >= pacing.transitionStart;
  const text = seconds >= 2.2 && seconds < 5.3 ? branch.boast
    : seconds >= 5.5 && seconds < 8.2 ? branch.question
    : seconds >= 8.9 && seconds < 12.1 ? branch.reveal : null;
  return <AbsoluteFill className="l1-film" data-metric={selectedMetric} data-phase={inTransition ? 'transition' : 'branch'} data-source-seconds={seconds.toFixed(3)}>
    {inTransition ? <SharedTransition seconds={Math.max(0, elapsed - pacing.transitionStart)} playerName={playerName} reducedMotion={reducedMotion} /> : <>
      <ConsequenceScene metric={selectedMetric} seconds={Math.min(seconds, LEVEL1.branch)} reducedMotion={reducedMotion} />
      {text && <SpokenLine text={text} player={seconds >= 5.5 && seconds < 8.2} playerName={playerName} />}
    </>}
    {inTransition && !transitionOnly && !reducedMotion && elapsed - pacing.transitionStart < .4 &&
      <AbsoluteFill aria-hidden="true" style={{ opacity: 1 - Math.max(0, elapsed - pacing.transitionStart) / .4, pointerEvents: 'none' }}>
        <ConsequenceScene metric={selectedMetric} seconds={LEVEL1.branch} reducedMotion />
      </AbsoluteFill>}
    <div className="l1-scene-cover" aria-hidden="true" style={{ position: 'absolute', inset: 0, background: '#111710', opacity: finished ? 1 : finalCoverOpacity(pacing, elapsed, reducedMotion), pointerEvents: 'none' }} />
  </AbsoluteFill>;
}
