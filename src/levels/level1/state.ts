import type { MetricId } from './metrics';

export type Phase = 'choose' | 'predict' | 'result' | 'cinematic' | 'review';
export type Session = {
  phase: Phase; metricId: MetricId | null; prediction: string;
  resultReported: boolean; reviewStep: 0 | 1;
};
export const INITIAL_SESSION: Session = { phase: 'choose', metricId: null, prediction: '', resultReported: false, reviewStep: 0 };
