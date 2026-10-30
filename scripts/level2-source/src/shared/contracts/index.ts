/** Data only. Gameplay calculates outcomes; cinematics present this snapshot. */
export type MetricId =
  | 'pre-class-preparation'
  | 'in-class-participation'
  | 'on-task-focus'
  | 'in-class-discussion-quality'
  | 'learning-reflection-quality'
  | 'online-peer-response-quality';

export type GameLevel = 1 | 2 | 3;
export type CinematicId = 'opening' | 'level1' | 'level2' | 'level3';
export type Intensity = 'Low' | 'Medium' | 'High';

// Opaque gameplay-owned labels until the approved V2 documents are available.
// Cinematics must not infer mechanics from these strings or invent categories.
export type MeasurementPhase = string;
export type ResultCategory = string;

export interface Level1CinematicInput {
  readonly selectedMetric: MetricId;
  readonly playerPrediction: string;
  readonly runRequested: boolean;
  readonly resultCategory?: ResultCategory;
}

export interface Level2CinematicInput {
  readonly selectedMetrics: readonly MetricId[];
  readonly phase: MeasurementPhase;
  readonly resultCategory?: ResultCategory;
}

export interface Level3CinematicInput {
  readonly selectedMetrics: readonly MetricId[];
  // Gameplay validates coverage, units and totals; no default scale is implied.
  readonly weights: Readonly<Partial<Record<MetricId, number>>>;
  readonly effort?: Readonly<Partial<Record<MetricId, Intensity>>>;
  readonly intensity?: Readonly<Partial<Record<MetricId, Intensity>>>;
}

export type CinematicRequest =
  | { readonly requestId: string; readonly cinematicId: 'opening'; readonly input: { readonly playerName: string } }
  | { readonly requestId: string; readonly cinematicId: 'level1'; readonly level: 1; readonly input: Level1CinematicInput }
  | { readonly requestId: string; readonly cinematicId: 'level2'; readonly level: 2; readonly input: Level2CinematicInput }
  | { readonly requestId: string; readonly cinematicId: 'level3'; readonly level: 3; readonly input: Level3CinematicInput };

/** Echo request identity only; this event never supplies a recalculated outcome. */
export interface CinematicComplete {
  readonly type: 'animationComplete';
  readonly requestId: CinematicRequest['requestId'];
  readonly cinematicId: CinematicId;
}

export type CinematicResult = CinematicComplete;
