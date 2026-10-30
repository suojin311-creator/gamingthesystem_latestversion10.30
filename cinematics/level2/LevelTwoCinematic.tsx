import { useEffect, useRef } from 'react';
import film from 'virtual:level2-cinematic-film';
import type { LevelTwoCinematicRequest } from '../../levels/level2/data';
import './styles.css';
import { cinematicRunId } from '../../shared/utils/cinematicRunId';

const CHANNEL = 'level2-cinematic';
export default function LevelTwoCinematic({ request, onComplete }: { request: LevelTwoCinematicRequest; onComplete: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const runId = useRef(cinematicRunId());
  const sent = useRef(false);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  useEffect(() => {
    frame.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    const receive = (event: MessageEvent) => {
      const data = event.data;
      if (event.source !== frame.current?.contentWindow || data?.channel !== CHANNEL) return;
      if (data.type === 'ready') frame.current.contentWindow?.postMessage({
        channel: CHANNEL, type: 'start', runId: runId.current, request,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      }, '*');
      if (data.type === 'complete' && data.runId === runId.current && !sent.current) {
        sent.current = true;
        callback.current();
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [request.sceneId, request.playerName]);
  return <section className="level2-cinematic" aria-label="Level 2 classroom animation" data-scene-id={request.sceneId}>
    <iframe ref={frame} title="Level 2 classroom animation" srcDoc={film} allow="autoplay; fullscreen" allowFullScreen />
  </section>;
}
