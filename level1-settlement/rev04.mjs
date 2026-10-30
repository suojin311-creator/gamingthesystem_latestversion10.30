// Seconds relative to the shared transition, independent of the chosen metric.
export const TRANSITION_SHOTS = [
  { id: 'studying', start: 0, end: 3 },
  { id: 'alex', start: 3, end: 10.8 },
  { id: 'surprised', start: 10.8, end: 14.4 },
  { id: 'books', start: 14.4, end: 18.5 },
  { id: 'smile', start: 18.5, end: 21.2 },
  { id: 'professor', start: 21.2, end: 25.2 },
];
export const TRANSITION_DURATION = TRANSITION_SHOTS.at(-1).end;
export const ALEX_LINE = 'Why are you studying so hard? We only need to meet the metric the professor set!';
export const CLASSMATE_LINE = 'Wait, that’s all we need to do?';
export const PROFESSOR_LINE = 'Maybe one metric is too narrow.';
export const transitionShot = seconds => TRANSITION_SHOTS.find(shot => seconds < shot.end) ?? TRANSITION_SHOTS.at(-1);
