import React from 'react';
import { ConsequenceScene } from '@ending/cinematics/level1/ConsequenceScene';
import { AlexCheckingSequence } from '@ending/cinematics/level2/AlexCheckingSequence';
import { MetricAdaptationScene } from '@level3a/cinematics/level3/MetricAdaptationScene';
import { METRICS, INTENSITIES } from '../../src/cinematics/level3/mapping.mjs';
import { METRIC_CATALOG } from '../../src/shared/data/metrics';
import { actualShotAt, RECAP, ease } from './timeline.mjs';

export function ActualTask({ input, time, reducedMotion }) {
  const shot = actualShotAt(input);
  // Animate one useful, already-seen action instead of holding its last frame.
  const [from,to] = shot.metricId === 'part' ? [2.8,3.99]
    : shot.metricId === 'focus' && shot.effort === 'low' ? [.85,1.7]
    : shot.metricId === 'discuss' ? [.85,3.99] : [1.75,3.99];
  const sourceTime = reducedMotion ? to : from + (to-from) * Math.min(1,time/1.8);
  return <div className="ending-actual-task" data-scene-id={shot.sceneId} data-source-time={sourceTime.toFixed(3)} data-round={input.lastRun.runs.at(-1).round}>
    <MetricAdaptationScene metric={METRICS[shot.metricId]} intensity={INTENSITIES[shot.effort]} time={sourceTime} reducedMotion={reducedMotion} hideDialogue />
  </div>;
}

export function LevelMemory({ level, time, input, reducedMotion }) {
  if (level === 1) return <ConsequenceScene metric={METRICS[input.levelOneMetricId]} seconds={reducedMotion ? 3.2 : .65 + time * 1.25} reducedMotion={reducedMotion} />;
  // Complete the final tick on the existing six-item notebook, without portraits.
  if (level === 2) return <AlexCheckingSequence elapsed={1.6 + ease(time,.1,1.1)*.6} count={6} labels={METRIC_CATALOG.map(m => m.name)} progress={reducedMotion ? 1 : (5.65 + .35*ease(time,.1,1.1))/6} insertOnly reducedMotion={reducedMotion} />;
  return <ActualTask input={input} time={time} reducedMotion={reducedMotion} />;
}

export function SoloMemory({ level, time, input, reducedMotion }) {
  return <div className="end-memory-space">
    <div className="end-solo-memory"><LevelMemory {...{ level, time, input, reducedMotion }} /></div>
    <div className="end-memory-caption"><span>LEVEL {level}</span><p>{RECAP[level - 1]}</p></div>
  </div>;
}
