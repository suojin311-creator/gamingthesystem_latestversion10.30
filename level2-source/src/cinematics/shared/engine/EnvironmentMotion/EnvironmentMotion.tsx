import type { CSSProperties } from 'react';
import { seededOffset } from '../timeline/animationMath';

export function EnvironmentMotion({ progress, seed = 3, style }: { progress: number; seed?: number; style?: CSSProperties }) {
  const drift = Math.sin(progress * Math.PI * 2 + seededOffset(seed, 2));
  const slowDrift = Math.sin(progress * Math.PI + seededOffset(seed + 1, 2));
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...style }}>
      <div style={{ position: 'absolute', left: '7%', top: '13%', width: '16%', height: '20%', borderRadius: '50%', opacity: 0.1 + slowDrift * 0.018, background: '#f7cf88', filter: 'blur(30px)', translate: `${drift * 4}px ${slowDrift * 2}px` }} />
      <div style={{ position: 'absolute', right: '8%', top: '21%', width: 7, height: 44, borderRadius: 4, opacity: 0.25, background: '#f4e9d4', rotate: `${drift * 1.5}deg`, transformOrigin: '50% 100%' }} />
      <div style={{ position: 'absolute', left: '18%', bottom: '17%', width: 90, height: 2, opacity: 0.16 + drift * 0.025, background: '#a9d9ff', boxShadow: '0 0 18px 5px #80c7ff' }} />
    </div>
  );
}
