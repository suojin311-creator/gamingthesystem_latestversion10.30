export type GazeDirection = 'center' | 'left' | 'right' | 'down';
export type Expression = 'neutral' | 'uncertain' | 'pleased' | 'concerned' | 'surprised';
export type ArmPose = 'idle' | 'hand-up' | 'writing' | 'checking-rubric';

export type CharacterPose = {
  gaze: GazeDirection;
  gazeTarget?: { x: number; y: number };
  expression: Expression;
  arms?: ArmPose;
  blink: number;
  headTilt: number;
  headY: number;
};

export type CameraPose = {
  scale: number;
  x: number;
  y: number;
  blur?: number;
  vignette?: number;
};
