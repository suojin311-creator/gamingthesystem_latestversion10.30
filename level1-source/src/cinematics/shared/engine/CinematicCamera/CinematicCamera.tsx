import type { CSSProperties, ReactNode } from 'react';
import type { CameraPose } from '../types';

export const cinematicCameraPresets = {
  establishing: { scale: 1, x: 0, y: 0, vignette: 0.4 },
  pushIn: { scale: 1.08, x: 0, y: 0, vignette: 0.46 },
  pullBack: { scale: 0.97, x: 0, y: 0, vignette: 0.36 },
  focusLeft: { scale: 1.06, x: 3, y: 0, vignette: 0.45 },
  focusRight: { scale: 1.06, x: -3, y: 0, vignette: 0.45 },
  focusUp: { scale: 1.04, x: 0, y: 2, vignette: 0.42 },
  focusDown: { scale: 1.04, x: 0, y: -2, vignette: 0.42 },
} as const satisfies Record<string, CameraPose>;

export function CinematicCamera({ pose, children, style }: { pose: CameraPose; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', inset: 0, scale: `${pose.scale}`, translate: `${pose.x}% ${pose.y}%`, filter: pose.blur ? `blur(${pose.blur}px)` : undefined, transformOrigin: 'center' }}>
        {children}
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: pose.vignette ?? 0.45, background: 'radial-gradient(circle, transparent 48%, rgba(5, 10, 18, .72) 125%)' }} />
    </div>
  );
}
