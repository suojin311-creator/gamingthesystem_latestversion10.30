import { useEffect, useRef, useState } from 'react';

/** Advance a presentation beat only while its information is on screen. */
export function useVisibleDelay(key: string, selector: string, delay: number, active: boolean, onDone: () => void) {
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const callback = useRef(onDone);
  callback.current = onDone;
  const timer = useRef({ key, remaining: delay, done: false });
  if (timer.current.key !== key) timer.current = { key, remaining: delay, done: false };

  useEffect(() => {
    const target = document.querySelector(selector);
    setInView(false);
    const observer = new IntersectionObserver(entries => setInView(entries[0].isIntersecting && entries[0].intersectionRatio >= 0.15), { threshold: 0.15 });
    if (target) observer.observe(target);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, [selector, key, active]);

  useEffect(() => {
    const state = timer.current;
    if (!active || !inView || !pageVisible || state.done) return;
    const started = performance.now();
    const timeout = window.setTimeout(() => {
      state.done = true;
      callback.current();
    }, state.remaining);
    return () => {
      window.clearTimeout(timeout);
      if (!state.done) state.remaining = Math.max(0, state.remaining - (performance.now() - started));
    };
  }, [key, active, inView, pageVisible]);
}
