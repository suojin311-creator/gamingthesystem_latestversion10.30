import type { CSSProperties } from 'react';

export function DialogueLayer({ children, opacity = 1, style }: { children: string; opacity?: number; style?: CSSProperties }) {
  return (
    <div role="status" style={{ position: 'absolute', left: '12%', right: '12%', bottom: '8%', opacity, textAlign: 'center', color: '#fff7e8', font: '500 clamp(18px, 2.2vw, 34px)/1.35 Georgia, serif', letterSpacing: '.02em', textShadow: '0 2px 12px #000', ...style }}>
      {children}
    </div>
  );
}
