import type { CinematicRequest, MetricId } from '../../shared/contracts';

export type Level2Request = Extract<CinematicRequest, { cinematicId: 'level2' }>;
// Presentation segments for the independent prototype. These are NOT agreed gameplay phase names.
export type PreviewSegment = 'three' | 'six' | '10' | '25' | '100' | 'final' | 'checking';
export type ThreeMetricCategory = 'visible-behaviour-heavy' | 'quality-depth-heavy' | 'mixed-broad';
export type ShotId = 'entry' | 'pattern' | 'three-checklist' | 'six-checklist' | 'expand' | 'ten' | 'twenty-five' | 'hundred' | 'perfect' | 'reflection' | 'priority' | 'checking';
export type Dialogue = { start: number; end: number; speaker: 'Alex' | 'You'; text: string };
export type Shot = { id: ShotId; storyboard: string; duration: number; dialogue?: readonly Dialogue[] };

// Display labels only: no selection, scoring, outcome classification or progression rules.
const LABELS: Record<MetricId, string> = {
  'pre-class-preparation': 'Pre-class Preparation',
  'in-class-participation': 'In-class Participation',
  'on-task-focus': 'On-task Focus',
  'in-class-discussion-quality': 'In-class Discussion Quality',
  'learning-reflection-quality': 'Learning Reflection Quality',
  'online-peer-response-quality': 'Online Peer Response Quality',
};
export const metricLabel = (id: MetricId) => LABELS[id];

const THREE: readonly Shot[] = [
  { id: 'entry', storyboard: 'CIN2-S01', duration: 1.8 },
  { id: 'pattern', storyboard: 'CIN2-S02', duration: 4.6 },
  { id: 'three-checklist', storyboard: 'CIN2-S03', duration: 9.2, dialogue: [
    { start: 2.8, end: 4.1, speaker: 'Alex', text: 'I’ve completed all three requirements!' },
    { start: 4.2, end: 5.85, speaker: 'You', text: 'And what about the other parts of your learning?' },
    { start: 6.25, end: 7.45, speaker: 'Alex', text: 'Other parts? Are those being graded too?' },
    { start: 7.55, end: 9.15, speaker: 'You', text: 'Maybe I’m still missing something...' },
  ] },
];
const SIX: readonly Shot[] = [
  { id: 'six-checklist', storyboard: 'CIN2-S05', duration: 9.5, dialogue: [
    { start: 0.1, end: 1.65, speaker: 'You', text: 'Now we’re measuring everything!' },
    { start: 1.8, end: 4.3, speaker: 'Alex', text: 'Six metrics, six green ticks! I’ve got everything covered!' },
    { start: 4.45, end: 6.05, speaker: 'You', text: 'But what did you actually learn?' },
    { start: 6.8, end: 8.8, speaker: 'Alex', text: 'Well... I learned exactly how to meet the criteria!' },
  ] },
  { id: 'expand', storyboard: 'CIN2-S06', duration: 2.7 },
];
const FINAL: readonly Shot[] = [
  { id: 'perfect', storyboard: 'CIN2-S10', duration: 5.3 },
  { id: 'reflection', storyboard: 'CIN2-S11', duration: 5.1, dialogue: [
    { start: 0.1, end: 2.35, speaker: 'You', text: 'Maybe adding more metrics isn’t the answer...' },
    { start: 2.7, end: 5.05, speaker: 'You', text: 'What if some metrics mattered more than others?' },
  ] },
  { id: 'priority', storyboard: 'CIN2-S12', duration: 2.9 },
];

export function getLevel2Shots(request: Level2Request): readonly Shot[] {
  switch (request.input.phase) {
    case 'three':
      // Consume the supplied category; deliberately never inspect metric combinations.
      return ['visible-behaviour-heavy', 'quality-depth-heavy', 'mixed-broad'].includes(request.input.resultCategory ?? '') ? THREE : [];
    case 'six': return SIX;
    case '10': return [{ id: 'ten', storyboard: 'CIN2-S07', duration: 4.8 }];
    case '25': return [{ id: 'twenty-five', storyboard: 'CIN2-S08', duration: 5.1 }];
    case '100': return [{ id: 'hundred', storyboard: 'CIN2-S09', duration: 5.9 }, ...FINAL];
    case 'final': return FINAL;
    case 'checking': return [{ id: 'checking', storyboard: 'CIN2-CHECKING-INSERT', duration: 4.2 }];
    default: return [];
  }
}

export const sequenceDuration = (shots: readonly Shot[]) => Math.round(shots.reduce((sum, shot) => sum + shot.duration, 0) * 1000000) / 1000000;

export function shotAt(shots: readonly Shot[], elapsed: number) {
  let start = 0;
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    if (elapsed < start + shot.duration || i === shots.length - 1) {
      return { shot, time: Math.max(0, Math.min(shot.duration, elapsed - start)) };
    }
    start += shot.duration;
  }
  return null;
}
