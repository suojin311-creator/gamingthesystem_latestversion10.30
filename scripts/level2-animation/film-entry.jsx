import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getLevel2Shots } from '@partner/cinematics/level2/level2Timeline';
import neutral from '@partner-assets/characters/alex-rig/production/base/ALEX-PROD-001 — Seated Alex Neutral.png';
import blink from '@partner-assets/characters/alex-rig/production/expressions/ALEX-PROD-002 — Blink.png';
import pleased from '@partner-assets/characters/alex-rig/production/expressions/ALEX-PROD-003 — Pleased.png';
import uncertain from '@partner-assets/characters/alex-rig/production/expressions/ALEX-PROD-004 — Uncertain.png';
import hand from '@partner-assets/characters/alex-rig/production/actions/checking/ALEX-HAND-CHECKING.png';
import look from '@partner-assets/characters/alex-rig/production/actions/checking/ALEX-PROD-005-CLEAN.png';
import classroom from '@partner-scenes/REF-L2-003 — Mixed : Broad Classroom.png?inline';
import { RevisionScene, revisionAssets, revisionThreeAssets, revisionSixAssets } from './RevisionScene.jsx';
import { revisionTimeline, revisionAt } from './revision-timeline.mjs';
import './film.css';

const CHANNEL = 'level2-cinematic';
const METRICS = {
  prep: 'pre-class-preparation', part: 'in-class-participation', focus: 'on-task-focus',
  discuss: 'in-class-discussion-quality', reflect: 'learning-reflection-quality', peer: 'online-peer-response-quality',
};
const CATEGORIES = { visible: 'visible-behaviour-heavy', quality: 'quality-depth-heavy', mixed: 'mixed-broad' };
function makeRequest(config) {
  const input = config.request;
  return { requestId: config.runId, cinematicId: 'level2', level: 2, input: {
    phase: input.kind === 'checklist' ? '100' : input.kind,
    selectedMetrics: input.kind === 'three' ? input.selectedMetricIds.map(id => METRICS[id]) : Object.values(METRICS),
    ...(input.kind === 'three' ? { resultCategory: CATEGORIES[input.branch] } : {}),
  } };
}
function Film({ config }) {
  const request = useMemo(() => makeRequest(config), [config]);
  const original = useMemo(() => getLevel2Shots(request), [request]);
  const pacing = useMemo(() => revisionTimeline(config.request.kind, original.find(shot => shot.id === 'reflection')?.dialogue), [config, original]);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const clock = useRef(0);
  const speed = useRef(1);
  const completed = useRef(false);
  const finished = elapsed >= pacing.duration;
  useEffect(() => {
    if (config.preview) window.parent.postMessage({ channel: CHANNEL, type: 'progress', runId: config.runId, elapsed, duration: pacing.duration, playing: playing && !finished }, '*');
  }, [playing, finished, config, pacing, playing ? null : elapsed]);
  useEffect(() => {
    window.parent.postMessage({ channel: 'gts-audio', playing: playing && !finished, time: elapsed }, '*');
  }, [playing, finished, Math.floor(elapsed * 4)]);
  useEffect(() => {
    if (!config.preview) return;
    const control = event => {
      const data = event.data;
      if (event.source !== window.parent || data?.channel !== CHANNEL || data.runId !== config.runId || data.type !== 'control') return;
      if (data.action === 'play' && !completed.current) setPlaying(true);
      if (data.action === 'pause') setPlaying(false);
      if (data.action === 'speed' && [1, 2, 4].includes(data.value)) speed.current = data.value;
      if (data.action === 'seek' && Number.isFinite(data.value) && !completed.current) {
        clock.current = Math.max(0, Math.min(pacing.duration - .001, data.value));
        setElapsed(clock.current); setPlaying(false);
      }
    };
    window.addEventListener('message', control);
    return () => window.removeEventListener('message', control);
  }, [config, pacing]);
  useEffect(() => {
    if (!playing || finished) return;
    let frame, previous = performance.now(), lastProgress = -1;
    const resetClock = () => { previous = performance.now(); };
    document.addEventListener('visibilitychange', resetClock);
    const tick = now => {
      if (!document.hidden) {
        clock.current = Math.min(pacing.duration, clock.current + Math.min(100, Math.max(0, now - previous)) / 1000 * speed.current);
        setElapsed(clock.current);
      }
      previous = now;
      if (config.preview && now - lastProgress >= 150) {
        window.parent.postMessage({ channel: CHANNEL, type: 'progress', runId: config.runId, elapsed: clock.current, duration: pacing.duration, playing: true }, '*');
        lastProgress = now;
      }
      if (clock.current < pacing.duration) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', resetClock); };
  }, [playing, finished, config, pacing]);
  useEffect(() => {
    if (!finished || completed.current) return;
    const frame = requestAnimationFrame(() => {
      if (completed.current) return;
      completed.current = true;
      window.parent.postMessage({ channel: CHANNEL, type: 'complete', runId: config.runId }, '*');
    });
    return () => cancelAnimationFrame(frame);
  }, [finished, config.runId]);
  const sample = revisionAt(pacing, elapsed);
  const index = pacing.shots.indexOf(sample.shot);
  const outgoing = pacing.shots[index - 1];
  // REV-05 holds one group plate, then hard-cuts to the Professor POV.
  // Never composite outgoing faces or stale dialogue over that story.
  const blend = ['three', 'six'].includes(config.request.kind) || config.reducedMotion ? 1 : Math.min(1, sample.time / .35);
  return <main className="l2-film" data-kind={config.request.kind} data-scene-id={config.request.sceneId} data-shot={sample.shot.id} data-elapsed={elapsed.toFixed(3)} data-duration={pacing.duration.toFixed(3)} data-finished={finished} data-player-name={config.request.playerName}>
    <RevisionScene shot={sample.shot} time={sample.time} request={config.request} originalRequest={request} playing={playing && !finished} reducedMotion={config.reducedMotion} />
    {outgoing && blend < 1 && <div className="l2-revision-outgoing" aria-hidden="true" style={{ position:'absolute', inset:0, opacity:1-blend, pointerEvents:'none' }}><RevisionScene shot={outgoing} time={outgoing.end-outgoing.start} request={config.request} originalRequest={request} playing={false} reducedMotion={config.reducedMotion} /></div>}
  </main>;
}

function Entry() {
  const [config, setConfig] = useState(null);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  useEffect(() => {
    const receive = event => {
      const data = event.data;
      const request = data?.request;
      if (event.source !== window.parent || data?.channel !== CHANNEL || data.type !== 'start' || started.current || typeof data.runId !== 'string') return;
      if (!request || !['three', 'six', 'checklist'].includes(request.kind) || !CATEGORIES[request.branch] || request.selectedMetricIds?.length !== 3 || new Set(request.selectedMetricIds).size !== 3 || request.selectedMetricIds.some(id => !METRICS[id]) || (typeof request.playerName !== 'string' && !(request.kind === 'six' && request.playerName == null))) return;
      started.current = true;
      const plates = request.kind === 'three' ? revisionThreeAssets : request.kind === 'six' ? revisionSixAssets : [...revisionAssets, ...(request.kind === 'checklist' ? [neutral, blink, pleased, uncertain, hand, look, classroom] : [])];
      Promise.all(plates.map(src => { const image = new Image(); image.src = src; return image.decode(); }))
        .then(() => setConfig(data), () => setFailed(true));
    };
    window.addEventListener('message', receive);
    window.parent.postMessage({ channel: CHANNEL, type: 'ready' }, '*');
    return () => window.removeEventListener('message', receive);
  }, []);
  return config ? <Film config={config} /> : <p className="l2-film-loading" role="status">{failed ? 'The classroom could not load. Please reopen the game.' : 'Preparing the classroom…'}</p>;
}
createRoot(document.getElementById('root')).render(<Entry />);
