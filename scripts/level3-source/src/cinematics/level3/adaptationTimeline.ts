import type { CinematicRequest, Intensity, MetricId } from '../../shared/contracts';

export const METRICS = [
  { id: 'pre-class-preparation', alias: 'preparation', label: 'Pre-class Preparation' },
  { id: 'in-class-participation', alias: 'participation', label: 'In-class Participation' },
  { id: 'on-task-focus', alias: 'focus', label: 'On-task Focus' },
  { id: 'in-class-discussion-quality', alias: 'discussion', label: 'In-class Discussion Quality' },
  { id: 'learning-reflection-quality', alias: 'reflection', label: 'Learning Reflection Quality' },
  { id: 'online-peer-response-quality', alias: 'peer-response', label: 'Online Peer Response Quality' },
] as const satisfies readonly { id: MetricId; alias: string; label: string }[];
export const INTENSITIES = ['Low', 'Medium', 'High'] as const;
export type AdaptationClip = Readonly<{ metric: MetricId; intensity: Intensity }>;
export type AdaptationRequest = Extract<CinematicRequest, { cinematicId: 'level3' }>;

// Narrative V2 pp. 4–5 / CIN3A-S02–S19. These are presentation choices,
// never weight thresholds, result categories, or gameplay calculations.
export const DIALOGUE: Record<MetricId, Record<Intensity, string>> = {
  'pre-class-preparation': { Low: 'I’ll just do the basics.', Medium: 'Okay, preparation done!', High: 'I can’t miss a single preparation point!' },
  'in-class-participation': { Low: 'I’ll speak if I have to.', Medium: 'I should contribute more.', High: 'Me again! I have something to add!' },
  'on-task-focus': { Low: 'I’ll focus when needed.', Medium: 'Stay focused. Got it.', High: 'Maximum focus!' },
  'in-class-discussion-quality': { Low: 'Yeah, that makes sense.', Medium: 'Can you explain your idea?', High: 'I’d like to build on your point. Could you elaborate?' },
  'learning-reflection-quality': { Low: 'That should be enough.', Medium: 'I learned something new today.', High: 'Before, I thought... Now, I think...' },
  'online-peer-response-quality': { Low: 'Nice work!', Medium: 'Maybe you could add an example.', High: 'Specific feedback? Check. Suggestion? Check!' },
};
export const ENTRY_DURATION = 3;
export const CLIP_DURATION = 4;
export const BRIDGE_DURATION = 0.45;
export const EXIT_DURATION = 2;
export const SEQUENCE_DURATION = ENTRY_DURATION + 3 * CLIP_DURATION + 2 * BRIDGE_DURATION + EXIT_DURATION;

export function storyboardId(clip: AdaptationClip): string {
  return `CIN3A-S${String(2 + METRICS.findIndex(m => m.id === clip.metric) * 3 + INTENSITIES.indexOf(clip.intensity)).padStart(2, '0')}`;
}
export function metricLabel(id: MetricId): string { return METRICS.find(m => m.id === id)!.label; }

export function suppliedClips(request: AdaptationRequest): readonly AdaptationClip[] | null {
  const { selectedMetrics, intensity, effort } = request.input;
  if (!request.requestId || selectedMetrics.length !== 3 || new Set(selectedMetrics).size !== 3) return null;
  const states = intensity ?? effort;
  if (!states || selectedMetrics.some(id => !METRICS.some(m => m.id === id) || !INTENSITIES.includes(states[id]!))) return null;
  // Keep caller order. Deliberately do not read weights here.
  return selectedMetrics.map(metric => ({ metric, intensity: states[metric]! }));
}

export type SequenceFrame = {
  phase: 'entry' | 'clip' | 'bridge' | 'exit';
  clipIndex: number;
  time: number;
  bridge: number;
};
export function sequenceFrame(elapsed: number): SequenceFrame {
  let t = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  if (t < ENTRY_DURATION) return { phase: 'entry', clipIndex: 0, time: t, bridge: 0 };
  t -= ENTRY_DURATION;
  for (let i = 0; i < 3; i++) {
    if (t < CLIP_DURATION) return { phase: 'clip', clipIndex: i, time: t, bridge: 0 };
    t -= CLIP_DURATION;
    if (i < 2) {
      if (t < BRIDGE_DURATION) return { phase: 'bridge', clipIndex: i, time: CLIP_DURATION, bridge: t / BRIDGE_DURATION };
      t -= BRIDGE_DURATION;
    }
  }
  return { phase: 'exit', clipIndex: 2, time: Math.min(EXIT_DURATION, t), bridge: 0 };
}

/** Cuts are editorial beats, not simulated independent arm/eye movement. */
export function participationBeat(intensity: Intensity, time: number): 'listen' | 'raise' | 'response' | 'reaction' {
  if (intensity === 'Low') return time < 2.65 ? 'listen' : time < 3.35 ? 'raise' : 'response';
  if (intensity === 'Medium') return time < 0.75 ? 'listen' : time < 1.5 ? 'raise' : time < 2.35 ? 'response' : time < 3.05 ? 'listen' : 'raise';
  return time < 0.45 ? 'listen' : time < 1.05 ? 'raise' : time < 1.45 ? 'response' : time < 2 ? 'raise' : time < 2.45 ? 'reaction' : time < 3.2 ? 'raise' : 'response';
}

export function reflectionText(intensity: Intensity, time: number): string {
  const low = 'We discussed motivation.\nIt was interesting.';
  const medium = 'I learned something new today. Clear feedback helped our group notice a gap in our explanation. Next time, I will connect my point to a specific example.';
  const high = [
    'Before, I thought a clear answer was enough.',
    ' Now, I think an explanation needs evidence: our group changed its view after comparing two examples.',
    ' Next time, I will test my explanation with a contrasting example.',
  ];
  if (intensity === 'Low') return low.slice(0, Math.floor(Math.max(0, time - 0.45) * 72));
  if (intensity === 'Medium') {
    const typingTime = Math.max(0, Math.min(time - 0.6, 1)) + Math.max(0, time - 2.15);
    return medium.slice(0, Math.floor(typingTime * 73));
  }
  return high.slice(0, time < 1.45 ? 1 : time < 2.6 ? 2 : 3).join('');
}
