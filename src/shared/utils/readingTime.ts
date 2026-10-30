/** Allow time to read English text; count only time when the text is visible. */
export function readingTime(text: string, minimum = 3000, maximum = 5000) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(maximum, Math.max(minimum, 1000 + words * 300));
}
