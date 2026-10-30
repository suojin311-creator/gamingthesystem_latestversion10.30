import type { ReactNode } from 'react';

const shapes = {
  prep: <><path d="M4 5.5c3-1.1 5.6-.8 8 1.2 2.4-2 5-2.3 8-1.2V19c-3-1.1-5.6-.8-8 1.2-2.4-2-5-2.3-8-1.2Z"/><path d="M12 7v13M7 9l2 .3M15 9.3l2-.3M7 12l2 .3M15 12.3l2-.3"/></>,
  part: <><path d="M7 13V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7c0 4-2.2 7-6 7-2.8 0-4.1-1.8-5.5-3.6L4 14.2a1.7 1.7 0 0 1 2.4-2.4L9 14"/></>,
  focus: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/></>,
  discuss: <><path d="M3 4h14v10H9l-4 3v-3H3Z"/><path d="M17 8h4v11h-3v3l-4-3h-4v-3M7 8h6M7 11h3"/></>,
  reflect: <><path d="M5 3h10l4 4v14H5ZM15 3v5h4M8 12h8M8 16h5"/><path d="m2 7 3 1"/></>,
  peer: <><path d="M3 5h18v13H3ZM1 21h22M7 9h5M7 12h3"/><path d="m14 12 2 2 3-4"/></>,
  arrow: <><path d="M4 12h15m-5-5 5 5-5 5"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  school: <><path d="m2 9 10-6 10 6H2ZM4 21h16M5 10v8m5-8v8m4-8v8m5-8v8M3 18h18"/></>,
  student: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-3c0-4 16-4 16 0v3M8 14l4 4 4-4"/></>,
  restart: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></>,
  play: <path d="m8 5 11 7-11 7Z"/>,
  pause: <><path d="M8 5v14M16 5v14" strokeWidth="3" /></>,
  spark: <><path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z"/></>,
  sound: <><path d="M4 9h4l5-4v14l-5-4H4Z M17 8c3 2 3 6 0 8M19 4c6 4 6 12 0 16"/></>,
  muted: <><path d="M4 9h4l5-4v14l-5-4H4Z M17 9l5 6m0-6-5 6"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  question: <><circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 1 1 4 3c-1 .4-1 1-1 2M12 17h.01"/></>,
  warning: <><path d="m12 3 10 18H2Z"/><path d="M12 9v5M12 17h.01"/></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof shapes;

export default function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
