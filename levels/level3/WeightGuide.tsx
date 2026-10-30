import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../../shared/components/Icon';
import './guide.css';

const STEPS = [
  { title: 'Move a slider', text: 'Start with any slider. The other two share what remains of your 100%. Nothing is confirmed yet.' },
  { title: 'Confirm the weight', text: 'Sliding changes the number. Click Confirm weight to lock the value you want to keep.' },
  { title: 'Set the remaining pair', text: 'You can adjust either remaining slider. Confirm one, and both values are locked together.' },
  { title: 'Watch what happens', text: 'Once all three are confirmed, run the evaluation. Then choose Observe the class to see Alex’s response.' },
];

type Box = { top: number; left: number; width: number; height: number };
type Position = { top: number; left: number };
const MARGIN = 14;
const GAP = 16;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));

function union(elements: HTMLElement[]): Box {
  const rects = elements.map(element => element.getBoundingClientRect());
  const top = Math.min(...rects.map(rect => rect.top));
  const left = Math.min(...rects.map(rect => rect.left));
  return { top, left, width: Math.max(...rects.map(rect => rect.right)) - left, height: Math.max(...rects.map(rect => rect.bottom)) - top };
}

function controls(root: HTMLElement, step: number): HTMLElement[] {
  const cards = [...root.querySelectorAll<HTMLElement>('.l3-weight-card')];
  const unlocked = cards.filter(card => card.dataset.confirmed !== 'true');
  if (step === 3) {
    const action = root.querySelector<HTMLElement>('.l3-run-action .primary-button');
    return action ? [action] : [];
  }
  if (step === 2) {
    // On a narrow screen the two cards stack. Spotlight one pair of controls
    // instead of a tall rectangle that would cover the entire viewport.
    const remaining = unlocked.length === 2 ? unlocked : cards.slice(1);
    const visibleCards = window.innerWidth >= 700 ? remaining : remaining.slice(0, 1);
    return visibleCards.flatMap(card => [...card.querySelectorAll<HTMLElement>('input[type="range"], button')]);
  }
  const card = unlocked[0] || cards[0];
  const target = card?.querySelector<HTMLElement>(step === 0 ? 'input[type="range"]' : 'button');
  return target ? [target] : [];
}

function positionCard(target: Box, width: number, height: number, viewport: { width: number; height: number }): Position {
  const candidates: Position[] = [
    { left: target.left, top: target.top + target.height + GAP },
    { left: target.left, top: target.top - height - GAP },
    { left: target.left + target.width + GAP, top: target.top },
    { left: target.left - width - GAP, top: target.top },
  ];
  const score = ({ left, top }: Position) => {
    const overlapWidth = Math.max(0, Math.min(left + width, target.left + target.width + 7) - Math.max(left, target.left - 7));
    const overlapHeight = Math.max(0, Math.min(top + height, target.top + target.height + 7) - Math.max(top, target.top - 7));
    return overlapWidth * overlapHeight;
  };
  return candidates.map(candidate => ({
    left: clamp(candidate.left, MARGIN, viewport.width - width - MARGIN),
    top: clamp(candidate.top, MARGIN, viewport.height - height - MARGIN),
  })).reduce((best, candidate) => score(candidate) < score(best) ? candidate : best);
}

export default function WeightGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [position, setPosition] = useState<Position>({ top: MARGIN, left: MARGIN });
  const dialog = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const modal = dialog.current;
    const root = modal?.closest<HTMLElement>('.level-three');
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!modal) return;
    modal.showModal();
    next.current?.focus({ preventScroll: true });
    return () => {
      if (modal.open) modal.close();
      const available = (element: HTMLElement | null | undefined) => element?.isConnected && !element.matches(':disabled, [inert]');
      const fallback = root?.querySelector<HTMLElement>('.l3-weight-card input:not(:disabled), .guide-button, .l3-run-action button:not(:disabled)');
      const restore = available(previous) && previous?.matches('button, input, select, textarea, a[href]') ? previous : fallback;
      if (available(restore)) restore?.focus({ preventScroll: true });
    };
  }, []);

  useLayoutEffect(() => {
    const root = dialog.current?.closest<HTMLElement>('.level-three');
    if (!root) return;
    const targets = controls(root, step);
    if (!targets.length) return;
    let frame = 0;
    const update = () => {
      const currentTargets = controls(root, step);
      if (!currentTargets.length) return;
      const rect = union(currentTargets);
      const viewport = { width: document.documentElement.clientWidth, height: window.innerHeight };
      const bounds = {
        top: clamp(rect.top - 7, 5, viewport.height - 6),
        left: clamp(rect.left - 7, 5, viewport.width - 6),
        width: Math.max(1, Math.min(viewport.width - 5, rect.left + rect.width + 7) - Math.max(5, rect.left - 7)),
        height: Math.max(1, Math.min(viewport.height - 5, rect.top + rect.height + 7) - Math.max(5, rect.top - 7)),
      };
      setBox(previous => previous && Object.keys(bounds).every(key => previous[key as keyof Box] === bounds[key as keyof Box]) ? previous : bounds);
      const width = card.current?.offsetWidth || Math.min(332, viewport.width - MARGIN * 2);
      const height = card.current?.offsetHeight || 240;
      const nextPosition = positionCard(rect, width, height, viewport);
      setPosition(previous => previous.left === nextPosition.left && previous.top === nextPosition.top ? previous : nextPosition);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    // Scroll only when opening a step, never in response to resize/scroll or an
    // observer notification. This keeps the guide from fighting the player.
    targets[0].scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    update();
    next.current?.focus({ preventScroll: true });
    const observer = new ResizeObserver(scheduleUpdate);
    for (const target of targets) observer.observe(target);
    if (card.current) observer.observe(card.current);
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
    };
  }, [step]);

  // The browser keeps the rest of the workbench inert. Explicit wrapping also
  // makes Tab navigation consistent across the standalone HTML previews.
  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const buttons = [...modal.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const first = buttons[0];
      const last = buttons.at(-1);
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
    };
    modal.addEventListener('keydown', trapFocus);
    return () => modal.removeEventListener('keydown', trapFocus);
  }, []);

  return <dialog ref={dialog} className="l3-weight-tour" data-step={step} data-ready={!!box} aria-label="Weight guide" aria-describedby="weight-guide-instruction" onCancel={event => { event.preventDefault(); onClose(); }}>
    {box && <div className="l3-tour-spotlight" style={box} aria-hidden="true" />}
    <div ref={card} className="l3-tour-card" style={position}>
      <div className="l3-tour-top"><span className="eyebrow">QUICK GUIDE · {step + 1} / {STEPS.length}</span><button className="text-button" onClick={onClose}>Skip guide</button></div>
      <div id="weight-guide-instruction" aria-live="polite" aria-atomic="true"><h2>{STEPS[step].title}</h2><p>{STEPS[step].text}</p></div>
      <div className="l3-tour-actions"><div className="l3-tour-dots" aria-hidden="true">{STEPS.map((_, index) => <i key={index} data-current={index === step} />)}</div>{step > 0 && <button className="text-button" onClick={() => setStep(value => value - 1)}>Back</button>}<button ref={next} className="button primary-button" onClick={() => step === STEPS.length - 1 ? onClose() : setStep(value => value + 1)}>{step === STEPS.length - 1 ? 'Try your weights' : 'Next'}<Icon name="arrow" /></button></div>
    </div>
  </dialog>;
}
