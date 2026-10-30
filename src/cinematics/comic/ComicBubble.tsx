import type { ReactNode } from 'react';
import { professorLabel } from '../../shared/data/professorLabel.js';
import './comic-bubble.css';

type ComicBubbleProps = {
  speakerName: string;
  speaker: 'alex' | 'professor';
  children: ReactNode;
};

/** Presentation only: the host owns dialogue order, timing and player identity. */
export default function ComicBubble({ speakerName, speaker, children }: ComicBubbleProps) {
  const label = speaker === 'professor' ? professorLabel(speakerName) : speakerName;
  return <article className={`comic-bubble comic-bubble--${speaker}`} aria-label={`${label} says`}>
    <header className="comic-bubble__identity">
      <span className="comic-bubble__name">{label}</span>
    </header>
    <p className="comic-bubble__text">{children}</p>
    <svg className="comic-bubble__tail" viewBox="0 0 80 70" aria-hidden="true">
      <path d={speaker === 'professor' ? 'M 4 1 Q 17 35 4 65 Q 49 41 70 1' : 'M 4 1 Q 22 22 60 65 Q 52 28 70 1'} />
    </svg>
  </article>;
}
