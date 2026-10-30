import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../../../shared/components/Icon';

const steps = [
  { selector: '.metric-grid, .decision-area', title: 'Your decisions', text: 'Choose a metric, predict what will happen, then run your experiment.' },
  { selector: '.university', title: 'Management’s view', text: 'This card shows how satisfied management is with the reported results.' },
  { selector: '.student', title: 'The students’ view', text: 'Observe the classroom to discover how students respond.' },
  { selector: '.dialogue-strip', title: 'The conversation', text: 'Your conversation with Alex appears here. New replies appear one at a time.' },
];

type Box = { top: number; left: number; width: number; height: number };

export default function WorkbenchGuide({ onClose, assessmentReport = false }: { onClose: () => void; assessmentReport?: boolean }) {
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dialog = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const text = assessmentReport && step === 0
    ? 'Choose what earns marks, predict how students will respond, then view the assessment report.'
    : assessmentReport && step === 3
    ? 'Look behind the report to see how students responded in class.'
    : steps[step].text;

  useEffect(() => {
    const modal = dialog.current;
    modal?.showModal();
    next.current?.focus({ preventScroll: true });
    return () => { if (modal?.open) modal.close(); };
  }, []);

  useLayoutEffect(() => {
    // Prefer the metric grid on the first visit; fall back to the decision area
    // when a player reopens the guide later in the level.
    const selector = step === 0 && document.querySelector('.metric-grid')
      ? (window.innerWidth < 600 ? '.metric-card' : '.metric-grid') : steps[step].selector;
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) return;
    const update = () => {
      const rect = target.getBoundingClientRect();
      const padding = 7;
      const bounds = {
        top: Math.max(5, rect.top - padding), left: Math.max(5, rect.left - padding),
        width: Math.min(window.innerWidth - 10, rect.width + padding * 2),
        height: Math.min(window.innerHeight - 10, rect.height + padding * 2),
      };
      setBox(bounds);
      const width = Math.min(310, window.innerWidth - 28);
      const height = card.current?.offsetHeight || 205;
      const gap = 18;
      let left = rect.left;
      let top = rect.bottom + gap;
      if (rect.left >= width + gap + 14) {
        left = rect.left - width - gap;
        top = rect.top;
      } else if (window.innerWidth - rect.right >= width + gap + 14) {
        left = rect.right + gap;
        top = rect.top;
      } else if (top + height > window.innerHeight - 14) {
        top = rect.top - height - gap;
      }
      setPosition({ left: Math.max(14, Math.min(left, window.innerWidth - width - 14)), top: Math.max(14, Math.min(top, window.innerHeight - height - 14)) });
    };
    target.scrollIntoView({ block: 'center', behavior: 'instant' });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(target);
    if (card.current) observer.observe(card.current);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    next.current?.focus({ preventScroll: true });
    return () => { observer.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [step]);

  return <dialog ref={dialog} className="workbench-guide" aria-label="Workbench guide" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
  }}>
    {box && <div className="guide-spotlight" style={box} aria-hidden="true" />}
    <div ref={card} className="guide-card" style={position}>
      <div className="guide-top"><span className="eyebrow">QUICK GUIDE · {step + 1} / {steps.length}</span><button className="text-button" onClick={onClose}>Skip guide</button></div>
      <h2>{steps[step].title}</h2>
      <p>{text}</p>
      <div className="guide-actions"><div className="guide-dots" aria-hidden="true">{steps.map((_, index) => <i key={index} className={index === step ? 'active' : ''} />)}</div>{step > 0 && <button className="back-button" onClick={() => setStep(value => value - 1)}>Back</button>}<button ref={next} className="button primary-button" onClick={() => step === steps.length - 1 ? onClose() : setStep(value => value + 1)}>{step === steps.length - 1 ? 'Start Level 1' : 'Next'}<Icon name="arrow" /></button></div>
    </div>
  </dialog>;
}
