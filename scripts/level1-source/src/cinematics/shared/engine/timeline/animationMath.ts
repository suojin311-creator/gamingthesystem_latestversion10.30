export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const pulse = (value: number, start: number, peak: number, end: number) => {
  if (value <= start || value >= end) return 0;
  if (value <= peak) return clamp01((value - start) / (peak - start));
  return clamp01((end - value) / (end - peak));
};

export const seededUnit = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

export const seededOffset = (seed: number, range: number) =>
  (seededUnit(seed) * 2 - 1) * range;
