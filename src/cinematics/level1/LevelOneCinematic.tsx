import { useEffect, useRef } from 'react';
import cinematicHtml from 'virtual:level1-settlement-film';
import type { CinematicRequest } from '../../levels/level1/components/CinematicPlaceholder';
import './styles.css';
import { cinematicRunId } from '../../shared/utils/cinematicRunId';

const METRIC_MAP = {
  prep: 'pre-class-preparation', part: 'in-class-participation', focus: 'on-task-focus',
  discuss: 'in-class-discussion-quality', reflect: 'learning-reflection-quality', peer: 'online-peer-response-quality',
} as const;
const CHANNEL = 'level1-settlement-review';

export default function Cinematic({ request, onComplete }: { request: CinematicRequest; onComplete: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const runId = useRef(cinematicRunId());
  const completed = useRef(false);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  useEffect(() => {
    frame.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.channel !== CHANNEL) return;
      if (event.data.type === 'ready') frame.current.contentWindow?.postMessage({
        channel: CHANNEL, type: 'start', runId: runId.current,
        metric: METRIC_MAP[request.metricId], playerName: request.playerName,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      }, '*');
      if (event.data.type === 'complete' && event.data.runId === runId.current && !completed.current) {
        completed.current = true;
        callback.current();
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [request.metricId, request.playerName]);
  return <section className="settlement-cinematic" aria-label="Level 1 classroom animation">
    <iframe ref={frame} title="Level 1 classroom animation" srcDoc={cinematicHtml} allow="autoplay; fullscreen" allowFullScreen />
  </section>;
}
