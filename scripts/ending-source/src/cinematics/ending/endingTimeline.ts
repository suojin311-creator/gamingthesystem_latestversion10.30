/** Presentation timing only. No scoring or progression rules. Seconds, at any fps. */
export const SHOTS = [
  { id: 'CIN4-S01', section: 'compare', start: 0, end: 7, title: 'Compare the patterns' },
  { id: 'CIN4-S02', section: 'deeper', start: 7, end: 17, title: 'A deeper question' },
  { id: 'CIN4-S03', section: 'flashback', start: 17, end: 20.2, title: 'Level 1 memory' },
  { id: 'CIN4-S04', section: 'checklist', start: 20.2, end: 23.8, title: 'Level 2 memory' },
  { id: 'CIN4-S05', section: 'weights', start: 23.8, end: 27.4, title: 'Level 3 memory' },
  { id: 'CIN4-S06', section: 'convergence', start: 27.4, end: 31, title: 'Three memories, one pattern' },
  { id: 'CIN4-S07', section: 'office', start: 31, end: 35, title: 'Return to the office' },
  { id: 'CIN4-S08', section: 'question', start: 35, end: 40.2, title: 'The central question' },
  { id: 'CIN4-S09', section: 'threshold', start: 40.2, end: 43, title: 'Theory threshold' },
  { id: 'CIN4-S10', section: 'goodhart', start: 43, end: 48.8, title: 'Goodhart’s Law' },
  { id: 'CIN4-S11', section: 'recap', start: 48.8, end: 55.2, title: 'Three-level theory recap' },
  { id: 'CIN4-S12', section: 'handoff', start: 55.2, end: 58.2, title: 'Go to Design Lab' },
] as const;
export const ENDING_FPS = 30;
export const ENDING_SECONDS = SHOTS[11].end;
export const ENDING_FRAMES = Math.round(ENDING_SECONDS * ENDING_FPS);
export const RECAP = [
  'One metric became the target.',
  'More metrics became a checklist.',
  'Weights told students what mattered most.',
] as const;
export const QUESTION = 'Are we improving learning, or just improving the numbers?';
export const QUOTE = 'When a measure becomes a target, it ceases to be a good measure.';
export const shotAt = (seconds: number) => SHOTS.find(shot => seconds < shot.end) ?? SHOTS[11];
export const sectionFrame = (section: string | null) => Math.round((SHOTS.find(shot => shot.section === section)?.start ?? 0) * ENDING_FPS);
export const ease = (time: number, start: number, duration: number) => {
  const p = Math.max(0, Math.min(1, (time - start) / duration));
  return p * p * (3 - 2 * p);
};

/** Exact Narrative V2 dialogue. Longer holds keep the original lines readable. */
export function dialogueAt(seconds: number) {
  if (seconds < 4.1) return { start: .25, end: 4.1, speaker: 'YOU', text: 'Balancing the weights helped. Alex is spreading his effort more evenly now.' };
  if (seconds < 7) return { start: 4.1, end: 7, speaker: 'ALEX', text: 'Exactly! I just follow the percentages!' };
  if (seconds < 10.6) return { start: 7, end: 10.6, speaker: 'YOU', text: 'But you’re still deciding what matters based on the scoring system...' };
  if (seconds < 13.7) return { start: 10.6, end: 13.7, speaker: 'ALEX', text: 'Isn’t that what I’m supposed to do?' };
  if (seconds < 17) return { start: 13.7, end: 17, speaker: 'YOU · THOUGHT', text: 'Maybe it’s not just about finding the perfect weights...' };
  return null;
}

/** Per-mounted request latch: seek/pause cannot re-emit completion. */
export function completionLatch() {
  let sent = false;
  return (frame: number) => {
    if (sent || frame < ENDING_FRAMES - 1) return false;
    sent = true;
    return true;
  };
}
