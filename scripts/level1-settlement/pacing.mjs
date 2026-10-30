import { TRANSITION_DURATION } from './rev04.mjs';

/** English reading holds at about 220 words/minute, plus a short settling margin. */
export function readingSeconds(text, minimum = 2.1) {
  return Math.max(minimum, (text.trim().match(/\S+/g)?.length ?? 0) * .27 + .4);
}
/** Preserve all six consequence readings, then play the same REV-04 transition. */
export function createPacing(branch) {
  const segments = [
    [0, 2.2, .65],
    [2.2, 5.3, readingSeconds(branch.boast)],
    [5.3, 5.5, .15],
    [5.5, 8.2, readingSeconds(branch.question)],
    [8.2, 8.9, .30],
    [8.9, 12.1, readingSeconds(branch.reveal)],
    [12.1, 12.6, .45],
  ];
  let duration = 0;
  const timeline = segments.map(([from, to, hold]) => {
    const start = duration;
    duration += hold;
    return { from, to, start, end: duration };
  });
  const transitionStart = duration;
  duration += TRANSITION_DURATION;
  return {
    duration, transitionStart,
    timeline,
    sourceSeconds(seconds) {
      const segment = timeline.find(part => seconds <= part.end) ?? timeline[timeline.length - 1];
      const fraction = Math.max(0, Math.min(1, (seconds - segment.start) / (segment.end - segment.start)));
      return segment.from + (segment.to - segment.from) * fraction;
    },
  };
}
