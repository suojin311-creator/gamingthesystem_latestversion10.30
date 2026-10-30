import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from '@remotion/player';
import { useCurrentFrame } from 'remotion';
import { LevelOneFilm, filmImages } from '@preview-presentation';
import { branches, isMetricId } from '@partner/cinematics/level1/level1Content';
import { createPacing } from '@preview-pacing';
import { TRANSITION_DURATION } from '@preview-rev04';

const CHANNEL = 'level1-settlement-review';
function PacedComposition({ selectedMetric, playerName, reducedMotion, finished, transitionOnly }) {
  const frame = useCurrentFrame();
  const pacing = useMemo(() => createPacing(branches[selectedMetric]), [selectedMetric]);
  const elapsed = frame / 30 + (transitionOnly ? pacing.transitionStart : 0);
  const seconds = Math.max(0, pacing.sourceSeconds(elapsed));
  return <LevelOneFilm selectedMetric={selectedMetric} playerName={playerName} reducedMotion={reducedMotion} seconds={seconds} elapsed={elapsed} pacing={pacing} finished={finished} transitionOnly={transitionOnly} />;
}
function Film({ config }) {
  const player = useRef(null);
  const complete = useRef(false);
  const [finished, setFinished] = useState(false);
  const pacing = useMemo(() => createPacing(branches[config.metric]), [config.metric]);
  const duration = config.transitionOnly ? TRANSITION_DURATION : pacing.duration;
  useEffect(() => {
    const instance = player.current;
    let resumeOnReturn = document.hidden;
    const end = () => {
      if (complete.current) return;
      complete.current = true;
      setFinished(true);
    };
    const audioState=()=>window.parent.postMessage({channel:'gts-audio',playing:instance?.isPlaying()??false},'*');
    instance?.addEventListener('play',audioState);instance?.addEventListener('pause',audioState);
    instance?.addEventListener('ended', end);
    audioState();
    const visibility = () => {
      if (document.hidden) {
        resumeOnReturn ||= instance?.isPlaying() ?? false;
        instance?.pause();
      } else if (resumeOnReturn && !complete.current) {
        resumeOnReturn = false;
        instance?.play();
      }
    };
    document.addEventListener('visibilitychange', visibility);
    if (document.hidden) visibility();
    return () => { instance?.removeEventListener('ended', end);instance?.removeEventListener('play',audioState);instance?.removeEventListener('pause',audioState); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!finished) return;
    let second = 0;
    // Commit an opaque frame before replacing the movie with the matching cover.
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => {
      window.parent.postMessage({ channel: CHANNEL, type: 'complete', runId: config.runId }, '*');
    }); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [finished, config.runId]);
  return <main className="settlement-film" data-duration={duration.toFixed(2)}>
    <Player ref={player} component={PacedComposition} inputProps={{ selectedMetric: config.metric, playerName: config.playerName, reducedMotion: config.reducedMotion, finished: config.review === true ? false : finished, transitionOnly: config.transitionOnly === true }}
      compositionWidth={1280} compositionHeight={720} durationInFrames={Math.ceil(duration * 30)} fps={30}
      initialFrame={config.review === true && Number.isFinite(config.reviewStartAt) ? Math.min(Math.ceil(duration * 30) - 2, Math.max(0, Math.round(config.reviewStartAt * 30))) : 0}
      autoPlay={!(config.review === true && Number.isFinite(config.reviewStartAt))} controls={config.review === true} clickToPlay={false} spaceKeyToPlayOrPause={config.review === true} doubleClickToFullscreen={false} showVolumeControls={false} acknowledgeRemotionLicense moveToBeginningWhenEnded={false}
      style={{ width: '100%', aspectRatio: '16 / 9' }} />
  </main>;
}
function Entry() {
  const [config, setConfig] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const started = useRef(false);
  useEffect(() => {
    const receive = (event) => {
      const data = event.data;
      if (event.source !== window.parent || data?.channel !== CHANNEL || data.type !== 'start' || !isMetricId(data.metric) || typeof data.runId !== 'string' || started.current) return;
      started.current = true;
      // Decode the next shots before playback so cuts do not expose loading frames.
      Promise.all(filmImages(data.metric).map(src => {
        const image = new window.Image();
        image.src = src;
        return image.decode();
      })).then(() => setConfig(data), () => setLoadError(true));
    };
    window.addEventListener('message', receive);
    window.parent.postMessage({ channel: CHANNEL, type: 'ready' }, '*');
    return () => window.removeEventListener('message', receive);
  }, []);
  return config ? <Film config={config} /> : <p className="settlement-loading" role="status">{loadError ? 'The classroom could not load. Please reopen the game.' : 'Preparing the classroom…'}</p>;
}
const style = document.createElement('style');
style.textContent = `html,body,#root{margin:0;width:100%;height:100%;background:#111710}body{overflow:hidden}.settlement-film{display:grid;place-items:center;width:100%;height:100%;position:relative}.settlement-loading{position:absolute;top:45%;width:100%;text-align:center;color:#eee1c9;font:16px Georgia,serif}`;
document.head.append(style);
createRoot(document.getElementById('root')).render(<Entry />);
