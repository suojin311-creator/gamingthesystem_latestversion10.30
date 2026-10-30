import { useSyncExternalStore } from 'react';
import { audioDirector, type Cue } from '../../audio/director';
export type { Cue } from '../../audio/director';
/** Existing game interactions share the same music/effect output and mute preference. */
export function useFeedback() {
 const prefs=useSyncExternalStore(audioDirector.subscribe,audioDirector.snapshot);
 return {muted:prefs.muted,available:audioDirector.available,unlock:audioDirector.unlock,play:audioDirector.cue as (cue:Cue)=>void,toggle:audioDirector.toggle,stop:audioDirector.stopEffects,reset:audioDirector.stopEffects};
}
