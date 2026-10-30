import { adaptationClips } from '../../src/cinematics/level3/mapping.mjs';
export function validatedClips(request) {
  if(request?.sceneId!=='level3.weights'||typeof request.playerName!=='string'||!Array.isArray(request.runs)||!request.runs.length||!Array.isArray(request.shots))throw new Error('Missing weighted Gameplay request.');
  if(request.shots.some(s=>!s||typeof s.sceneId!=='string'||!s.sceneId||!Number.isFinite(s.weight)||typeof s.caption!=='string'||!s.caption.trim()))throw new Error('Missing weighted shot data.');
  return adaptationClips(request);
}
