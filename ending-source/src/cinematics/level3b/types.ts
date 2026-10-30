import type { ComponentType, ReactNode } from 'react';
import type { Intensity, MetricId } from '../../shared/contracts';

export type Three<T> = readonly [T, T, T];
export type ShotId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07' | 'S08' | 'S09' | 'S10' | 'S11' | 'S12' | 'S13' | 'S14';

/** Local presentation proposal, not a replacement for the shared gameplay contract.
 * Every tuple uses selectedMetrics order. Effort is supplied visual magnitude 0..1,
 * not an effort percentage or a value calculated from weights by this module. */
export interface WeightingResult {
  readonly id: string;
  readonly category: 'uneven' | 'near-equal';
  readonly weights: Three<number>;
  readonly effort: Three<number>;
  readonly intensity: Three<Intensity>;
}

export interface ShotFrame {
  readonly shot: ShotId;
  readonly current: WeightingResult;
  readonly previous?: WeightingResult;
  readonly history?: readonly WeightingResult[];
  readonly comparison?: { readonly uneven: WeightingResult; readonly nearEqual: WeightingResult };
}

export interface MemoryProps {
  readonly metric: MetricId;
  readonly index: number;
  readonly result: WeightingResult;
  readonly elapsed: number;
  readonly reducedMotion: boolean;
}

export interface AdaptationProps {
  readonly selectedMetrics: Three<MetricId>;
  readonly result: WeightingResult;
  readonly elapsed: number;
  readonly paused: boolean;
  readonly reducedMotion: boolean;
  readonly onComplete: () => void;
}

export interface BehaviourPresentation {
  readonly Memory: ComponentType<MemoryProps>;
  readonly Adaptation: ComponentType<AdaptationProps>;
  readonly hero?: ReactNode;
}

export interface ShotEvent {
  readonly requestId: string;
  readonly shot: ShotId;
}

export interface CompareComplete {
  readonly type: 'compare_patterns_complete';
  readonly requestId: string;
  readonly comparison: NonNullable<ShotFrame['comparison']>;
}
