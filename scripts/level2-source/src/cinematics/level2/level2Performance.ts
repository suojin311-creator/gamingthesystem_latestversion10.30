import type { ShotId } from './level2Timeline';

export type AlexExpression = 'neutral' | 'pleased' | 'uncertain';

/** Film editing decisions, independent of gameplay and the playback clock. */
export function level2Performance(id: ShotId, time: number) {
  const t = Math.max(0, time);
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const progress = id === 'three-checklist' ? undefined
    : id === 'six-checklist' ? (5 + 0.65 + 0.15 * clamp((t - .55) / .45)) / 6
    : id === 'ten' ? clamp(t / 3.7)
    : id === 'twenty-five' ? clamp(t / 4.5)
    : id === 'hundred' ? clamp(t / 4.6) : 1;
  const insert = id === 'six-checklist' && t < 1.8
    || id === 'ten' && t >= .7 && t < 3.8
    || id === 'twenty-five' && t >= .35 && t < 2.8
    || id === 'hundred' && t >= .25 && t < 1.5;
  const portrait = id === 'three-checklist' && t >= 2.75
    || id === 'six-checklist' && t >= 1.8
    || id === 'perfect' || id === 'reflection';
  const question = id === 'three-checklist' ? 5.95 : id === 'six-checklist' ? 6.2 : id === 'reflection' ? 1.65 : Infinity;
  const uncertainty = clamp((t - question) / .55);
  const settled = id === 'perfect' ? t >= 1.6 : id === 'three-checklist' ? t >= 3.15 : true;
  const expression: AlexExpression = uncertainty > 0 ? 'uncertain' : portrait && settled ? 'pleased' : 'neutral';
  return {
    view: id === 'three-checklist' && t < 2.75 ? 'checking' : insert ? 'insert' : portrait ? 'portrait' : 'world',
    checkingTime: id === 'six-checklist' ? 1.05 + t / 1.8 * 1.7 : t,
    progress: id === 'six-checklist' && t >= 1 ? 1 : progress,
    expression, uncertainty,
  } as const;
}

/** Deterministic irregular blinks: seeking and pause return the same expression. */
export function alexBlinkAt(time: number) {
  return [1.32, 3.02, 4.87, 7.14, 11.63, 15.21, 18.06].some(start => time >= start && time < start + .115);
}
