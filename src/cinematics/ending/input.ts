import { cinematicRequest, type WeightRun } from '../../levels/level3/data';
import { weightedSceneReply } from '../../levels/level3/dialogue';
import { validWeights } from '../../levels/level3/weights';
import { METRIC_CATALOG, metricDefinition, type MetricId } from '../../shared/data/metrics';
const knownMetric = (id: unknown): id is MetricId => METRIC_CATALOG.some(metric => metric.id === id);

/** Use the actual two/three trials in order. Never create a balanced reference run. */
export function endingInputFromRuns(levelOneMetricId: MetricId, runs: WeightRun[], playerName = '') {
  if (!knownMetric(levelOneMetricId)) throw new Error('Ending requires the actual Level 1 metric.');
  if (!Array.isArray(runs) || runs.length < 2 || runs.length > 3) throw new Error('The ending requires the actual two or three completed trials.');
  for (const [index, run] of runs.entries()) {
    if (!run || run.round !== index + 1 || !Array.isArray(run.metricIds) || run.metricIds.length !== 3 || new Set(run.metricIds).size !== 3 || !run.metricIds.every(knownMetric) || !Array.isArray(run.weights) || !validWeights(run.weights)) throw new Error('Invalid actual Ending trial data.');
  }
  const name = typeof playerName === 'string' ? playerName.trim() : '';
  const history = runs.map((_run, index) => {
    const request = cinematicRequest('weights', name, runs.slice(0, index + 1));
    return { ...request, shots: request.shots.map((shot, shotIndex) => ({ ...shot, caption: weightedSceneReply(request, shotIndex), label: metricDefinition(shot.metricId).name })) };
  });
  return { levelOneMetricId, playerName: name, history, lastRun: history[history.length - 1] };
}

/** Reject incomplete or inconsistent wire data instead of showing example memories. */
export function validateEndingInput(input: unknown) {
  const data = input as ReturnType<typeof endingInputFromRuns>;
  if (!data || !Array.isArray(data.history) || data.history.some(h => !h || !Array.isArray(h.runs) || !h.runs.length)) throw new Error('Missing actual Ending history.');
  const expected = endingInputFromRuns(data.levelOneMetricId, data.history.map(h => h.runs.at(-1)!), data.playerName);
  for (const [index, request] of data.history.entries()) {
    if (request.sceneId !== 'level3.weights' || request.kind !== 'weights' || request.playerName !== expected.playerName || JSON.stringify(request.runs) !== JSON.stringify(expected.history[index].runs) || JSON.stringify(request.shots) !== JSON.stringify(expected.history[index].shots)) throw new Error('Inconsistent Ending scene or history.');
  }
  if (JSON.stringify(data.lastRun) !== JSON.stringify(data.history.at(-1))) throw new Error('Ending final memory must be the actual last trial.');
  return expected;
}
