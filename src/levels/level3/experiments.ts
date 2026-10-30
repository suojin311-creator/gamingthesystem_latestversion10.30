import { metricDefinition } from '../../shared/data/metrics';
import { effortChanged, joinNames, type WeightRun } from './data';
import { effortAt, hasLowEffort, validWeights, type Weights } from './weights';

export const MIN_TRIALS = 2;
export const MAX_TRIALS = 3;
export type Experiment = { purpose: 'explore' | 'respond' | 'verify'; question: string; hint: string };
export const canCompare = (runs: WeightRun[]) => runs.length >= MIN_TRIALS && runs.length <= MAX_TRIALS;
export const canTryAgain = (runs: WeightRun[]) => runs.length < MAX_TRIALS;

/** A question follows the observed result; no goal choice or prescribed numbers. */
export function nextExperiment(runs: WeightRun[]): Experiment {
  if (!runs.length) return {
    purpose: 'explore',
    question: 'How would you split the 100%?',
    hint: 'Move any slider to start. Confirm your weights, then watch Alex.',
  };
  const previous = runs.at(-1)!;
  const neglectedIds = previous.metricIds.filter((_, index) => effortAt(previous.weights, index) === 'low');
  const neglected = joinNames(neglectedIds.map(id => metricDefinition(id).shortName));
  if (runs.length === 1) return neglected ? {
    purpose: 'respond',
    question: `Can you bring more attention to ${neglected}?`,
    hint: 'Give a neglected task more weight. Watch what happens to the others.',
  } : {
    purpose: 'respond',
    question: 'All three got attention. Has that solved the problem?',
    hint: 'Try a different split. Does Alex still stop once the criteria are met?',
  };
  const unchanged = runs.slice(1).every((run, index) => !effortChanged(runs[index], run));
  if (unchanged) return {
    purpose: 'verify',
    question: 'Alex’s effort stayed the same. What could you change?',
    hint: 'Make a bigger change to the shares. Does Alex’s effort change this time?',
  };
  return hasLowEffort(previous.weights) ? {
    purpose: 'verify',
    question: `${neglected} ${neglectedIds.length === 1 ? 'gets' : 'get'} little attention. What could you change?`,
    hint: 'Give a neglected task more weight. Can you avoid neglecting another?',
  } : {
    purpose: 'verify',
    question: 'The effort changed. Did the stopping point?',
    hint: 'Try another split. Does Alex still stop when the criteria are met?',
  };
}

export function meetsExperiment(weights: Weights, runs: WeightRun[]) {
  return canTryAgain(runs) && validWeights(weights) && !runs.some(run => run.weights.every((value, index) => value === weights[index]));
}
export function experimentHint() { return 'That split is already in your results. Reset weights to try a different one.'; }
