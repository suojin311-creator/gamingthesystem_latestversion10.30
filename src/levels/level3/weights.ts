export type Weights = readonly [number, number, number];
export type Confirmed = readonly [boolean, boolean, boolean];
export type WeightGoal = 'first' | 'different';
export type Effort = 'low' | 'medium' | 'high';
export const EVEN_WEIGHTS: Weights = [34, 33, 33];
export const CONTRAST_WEIGHTS: Weights = [70, 20, 10];
export const MIN_WEIGHT = 1;
export const MAX_WEIGHT = 100 - MIN_WEIGHT * 2;
export const NEAR_EVEN_SPREAD = 10;
export const EFFORT_SIMILARITY_GAP = 10;

export const spread = (weights: Weights) => Math.max(...weights) - Math.min(...weights);
export const isNearEven = (weights: Weights) => spread(weights) <= NEAR_EVEN_SPREAD;
export const validWeights = (weights: Weights) => weights.length === 3 && weights.every(value => Number.isInteger(value) && value >= MIN_WEIGHT && value <= MAX_WEIGHT) && weights.reduce((sum, value) => sum + value, 0) === 100;

/** The first deliberate slider move creates an allocation; blank is not a run. */
export function startAllocation(index: number, requested: number): Weights | null {
  if (!Number.isInteger(index) || index < 0 || index > 2 || !Number.isFinite(requested)) return null;
  const value = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, Math.round(requested)));
  const others = [0, 1, 2].filter(i => i !== index);
  const remaining = 100 - value;
  const next: [number, number, number] = [0, 0, 0];
  next[index] = value;
  next[others[0]] = Math.ceil(remaining / 2);
  next[others[1]] = Math.floor(remaining / 2);
  return next;
}

/** Preserve the other unlocked shares' ratio while keeping an exact positive total. */
export function allocateWeight(weights: Weights, confirmed: Confirmed, index: number, requested: number): Weights {
  if (!Number.isInteger(index) || index < 0 || index > 2 || confirmed[index] || !Number.isFinite(requested)) return weights;
  const others = [0, 1, 2].filter(i => i !== index && !confirmed[i]);
  if (!others.length) return weights;
  const lockedTotal = weights.reduce((sum, value, i) => sum + (confirmed[i] ? value : 0), 0);
  const value = Math.max(MIN_WEIGHT, Math.min(100 - lockedTotal - MIN_WEIGHT * others.length, Math.round(requested)));
  const next: [number, number, number] = [...weights];
  next[index] = value;
  const remaining = 100 - lockedTotal - value;
  if (others.length === 1) next[others[0]] = remaining;
  else {
    const [first, second] = others;
    const previousTotal = weights[first] + weights[second];
    next[first] = Math.max(MIN_WEIGHT, Math.min(remaining - MIN_WEIGHT, Math.round(remaining * weights[first] / previousTotal)));
    next[second] = remaining - next[first];
  }
  return next;
}

export function maximumWeight(weights: Weights, confirmed: Confirmed, index: number) {
  if (confirmed[index]) return weights[index];
  return 100 - weights.reduce((sum, value, i) => sum + (confirmed[i] ? value : 0), 0)
    - MIN_WEIGHT * confirmed.filter((locked, i) => !locked && i !== index).length;
}

/** Either of the final two cards confirms their complete remaining split. */
export function confirmWeight(confirmed: Confirmed, index: number): Confirmed {
  if (!Number.isInteger(index) || index < 0 || index > 2 || confirmed[index]) return confirmed;
  const unlocked = confirmed.filter(locked => !locked).length;
  if (unlocked <= 2) return [true, true, true];
  const next: [boolean, boolean, boolean] = [...confirmed];
  next[index] = true;
  return next;
}

export function goalMet(weights: Weights, baseline: Weights, goal: WeightGoal) {
  return goal === 'first' || weights.some((weight, index) => weight !== baseline[index]);
}

export function canRun(weights: Weights, confirmed: Confirmed, baseline: Weights, goal: WeightGoal) {
  return validWeights(weights) && confirmed.length === 3 && confirmed.every(Boolean) && goalMet(weights, baseline, goal);
}

export function effortAt(weights: Weights, index: number): Effort {
  // Compare this reward with both alternatives. Differences up to ten points
  // are treated as similar; one clear win and one clear loss balance out.
  // This is a qualitative game rule, not a numerical effort-spent estimate.
  const weight = weights[index];
  const priority = weights.reduce((score, other, otherIndex) => otherIndex === index ? score
    : score + (weight - other > EFFORT_SIMILARITY_GAP ? 1 : other - weight > EFFORT_SIMILARITY_GAP ? -1 : 0), 0);
  return priority > 0 ? 'high' : priority < 0 ? 'low' : 'medium';
}

export const hasLowEffort = (weights: Weights) => weights.some((_, index) => effortAt(weights, index) === 'low');
