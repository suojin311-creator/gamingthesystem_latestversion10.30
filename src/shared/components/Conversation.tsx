import { teacherSpeech } from '../utils/teacherSpeech';
import { useEffect, useRef, useState } from 'react';
import type { Cue } from '../hooks/useFeedback';
import { readingTime } from '../utils/readingTime';
import CharacterPortrait from './CharacterPortrait';
import '../styles/conversation.css';

export type ConversationLine = { speaker: 'Maya' | 'Alex'; name: string; text: string };

export default function Conversation({ lines, enabled = true, paused = false, play, onSettled, onLastMessage, typingDelay = 650, readDelay = readingTime }: {
  lines: ConversationLine[]; enabled?: boolean; paused?: boolean;
  play: (cue: Cue) => void; onSettled: () => void;
  onLastMessage?: () => void; typingDelay?: number; readDelay?: (text: string) => number;
}) {
  const [beat, setBeat] = useState(0);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const container = useRef<HTMLElement>(null);
  const remaining = useRef(typingDelay);
  const lastSound = useRef(-1);
  const settled = useRef(false);
  const lastMessageReported = useRef(false);
  const callback = useRef(onSettled);
  callback.current = onSettled;
  const lastMessageCallback = useRef(onLastMessage);
  lastMessageCallback.current = onLastMessage;
  const lastBeat = lines.length * 2 - 1;

  useEffect(() => {
    const observer = new IntersectionObserver(entries => setInView(entries[0].isIntersecting), { threshold: 0.1 });
    if (container.current) observer.observe(container.current);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    if (!enabled || paused || !inView || !pageVisible || !lines.length) return;
    if (beat % 2 === 1 && lastSound.current !== beat) { play('message'); lastSound.current = beat; }
    if (beat === lastBeat && !lastMessageReported.current) {
      lastMessageReported.current = true;
      lastMessageCallback.current?.();
    }
    if (settled.current) return;
    const delay = remaining.current;
    const start = performance.now();
    let fired = false;
    const timer = window.setTimeout(() => {
      fired = true;
      if (beat === lastBeat) { settled.current = true; callback.current(); return; }
      remaining.current = beat % 2 === 0 ? readDelay(lines[Math.floor(beat / 2)].text) : typingDelay;
      setBeat(value => value + 1);
    }, delay);
    return () => { window.clearTimeout(timer); if (!fired) remaining.current = Math.max(0, delay - (performance.now() - start)); };
  }, [beat, enabled, paused, inView, pageVisible, lastBeat, play, lines, typingDelay, readDelay]);

  useEffect(() => {
    if (!enabled || paused || !inView || !pageVisible || beat % 2 === 0) return;
    // Keep a newly arrived reply visible when a conversation grows on a small screen.
    const frame = requestAnimationFrame(() => {
      const message = container.current?.querySelector<HTMLElement>(`[data-order="${Math.floor(beat / 2)}"]`);
      const rect = message?.getBoundingClientRect();
      if (rect && rect.bottom > innerHeight - 18) message?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [beat, enabled, paused, inView, pageVisible]);

  return <section ref={container} className={`dialogue-strip conversation ${lines.length > 1 ? 'two-voices' : ''}`} aria-label="Character dialogue">
    {enabled && lines.map((line, index) => {
      if (beat < index * 2) return null;
      const typing = beat === index * 2;
      const alex = line.speaker === 'Alex';
      const continuation = index > 0 && lines[index - 1].speaker === line.speaker && lines[index - 1].name === line.name;
      return <div key={index} className={`dialogue-character ${alex ? 'alex-character' : 'maya-character'} ${continuation ? 'message-continuation' : ''}`} data-speaker={line.speaker} data-order={index}>
        <span className={`avatar ${alex ? 'alex-avatar' : 'maya-avatar'}`} aria-hidden="true"><CharacterPortrait role={alex ? 'student' : 'teacher'} /></span>
        <div className={`speech-bubble ${alex ? 'alex-bubble' : 'maya-bubble'} ${typing ? 'is-typing' : 'message-arrived'}`}>
          <span className={`speaker-name ${continuation ? 'sr-only' : ''}`}>{line.name}</span>
          {typing ? <span className="typing-indicator" role="status" aria-label={`${line.name} is typing`}><i /><i /><i /></span> : <p aria-live="polite">{alex ? line.text : teacherSpeech(line.text)}</p>}
        </div>
      </div>;
    })}
  </section>;
}
