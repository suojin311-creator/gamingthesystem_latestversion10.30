import { readingSeconds } from '../cinematic-reading.mjs';
import { createHundredPacing } from '../metric100-preview/pacing.mjs';
export { readingSeconds };
export const COVER_SECONDS = .48;

export function createPacing(kind, shots) {
  if (kind === 'checklist') return { kind, ...createHundredPacing(shots) };
  const timeline = [];
  let duration = 0;
  const add = (from, to, hold, dialogue = null) => {
    timeline.push({ from, to, start: duration, end: duration + hold, dialogue });
    duration += hold;
  };
  const offsets = new Map();
  let source = 0;
  for (const shot of shots) { offsets.set(shot.id, source); source += shot.duration; }
  const id = kind === 'three' ? 'three-checklist' : kind === 'six' ? 'six-checklist' : null;
  const shot = shots.find(item => item.id === id);
  if (!shot?.dialogue?.length) throw new Error('A supported placeholder scene with authored dialogue is required.');
  if (kind === 'three' && shot.dialogue[0].text !== 'I’ve completed all three requirements!') throw new Error('Review the partner three-metric opening before trimming.');
  if (kind === 'six') add(0, shot.dialogue[0].start, .25);
  const offset = offsets.get(id);
  for (let i = 0; i < shot.dialogue.length; i++) {
    const line = shot.dialogue[i];
    add(offset + line.start, offset + line.end, readingSeconds(line.text), line);
    const next = shot.dialogue[i + 1];
    if (next) add(offset + line.end, offset + next.start, .15);
  }
  const last = shot.dialogue.at(-1);
  add(offset + last.end, offset + Math.min(shot.duration - .01, last.end + .2), .35);
  return { kind, duration, timeline };
}

export function sampleAt(pacing, elapsed) {
  const time = Math.max(0, Math.min(pacing.duration, elapsed));
  const part = pacing.timeline.find(item => time < item.end) ?? pacing.timeline.at(-1);
  const fraction = Math.max(0, Math.min(1, (time - part.start) / (part.end - part.start)));
  return { sourceSeconds: part.from + (part.to - part.from) * fraction, dialogue: part.dialogue };
}

export function finalCover(pacing, elapsed) {
  if (pacing.kind === 'checklist') return 0;
  const t = Math.max(0, Math.min(1, (elapsed - (pacing.duration - .45)) / .4));
  return t * t * (3 - 2 * t);
}
