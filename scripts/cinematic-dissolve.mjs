// Freeze the outgoing frame while the live scene changes underneath it. A closed
// shadow root isolates SVG IDs/styles and keeps the snapshot out of scene queries.
// This avoids inserting a black frame, moving cameras or mounting a second player.
export function dissolveFrame(root, commit, { duration = 480, reducedMotion = false } = {}) {
  if (!root || reducedMotion) {
    commit();
    return { finished: Promise.resolve(), cancel() {}, pause() {}, play() {} };
  }
  const rect = root.getBoundingClientRect();
  const host = document.createElement('div');
  host.dataset.cinematicDissolve = 'outgoing';
  host.setAttribute('aria-hidden', 'true');
  host.inert = true;
  Object.assign(host.style, { position: 'fixed', left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px', overflow: 'hidden', zIndex: '2147483646', pointerEvents: 'none' });
  const shadow = host.attachShadow({ mode: 'closed' });
  for (const style of document.querySelectorAll('style,link[rel=stylesheet]')) shadow.appendChild(style.cloneNode(true));
  const canvas = document.createElement('div');
  const width = root.offsetWidth || rect.width, height = root.offsetHeight || rect.height;
  Object.assign(canvas.style, { position: 'relative', width: width + 'px', height: height + 'px', transformOrigin: '0 0', transform: `scale(${rect.width / width},${rect.height / height})` });
  const frozen = root.cloneNode(true);
  Object.assign(frozen.style, { margin: '0', position: 'relative', inset: 'auto', width: '100%', height: '100%' });
  canvas.appendChild(frozen); shadow.appendChild(canvas); document.body.appendChild(host);
  let animation, cancelled = false, paused = document.hidden;
  let resolve;
  const finished = new Promise(done => { resolve = done; });
  const dispose = () => { host.remove(); document.removeEventListener('visibilitychange', visibility); resolve(); };
  const visibility = () => { paused = document.hidden; if (paused) animation?.pause(); else animation?.play(); };
  document.addEventListener('visibilitychange', visibility);
  commit();
  // React gets two paint opportunities to commit the decoded incoming frame.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (cancelled) return;
    animation = host.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    if (paused) animation.pause();
    animation.finished.then(dispose, dispose);
  }));
  return { finished,
    cancel() { cancelled = true; animation?.cancel(); dispose(); },
    pause() { paused = true; animation?.pause(); },
    play() { paused = document.hidden; if (!paused) animation?.play(); },
  };
}

export const smoothstep = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
