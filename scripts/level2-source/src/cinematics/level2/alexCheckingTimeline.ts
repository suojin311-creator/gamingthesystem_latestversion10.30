import { checklistPresentation } from './checklistPresentation';

export const CHECKING_DURATION = 4.2;
export const CHECKING_CUES = { insert: 1.05, contact: 1.45, mark: 1.6, finish: 2.05, lift: 2.2, reaction: 2.75 } as const;
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Editing cues only; the checklist remains the sole source of checkmark state. */
export function alexCheckingFrame(elapsed: number) {
  const t = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const c = CHECKING_CUES;
  const stroke = clamp((t - c.mark) / (c.finish - c.mark));
  // Two existing checks; the final batch waits at its mark threshold until contact.
  const progress = (2 + 0.65 + 0.15 * stroke) / 3;
  const checklist = checklistPresentation(3, t >= c.finish ? 1 : progress);
  return {
    shot: t < c.insert ? 'look' : t < c.reaction ? 'insert' : 'reaction',
    progress: t >= c.finish ? 1 : progress,
    mark: checklist.markProgress,
    approach: 1 - clamp((t - c.insert) / (c.contact - c.insert)),
    lift: clamp((t - c.lift) / (c.reaction - c.lift)),
    push: clamp(t / CHECKING_DURATION),
  } as const;
}
