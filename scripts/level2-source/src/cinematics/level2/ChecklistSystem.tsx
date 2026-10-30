import type { CSSProperties, ReactNode } from 'react';
import { checklistPresentation } from './checklistPresentation';
import './checklist.css';

export type ChecklistCount = 3 | 6 | 10 | 25 | 100;
export type ChecklistMode = 'complete' | 'criteria-management' | 'optimization';

export interface ChecklistSystemProps {
  count: ChecklistCount;
  mode: ChecklistMode;
  labels?: readonly string[];
  progress: number;
  allComplete?: boolean;
  reducedMotion?: boolean;
  /** Optional cinematic prop, anchored to an actual checkbox (1-based). */
  markOverlay?: { criterion: number; content: ReactNode };
}

// These are presentation notes, never gameplay rules or result classifications.
const SAMPLE_REQUIREMENTS = [
  'Pre-class preparation',
  'In-class participation',
  'On-task focus',
  'Discussion quality',
  'Learning reflection',
  'Peer response',
] as const;

const EVIDENCE = [
  { id: 'E1', title: 'Discussion notes' },
  { id: 'E2', title: 'Reflection draft' },
  { id: 'E3', title: 'Peer response' },
] as const;

const number = (value: number) => String(value).padStart(2, '0');

/** A frame/progress-controlled paper prop. It owns no clock or gameplay state. */
export function ChecklistSystem({
  count,
  mode,
  labels,
  progress,
  allComplete = false,
  reducedMotion = false,
  markOverlay,
}: ChecklistSystemProps) {
  const safeProgress = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const { checked, targets, linkProgress, markProgress } = checklistPresentation(count, safeProgress, allComplete);
  const completed = checked.size;
  const remaining = count - completed;
  const dense = count >= 25;
  const columns = count === 100 ? 5 : count === 25 ? 3 : 1;
  const rowsPerColumn = Math.ceil(count / columns);
  const current = targets[0] ?? -1;
  const evidenceFor = (index: number) => EVIDENCE[index % EVIDENCE.length];
  const currentEvidence = evidenceFor(Math.max(0, current));
  const groupTitles = count === 100
    ? ['Explain', 'Connect', 'Reflect', 'Respond', 'Evidence']
    : ['Discussion', 'Reflection', 'Peer learning'];
  const title = mode === 'optimization'
    ? 'Coverage map'
    : mode === 'criteria-management'
      ? 'Evidence & criteria'
      : 'Learning requirements';
  const strategy = mode === 'optimization'
    ? 'Reuse existing evidence · close the next gap'
    : mode === 'criteria-management'
      ? 'One piece of evidence → several criteria'
      : count === 10
        ? 'Complete each requirement'
        : 'Check each requirement';
  const accessibleDescription = `${count} learning requirements. ${completed} complete, ${remaining} remaining. ${
    allComplete || remaining === 0
      ? 'All requirements are marked complete.'
      : mode === 'optimization'
        ? 'Alex reuses existing evidence to close remaining gaps efficiently.'
        : mode === 'criteria-management'
          ? 'Alex groups criteria and connects one evidence item to several requirements.'
          : 'Alex checks the next unfinished requirement.'
  }`;

  return (
    <div
      className={`l2-checklist l2-checklist--${count} l2-checklist--${mode}${reducedMotion ? ' l2-checklist--reduced' : ''}${remaining === 0 ? ' l2-checklist--finished' : ''}`}
      role="img"
      aria-label={accessibleDescription}
      data-count={count}
      data-completed={completed}
      style={{ '--l2-checklist-columns': columns, '--l2-checklist-rows': rowsPerColumn } as CSSProperties}
    >
      <div className="l2-checklist-paper" aria-hidden="true">
        <div className="l2-checklist-punched"><i /><i /><i /></div>
        <header className="l2-checklist-header">
          <div>
            <p className="l2-checklist-overline">Alex · working notes</p>
            <h3>{title}</h3>
          </div>
          <div className="l2-checklist-tally"><strong>{number(completed)}</strong><span>/ {number(count)}</span></div>
        </header>

        {dense && (
          <div className="l2-checklist-evidence">
            <span className="l2-checklist-margin-note">same evidence</span>
            <div className="l2-checklist-evidence-strip">
              {EVIDENCE.map(evidence => (
                <span key={evidence.id} className={`l2-checklist-evidence-slip${targets.some(index => evidenceFor(index).id === evidence.id) && remaining > 0 ? ' is-current' : ''}`}>
                  <b>{evidence.id}</b><span>{evidence.title}</span>
                </span>
              ))}
            </div>
            <svg className="l2-checklist-links" viewBox="0 0 100 14" preserveAspectRatio="none">
              {targets.map(index => {
                const from = 17 + (index % 3) * 33;
                const to = (Math.floor(index / rowsPerColumn) + 0.5) / columns * 100;
                return <path key={index} className="l2-checklist-link-primary" data-link-target={index + 1} d={`M${from} 1 C${from} 7 ${to} 7 ${to} 13`} pathLength={1} strokeDasharray="1" strokeDashoffset={reducedMotion ? 0 : 1 - linkProgress} />;
              })}
            </svg>
          </div>
        )}

        <div className="l2-checklist-grid">
          {Array.from({ length: columns }, (_, column) => {
            const start = column * rowsPerColumn;
            const length = Math.min(rowsPerColumn, count - start);
            return (
              <section className="l2-checklist-group" key={column}>
                {dense && <h4><span>{number(column + 1)}</span>{groupTitles[column]}</h4>}
                <div className="l2-checklist-rows">
                  {Array.from({ length }, (_, offset) => {
                    const index = start + offset;
                    const done = checked.has(index);
                    const active = targets.includes(index);
                    const evidence = evidenceFor(index);
                    const label = labels?.[index] ?? (dense
                      ? `Criterion ${number(index + 1)}`
                      : count === 10
                        ? `Requirement ${number(index + 1)}`
                        : SAMPLE_REQUIREMENTS[index % SAMPLE_REQUIREMENTS.length]);
                    return (
                      <div
                        key={index}
                        className={`l2-checklist-row${done ? ' is-checked' : ''}${active ? ' is-next' : ''}`}
                        data-criterion={index + 1}
                      >
                        <span className="l2-checklist-box">
                          {(done || active) && <svg viewBox="0 0 20 20"><path d="M3 10.5 8 15 18 3" pathLength={1} strokeDasharray="1" strokeDashoffset={done ? 0 : reducedMotion ? 1 : 1 - markProgress} /></svg>}
                          {markOverlay?.criterion === index + 1 && markOverlay.content}
                        </span>
                        <span className="l2-checklist-row-label">{label}</span>
                        {dense && <span className={`l2-checklist-evidence-ref${active ? ' is-linking' : ''}`}>{done || active ? evidence.id : '·'}</span>}
                        {!dense && active && <span className="l2-checklist-next-mark">←</span>}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="l2-checklist-footer">
          <p>{remaining === 0 ? 'Every requirement covered.' : strategy}</p>
          {dense && remaining > 0 && (
            <div className="l2-checklist-gap-note">
              <span><b>{remaining}</b> gaps</span>
              <span className="l2-checklist-gap-action">{currentEvidence.id} → {number(current + 1)}</span>
              {mode === 'optimization' && <span>new evidence: <b>0</b></span>}
            </div>
          )}
          {remaining === 0 && <span className="l2-checklist-finished-mark">✓</span>}
        </footer>
      </div>
    </div>
  );
}
