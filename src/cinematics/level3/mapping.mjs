// The game's shot effort is authoritative. This adapter never reads weights to
// classify outcomes, so threshold changes cannot silently select another scene.
export const METRICS = Object.freeze({
  prep: 'pre-class-preparation', part: 'in-class-participation', focus: 'on-task-focus',
  discuss: 'in-class-discussion-quality', reflect: 'learning-reflection-quality', peer: 'online-peer-response-quality',
});
export const INTENSITIES = Object.freeze({ low: 'Low', medium: 'Medium', high: 'High' });
export function adaptationClips(request) {
  if (request?.kind !== 'weights' || request.shots?.length !== 3 || new Set(request.shots.map(s => s.metricId)).size !== 3) throw new Error('Level 3A requires three distinct game-supplied shots.');
  return request.shots.map(shot => {
    if (!METRICS[shot.metricId] || !INTENSITIES[shot.effort]) throw new Error('Unsupported Level 3A metric or effort.');
    return { metric: METRICS[shot.metricId], intensity: INTENSITIES[shot.effort], sceneId: shot.sceneId, caption: shot.caption };
  });
}
