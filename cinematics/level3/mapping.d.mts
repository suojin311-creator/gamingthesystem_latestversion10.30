import type { LevelThreeCinematicRequest } from '../../levels/level3/data';
export function adaptationClips(request: LevelThreeCinematicRequest): { metric: string; intensity: 'Low' | 'Medium' | 'High'; sceneId: string; caption?: string }[];
