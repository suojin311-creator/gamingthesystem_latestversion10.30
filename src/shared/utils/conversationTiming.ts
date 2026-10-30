/** The brisk reading rhythm used by Level 2 and Level 1's closing review. */
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
export const BRISK_TYPING_DELAY = 300;
export const briskDialogueTime = (text: string) => Math.min(2200, Math.max(1100, 400 + words(text) * 110));
export const findingReadingTime = (text: string) => Math.min(2800, Math.max(1600, 500 + words(text) * 70));
