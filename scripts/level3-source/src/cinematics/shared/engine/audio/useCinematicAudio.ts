import { useCallback, useEffect, useRef } from 'react';

export type CinematicAudioSources<Cue extends string> = Partial<Record<Cue, string>>;

export function useCinematicAudio<Cue extends string>(sources: CinematicAudioSources<Cue>) {
  const pool = useRef(new Map<Cue, HTMLAudioElement>());
  const play = useCallback((cue: Cue, options?: { loop?: boolean; volume?: number }) => {
    const source = sources[cue];
    if (!source) return;
    const sound = pool.current.get(cue) ?? new Audio(source);
    sound.loop = options?.loop ?? false;
    sound.volume = options?.volume ?? 0.35;
    sound.currentTime = 0;
    pool.current.set(cue, sound);
    void sound.play().catch(() => { /* Browser audio permission must never block a scene. */ });
  }, [sources]);
  const stop = useCallback((cue: Cue) => {
    const sound = pool.current.get(cue);
    if (!sound) return;
    sound.pause();
    sound.currentTime = 0;
  }, []);
  useEffect(() => () => pool.current.forEach(sound => sound.pause()), []);
  return { play, stop };
}
