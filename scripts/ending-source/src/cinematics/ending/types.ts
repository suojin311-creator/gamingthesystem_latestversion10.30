import type { ComponentType } from 'react';
import type { MetricId } from '../../shared/contracts';
import type { MemoryProps, Three, WeightingResult } from '../level3b/types';

/** Local integration proposal; gameplay owns all supplied results. */
export type EndingInput = {
  readonly requestId: string;
  readonly selectedMetric: MetricId;
  readonly selectedMetrics: Three<MetricId>;
  readonly checklistLabels: readonly string[];
  readonly comparison: { readonly uneven: WeightingResult; readonly nearEqual: WeightingResult };
};
export type EndingProps = {
  readonly input: EndingInput;
  readonly WeightMemory: ComponentType<MemoryProps>;
  readonly reducedMotion: boolean;
};
export type EndingComplete = { readonly type: 'animationComplete'; readonly cinematicId: 'ending'; readonly requestId: string };
export type EndingHandoff = { readonly type: 'design_lab_requested'; readonly requestId: string };
