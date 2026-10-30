export type MetricId = 'prep' | 'part' | 'focus' | 'discuss' | 'reflect' | 'peer';

export type MetricDefinition = {
  id: MetricId; name: string; shortName: string; description: string;
};

/** Shared names only; scores, outcomes and rules belong to each level. */
export const METRIC_CATALOG: readonly MetricDefinition[] = [
  { id: 'prep', name: 'Pre-class Preparation', shortName: 'Preparation', description: 'Finish the preparation.' },
  { id: 'part', name: 'In-class Participation', shortName: 'Participation', description: 'Speak up in class.' },
  { id: 'focus', name: 'On-task Focus', shortName: 'Focus', description: 'Stay on the task.' },
  { id: 'discuss', name: 'In-class Discussion Quality', shortName: 'Discussion', description: 'Develop ideas together.' },
  { id: 'reflect', name: 'Learning Reflection Quality', shortName: 'Reflection', description: 'Reflect on learning.' },
  { id: 'peer', name: 'Online Peer Response Quality', shortName: 'Peer response', description: 'Respond to classmates.' },
];

export function metricDefinition(id: MetricId) {
  return METRIC_CATALOG.find(metric => metric.id === id)!;
}
