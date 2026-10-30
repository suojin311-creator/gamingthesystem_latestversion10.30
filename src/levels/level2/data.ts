import { METRIC_CATALOG, type MetricId } from '../../shared/data/metrics';

export type Branch = 'visible' | 'quality' | 'mixed';
export type RoundCount = 3 | 6 | 10 | 25 | 100;
export type SceneKind = 'three' | 'six' | 'checklist';
export type LevelTwoCinematicRequest = {
  sceneId: string; kind: SceneKind; branch: Branch; playerName: string;
  selectedMetricIds: MetricId[]; metricCount: 3 | 6 | 100;
};
export type LevelTwoResult = { selectedMetricIds: MetricId[]; branch: Branch; metricsTracked: 100 };

export function classifyTrio(ids: readonly MetricId[]): Branch {
  if (ids.length !== 3 || new Set(ids).size !== 3 || ids.some(id => !METRIC_CATALOG.some(metric => metric.id === id))) {
    throw new Error('Choose exactly three different metrics.');
  }
  if (ids.every(id => ['prep', 'part', 'focus'].includes(id))) return 'visible';
  if (ids.every(id => ['discuss', 'reflect', 'peer'].includes(id))) return 'quality';
  return 'mixed';
}

export const THREE_OUTCOMES: Record<Branch, { report: string; evidence: string; action: string }> = {
  visible: {
    report: 'The class looks more engaged.',
    evidence: 'Students look prepared, active and focused. But they chase ticks and neglect deeper learning.',
    action: 'The classroom is busy: students raise their hands, keep materials open and show that they are on task.',
  },
  quality: {
    report: 'The work looks stronger.',
    evidence: 'Students produce stronger discussions and written work. But they repeat rewarded patterns without deeper thinking.',
    action: 'The work looks polished: discussion phrases, reflections and peer responses closely follow the expected criteria.',
  },
  mixed: {
    report: 'The dashboard looks convincing.',
    evidence: 'Students improve in the three tracked areas. But they neglect learning outside those areas.',
    action: 'Several parts of classroom life improve, while students keep checking which of their actions will count.',
  },
};

export const SIX_EVIDENCE = 'Students meet the criteria across all six areas. But they turn learning into a box-ticking task.';
export const FINAL_EVIDENCE = 'Students tick off all 100 requirements. But they do the minimum needed to meet them.';

export const STUDENT_OBSERVATIONS: Record<RoundCount, string> = {
  3: 'Untracked areas get overlooked.',
  6: 'Meeting criteria becomes the goal.',
  10: 'Ticking boxes takes priority.',
  25: 'Optimizing for the criteria takes priority.',
  100: 'Doing the minimum becomes the strategy.',
};

export const CHECKLISTS: Record<10 | 25 | 100, { label: string; actions: string[] }> = {
  10: { label: 'Completing requirements', actions: [
    'Check completed requirements.',
    'Find what is still missing.',
    'Plan the next task.',
  ] },
  25: { label: 'Managing criteria', actions: [
    'Check which criteria still need evidence.',
    'Use one task to cover several criteria.',
    'Choose the most efficient route.',
  ] },
  100: { label: 'Optimizing the checklist', actions: [
    'Find the remaining unchecked boxes.',
    'Reuse evidence across requirements.',
    'Do the minimum needed to meet the criteria.',
  ] },
};

export function nextCount(count: RoundCount): 10 | 25 | 100 | null {
  return count === 6 ? 10 : count === 10 ? 25 : count === 25 ? 100 : null;
}

export function sceneRequest(count: 3 | 6 | 100, selectedMetricIds: MetricId[], playerName: string): LevelTwoCinematicRequest {
  const branch = classifyTrio(selectedMetricIds);
  const kind: SceneKind = count === 3 ? 'three' : count === 6 ? 'six' : 'checklist';
  return { sceneId: count === 3 ? `level2.three.${branch}` : `level2.${kind}`, kind, branch, selectedMetricIds: [...selectedMetricIds], metricCount: count, playerName };
}
