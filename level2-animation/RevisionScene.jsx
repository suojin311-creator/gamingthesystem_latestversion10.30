import React from 'react';
import { professorLabel } from '../../src/shared/data/professorLabel.js';
import { METRIC_CATALOG } from '../../src/shared/data/metrics';
import { THREE_OUTCOMES } from '../../src/levels/level2/data';
import { ChecklistSystem } from '@partner/cinematics/level2/ChecklistSystem';
import { Level2ConsequencesSequence } from '@partner/cinematics/level2/Level2ConsequencesSequence';
import group from '@partner-scenes/REF-L2-003 — Mixed : Broad Classroom.png?inline';
import visible from '@partner-scenes/    REF-L2-001 — Visible-heavy Classroom.png';
import quality from '@partner-scenes/    REF-L2-002 — Quality-heavy Classroom.png';
import listeningC from '../../revision-assets/level2/L2-01-classmate-c-listening.png';
import listeningD from '../../revision-assets/level2/L2-02-classmate-d-listening.png';
import impressed from '../../revision-assets/level2/L2-03-classmate-impressed.png';
import alex from '../../revision-assets/level2/L2-04-alex-presenting-checklist.png';
import beige from '../../revision-assets/level2/L2-05-classmate-exhausted.png';
import green from '../../revision-assets/level2/L2-06-classmate-overwhelmed.png';
import stacks from '../../revision-assets/level2/L2-07-homework-stacks.png';
import exhaustedC from '../../revision-assets/level2/L2-08-classmate-c-exhausted.png';
import { ThreeMetricsScene, professorWide } from './ThreeMetricsScene.jsx';
import './revision.css';

export const revisionAssets = [group, visible, quality, listeningC, listeningD, impressed, alex, beige, green, stacks, exhaustedC];
export const revisionSixAssets = [group, alex, impressed, professorWide];
export const revisionThreeAssets = [quality, professorWide];
const outcomes = { visible, quality, mixed: group };
const IGNORE = () => {};

function Emphasis({ text, phrase }) {
  if (!phrase || !text.includes(phrase)) return text;
  const index = text.indexOf(phrase);
  return <>{text.slice(0, index)}<strong>{phrase}</strong>{text.slice(index + phrase.length)}</>;
}

export function RevisionScene({ shot, time, request, originalRequest, playing, reducedMotion, sixMetricLabels }) {
  if (request.kind === 'three') return <ThreeMetricsScene shot={shot} time={time} request={request} reducedMotion={reducedMotion} />;
  const labels = request.selectedMetricIds.map(id => METRIC_CATALOG.find(metric => metric.id === id).name);
  if (shot.view === 'evidence') return <section className="l2-revision-scene" data-revision-shot={shot.id}><Level2ConsequencesSequence request={originalRequest} elapsed={.25 + Math.min(5.649, time)} active={playing} reducedMotion={reducedMotion} onComplete={IGNORE} /></section>;
  const specific = { 'listening-c': listeningC, 'listening-d': listeningD, impressed, beige, green, 'exhausted-c': exhaustedC, overload: green };
  const six = request.kind === 'six';
  const wide = six && shot.view === 'professor-wide';
  // Six is the fixed shared catalogue, independent of the initially chosen trio.
  // Optional render-layer labels allow a verified integration mapping, never sample defaults.
  const checklistLabels = sixMetricLabels ?? METRIC_CATALOG.map(metric => metric.name);
  if (six && (checklistLabels.length !== 6 || checklistLabels.some(label => typeof label !== 'string' || !label.trim()))) throw new Error('REV-06 requires six nonempty metric labels.');
  // Existing portraits identify D as the female classmate and C as the boy
  // with glasses. Keep legacy shot IDs/timing; match labels to the group speakers.
  const groupSpeaker = six && shot.id === 'c-asks' ? 'Classmate D' : six && shot.id === 'd-asks' ? 'Classmate C' : shot.speaker;
  const speaker = shot.speaker === 'You' ? professorLabel(request.playerName) : groupSpeaker;
  const src = wide ? professorWide : shot.view === 'six-group' ? group : specific[shot.view] ?? (['alex', 'gather', 'six-paper'].includes(shot.view) ? (request.kind === 'three' ? quality : alex) : shot.view === 'outcome' ? outcomes[request.branch] : quality);
  const zoom = six || reducedMotion ? 1 : 1 + Math.min(1, time / (shot.end - shot.start)) * .018;
  const calmCloseup = shot.view === 'alex' && request.kind === 'checklist';
  return <section className={'l2-revision-scene view-' + shot.view + (shot.view === 'alex' && request.kind === 'three' ? ' view-alex-three' : '') + (calmCloseup ? ' view-calm-closeup' : '') + (six ? ' l2-six-scene' : '')} data-revision-shot={shot.id} data-branch={request.branch}>
    <div className="l2-revision-camera" style={{ transform: `scale(${zoom})` }}>
      {six && shot.view === 'six-paper' ? <svg className="l2-six-alex-crop" viewBox="90 0 710 1024" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Alex proudly shows his learning requirements"><image href={alex} width="1536" height="1024" /></svg> : calmCloseup ? <svg className="l2-revision-crop" viewBox="100 0 780 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Alex remains composed, smiling confidently"><image href={alex} width="1536" height="1024" /></svg> : <img className="l2-revision-plate" src={src} alt={shot.view === 'impressed' ? 'Classmate C recognizes Alex’s strategy.' : shot.view === 'alex' ? 'Alex confidently shares his checklist with classmates C and D.' : 'The established classroom and its students.'} />}
    </div>
    {shot.view === 'overload' && <img className="l2-workload-prop" src={stacks} alt="Piles of homework, notebooks and blank checklists" />}
    {shot.id === 'alex-continues' && <aside className="l2-selected-paper"><span>On the score sheet</span>{labels.map(label => <p key={label}>✓ {label}</p>)}</aside>}
    {shot.view === 'outcome' && <aside className="l2-outcome-note" data-outcome={request.branch}><strong>{THREE_OUTCOMES[request.branch].report}</strong><p>{THREE_OUTCOMES[request.branch].evidence}</p><small>{labels.join(' · ')}</small></aside>}
    {shot.view === 'six-paper' && <div className="l2-six-live-paper" data-progress-source="alex-scripted-demonstration"><ChecklistSystem count={6} mode="complete" labels={checklistLabels} progress={Math.min(1, time / 4.6)} reducedMotion={reducedMotion} /><small className="l2-six-demo-note">Alex’s checklist demonstration</small></div>}
    {shot.text && <div role="status" className={'l2-comic-bubble speaker-' + (shot.speaker === 'Alex' ? 'alex' : shot.speaker === 'You' ? 'professor' : 'classmate')} data-speaker={groupSpeaker}>
      <span className="l2-comic-speaker">{speaker}</span><p><Emphasis text={shot.text} phrase={shot.emphasis} /></p>
    </div>}
  </section>;
}
