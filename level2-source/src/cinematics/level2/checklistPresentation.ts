/** Illustration choreography only. These example evidence links do not score gameplay. */
export function checklistPresentation(count: number, progress: number, allComplete = false) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const dense = count >= 25;
  const order = count === 10 ? [0, 1, 2, 4, 5, 6, 7, 8, 9, 3]
    : dense ? [0, 1, 2].flatMap(e => Array.from({ length: count }, (_, i) => i).filter(i => i % 3 === e))
    : Array.from({ length: count }, (_, i) => i);
  // At 100, most evidence is already mapped. Observe four deliberate gap-closing passes.
  const initial = count === 100 ? 88 : 0;
  const batches: number[][] = [];
  for (let i = initial; i < count; i += dense ? 3 : 1) batches.push(order.slice(i, i + (dense ? 3 : 1)));
  const position = p * batches.length;
  const step = Math.min(batches.length - 1, Math.floor(position));
  const within = p === 1 ? 1 : position - step;
  const completedSteps = allComplete || p === 1 ? batches.length : step + (within >= 0.8 ? 1 : 0);
  const checked = new Set([...order.slice(0, initial), ...batches.slice(0, completedSteps).flat()]);
  const targets = p === 1 || allComplete ? [] : batches[step];
  return { checked, targets, within, linkProgress: Math.min(1, within / 0.65), markProgress: Math.max(0, Math.min(1, (within - 0.65) / 0.15)) };
}

/** Anchor the one real pen to the checklist's current batch and exact drawn stroke. */
export function checkingPenState(count: number, progress: number) {
  const state = checklistPresentation(count, progress);
  const target = (state.targets.length ? state : checklistPresentation(count, 1 - 1e-8)).targets[0];
  const done = state.checked.has(target);
  return {
    criterion: target + 1,
    mark: done ? 1 : state.markProgress,
    approach: 1 - Math.min(1, state.within / .5),
    lift: Math.max(0, Math.min(1, (state.within - .84) / .16)),
  };
}
