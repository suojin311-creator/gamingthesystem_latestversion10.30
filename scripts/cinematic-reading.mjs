// Shared approved English caption reading interval.
export const readingSeconds = text => Math.max(2.1, text.trim().split(/\s+/).length * .27 + .4);
