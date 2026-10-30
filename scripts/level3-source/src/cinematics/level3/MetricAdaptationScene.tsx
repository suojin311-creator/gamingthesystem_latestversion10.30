import { useId, type CSSProperties } from 'react';
import type { Intensity, MetricId } from '../../shared/contracts';
import { CinematicCamera } from '../shared/engine/CinematicCamera/CinematicCamera';
import { DialogueLayer } from '../shared/engine/DialogueLayer/DialogueLayer';
import { EnvironmentMotion } from '../shared/engine/EnvironmentMotion/EnvironmentMotion';
import { clamp01 } from '../shared/engine/timeline/animationMath';
import { DIALOGUE, INTENSITIES, participationBeat, reflectionText, storyboardId, type AdaptationClip } from './adaptationTimeline';
import preparation from '../../../docs/visual-style/references/level3-metric-adaptations/REF-L3A-001.png';
import participation from '../../../docs/visual-style/references/level3-metric-adaptations/REF-L3A-002.png';
import focus from '../../../docs/visual-style/references/level3-metric-adaptations/REF-L3A-003.png';
import discussion from '../../../docs/visual-style/references/level3-metric-adaptations/REF-L3A-004.png';
import reflection from '../../../docs/visual-style/references/level3-metric-adaptations/REF-L3A-005.png';
import peer from '../../../docs/visual-style/references/level3-metric-adaptations/REF-L3A-006.png';
import highFocus from '../../../docs/visual-style/references/level3-metric-adaptations/REF-L3A-S10 — High On-Task Focus.png';
import classroom from '../../../assets/backgrounds/BG-002 — Classroom First-Person Background.png';
import readingProp from '../../../assets/props/PROP-L1-001 — Checklist : Reading Sheet.png?inline';
import discussionProp from '../../../assets/props/PROP-L1-003 — Discussion Sentence-Stem Card.png';
import './level3a.css';

type Rect = readonly [number, number, number, number];
type ArtSource = { url: string; width: number; height: number; crop: Rect };
const SOURCES: Record<MetricId, string> = {
  'pre-class-preparation': preparation, 'in-class-participation': participation,
  'on-task-focus': focus, 'in-class-discussion-quality': discussion,
  'learning-reflection-quality': reflection, 'online-peer-response-quality': peer,
};

/** A viewport into ONE approved panel. Original raster files are never altered.
 * The crop excludes the board's Low/Medium/High captions and adjacent states.
 * Cuts between complete poses are editorial cuts, never a claimed limb rig. */
function panel(metric: MetricId, state: Intensity, local: Rect): ArtSource {
  const width = metric === 'in-class-participation' ? 1923 : 2066;
  const height = metric === 'in-class-participation' ? 818 : 761;
  const panelWidth = width / 3;
  return { url: SOURCES[metric], width, height,
    crop: [INTENSITIES.indexOf(state) * panelWidth + local[0], local[1], local[2], local[3]] };
}

export function ArtFrame({ source, className = '', style }: { source: ArtSource; className?: string; style?: CSSProperties }) {
  const id = useId();
  const [x, y, w, h] = source.crop;
  return <svg className={`l3a-art ${className}`} viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio={className.includes('l3a-actor-frame') ? 'xMidYMid meet' : 'xMidYMid slice'} style={style} aria-hidden="true">
    <defs><clipPath id={id}><rect x={x} y={y} width={w} height={h} /></clipPath></defs>
    <image href={source.url} width={source.width} height={source.height} clipPath={`url(#${id})`} />
  </svg>;
}

export function ClassroomAnchor({ time, reduced }: { time: number; reduced: boolean }) {
  return <CinematicCamera pose={{ scale: reduced ? 1 : 1.02 + Math.min(time, 3) * 0.008, x: 0, y: 0, vignette: 0.3 }}>
    <img className="l3a-background" src={classroom} alt="Warm late-afternoon light across the university classroom." />
    <EnvironmentMotion progress={reduced ? 0 : time / 24} seed={31} />
  </CinematicCamera>;
}

export function AlexPriorityAnchor({ time, reduced }: { time: number; reduced: boolean }) {
  return <CinematicCamera pose={{ scale: reduced ? 1 : 1 + Math.min(time, 3) * 0.01, x: 0, y: 0, vignette: 0.25 }}>
    <ArtFrame source={{ url: highFocus, width: 1672, height: 940, crop: [0, 0, 1672, 940] }} />
    <EnvironmentMotion progress={reduced ? 0 : time / 24} seed={31} />
  </CinematicCamera>;
}

export function preloadAdaptationArt() {
  return Promise.all([...Object.values(SOURCES), highFocus, classroom, readingProp, discussionProp].map(url => {
    const image = new Image(); image.src = url; return image.decode();
  }));
}

function Criteria({ items, checked, active }: { items: readonly string[]; checked: number; active?: number }) {
  return <ul className="l3a-criteria">{items.map((item, i) => <li key={item} className={active === i ? 'is-reading' : ''}>
    <span className={i < checked ? 'is-checked' : ''} aria-label={i < checked ? 'checked' : 'unchecked'}>{i < checked ? '✓' : '□'}</span>{item}
  </li>)}</ul>;
}

function DeskScreen({ children, title, className = '' }: { children: React.ReactNode; title: string; className?: string }) {
  return <div className={`l3a-monitor ${className}`}>
    <div className="l3a-monitor-bezel"><div className="l3a-screen-top"><i /><span>COURSE WORKSPACE</span><span>— &nbsp; ×</span></div>
      <div className="l3a-screen"><header>{title}</header>{children}</div>
    </div><div className="l3a-laptop-base" />
  </div>;
}

function Preparation({ intensity, time }: { intensity: Intensity; time: number }) {
  const closed = intensity === 'Low' && time > 2.2;
  const scroll = intensity === 'Low' ? 0 : clamp01((time - 1.1) / 1.7) * 38;
  return <div className="l3a-desk-insert" data-action={closed ? 'reading-closed' : intensity === 'High' ? 'checking-preparation' : 'reading'}>
    <DeskScreen title={closed ? 'Course materials' : 'Before class · Reading'}>
      {closed ? <div className="l3a-closed-page"><span>Reading</span><p>The role of feedback in learning</p><span className="l3a-open-link">Open reading ↗</span></div>
        : <div className="l3a-reading-viewport"><article style={{ transform: `translateY(-${scroll}%)` }}>
          <h3>The role of feedback in learning</h3><p>Feedback helps us notice the gap between an explanation and the evidence supporting it.</p>
          <p>A useful comment identifies a particular point and suggests a concrete next step.</p>
          <h4>Think about your last discussion</h4><p>Which comment helped your group develop its explanation? Record one example and explain why it helped.</p>
          {intensity !== 'Low' && <p className="l3a-highlight">Connect your observation to the reading.</p>}
        </article></div>}
      {!closed && <div className="l3a-pointer" style={{ top: intensity === 'Low' ? '9%' : `${38 + scroll / 2}%`, right: intensity === 'Low' ? '4%' : '9%' }}>↖</div>}
    </DeskScreen>
    {intensity !== 'Low' && <div className={`l3a-paper l3a-preparation-paper ${intensity === 'High' ? 'l3a-paper-stack' : ''}`}>
      <small>PREPARATION NOTES</small>
      <p>{time > 1.3 ? 'A useful comment gives a next step.' : 'A useful comment…'}</p>
      <Criteria items={intensity === 'High' ? ['Read the material', 'Explain a key idea', 'Connect an example', 'Review preparation requirements'] : ['Read the material', 'Complete the preparation task']}
        checked={Math.floor(clamp01((time - 0.9) / 2.6) * (intensity === 'High' ? 4 : 2))} />
    </div>}
  </div>;
}

function Reflection({ intensity, time }: { intensity: Intensity; time: number }) {
  const submitted = intensity === 'Low' && time >= 1.8;
  const criterion = time < 1.45 ? 0 : time < 2.6 ? 1 : 2;
  return <div className="l3a-desk-insert" data-action={submitted ? 'reflection-submitted' : intensity === 'High' ? 'rubric-edit' : 'reflection-writing'}>
    <DeskScreen title="Learning reflection" className={intensity === 'High' ? 'l3a-with-rubric' : ''}>
      <div className="l3a-editor-label">What changed your understanding today?</div>
      <div className={`l3a-editor ${submitted ? 'is-submitted' : ''}`}>
        {reflectionText(intensity, time)}{!submitted && <span className="l3a-caret" style={{ opacity: Math.floor(time * 3) % 2 ? 0.2 : 1 }}>|</span>}
      </div>
      <div className="l3a-editor-footer"><span>Reflection</span><span className="l3a-submit">{submitted ? 'Submitted' : 'Submit'}</span></div>
    </DeskScreen>
    {intensity === 'High' && <div className="l3a-paper l3a-rubric">
      <small>REFLECTION RUBRIC</small><Criteria items={['Explain a changed idea', 'Support it with an example', 'Identify a next step']} active={criterion} checked={time < 1.2 ? 0 : time < 2.35 ? 1 : time < 3.5 ? 2 : 3} />
    </div>}
  </div>;
}

function PeerResponse({ intensity, time }: { intensity: Intensity; time: number }) {
  const post = intensity === 'High' ? Math.min(2, Math.floor(Math.max(0, time - 0.45) / 1.15)) : 0;
  const names = ['Jamie', 'Morgan', 'Riley'];
  const posts = ['Our group revised its explanation after comparing examples. Feedback helped us see a missing connection.', 'A specific question helped me explain my idea more clearly. I want to try this in our next discussion.', 'We compared two different answers. The comparison made us reconsider our first explanation.'];
  const response = intensity === 'Low' ? 'Nice work!' : intensity === 'Medium' ? 'Maybe you could add an example.' : ['Your comparison makes the change clear. Could you add the two examples?', 'Your question helped clarify the idea. Try including the question itself.', 'The contrasting answers are useful. Could you explain what changed your view?'][post];
  const start = intensity === 'Low' ? 0.35 : intensity === 'Medium' ? 1.65 : 0.55 + post * 1.15;
  const submitted = intensity === 'Low' ? time > 1.15 : intensity === 'Medium' ? time > 3.65 : time > start + 0.8;
  return <div className="l3a-desk-insert" data-action={submitted ? 'reply-posted' : 'read-and-respond'}>
    <DeskScreen title="Class discussion forum">
      {intensity === 'High' && <nav className="l3a-post-tabs">{names.map((n, i) => <span key={n} className={post === i ? 'active' : ''}>{n}</span>)}</nav>}
      <div className="l3a-peer-post"><b>{names[post]}</b><p>{posts[post]}</p></div>
      <div className="l3a-editor-label">Your response</div>
      <div className="l3a-editor l3a-reply">{response.slice(0, Math.floor(Math.max(0, time - start) * (intensity === 'High' ? 150 : 65)))}<span className="l3a-caret">{submitted ? '' : '|'}</span></div>
      <div className="l3a-editor-footer"><span>{submitted ? 'Response posted' : 'Draft'}</span><span className="l3a-submit">{submitted ? 'Posted' : 'Post reply'}</span></div>
    </DeskScreen>
    {intensity === 'High' && <div className="l3a-paper l3a-rubric"><small>RESPONSE CRITERIA</small>
      <Criteria items={['Specific feedback', 'A useful suggestion']} checked={Math.min(2, Math.floor(Math.max(0, time - start) * 3))} />
      <div className="l3a-post-progress">{names.map((n, i) => <span key={n}>{i < post ? '✓ ' : '· '}{n}</span>)}</div>
    </div>}
  </div>;
}

function DiscussionCard({ time }: { time: number }) {
  return <div className="l3a-paper l3a-stem-card" data-action="consult-sentence-stem">
    <small>DISCUSSION SENTENCE STEMS</small><h3>Build on an idea</h3>
    <p className={time < 2.8 ? 'l3a-phrase-active' : ''}>I’d like to build on your point.</p>
    <h3>Ask for clarification</h3><p className={time >= 2.8 ? 'l3a-phrase-active' : ''}>Could you elaborate?</p>
  </div>;
}

function FocusTask({ time }: { time: number }) {
  return <DeskScreen title="Class task" className="l3a-focus-task"><div className="l3a-editor-label">Explain your group’s idea</div>
    <div className="l3a-editor">{'Our example shows how specific feedback helps the group develop an explanation.'.slice(0, Math.floor(Math.max(0, time - 1.5) * 37))}<span className="l3a-caret">|</span></div>
  </DeskScreen>;
}

export type MetricSceneProps = AdaptationClip & { time: number; reducedMotion?: boolean; hideDialogue?: boolean };

export function MetricAdaptationScene({ metric, intensity, time: rawTime, reducedMotion = false, hideDialogue = false }: MetricSceneProps) {
  const time = Math.max(0, Math.min(4, rawTime));
  let source = panel(metric, intensity, [8, 80, 670, 377]);
  let beat = 'establish';
  const desk = ['pre-class-preparation', 'learning-reflection-quality', 'online-peer-response-quality'].includes(metric);
  if (metric === 'in-class-participation') {
    beat = participationBeat(intensity, time);
    source = panel(metric, beat === 'listen' ? 'Low' : intensity === 'Low' ? 'Medium' : intensity,
      beat === 'listen' ? [8, 150, 625, 352] : beat === 'raise' ? [100, 0, 420, 236] : beat === 'reaction' ? [388, 260, 240, 135] : [145, 210, 420, 236]);
  } else if (metric === 'on-task-focus') {
    if (intensity === 'High') {
      beat = 'sustained-attention'; source = { url: highFocus, width: 1672, height: 940, crop: [0, 0, 1672, 940] };
    } else {
      const phone = intensity === 'Low' ? time >= 0.75 && time < 1.85 : time < 0.65;
      beat = phone ? 'phone-glance' : intensity === 'Medium' ? 'phone-away-working' : 'return-to-task';
      source = panel(metric, phone ? 'Low' : 'Medium', phone ? [230, 310, 440, 248] : [8, 85, 670, 377]);
    }
  } else if (metric === 'in-class-discussion-quality') {
    beat = time < 0.8 ? 'listen-to-peer' : intensity === 'High' && time >= 1.5 && time < 2.7 ? 'consult-card' : 'respond-to-peer';
    source = panel(metric, time < 0.8 ? 'Low' : intensity,
      time < 0.8 ? [10, 180, 350, 197] : intensity === 'High' ? [95, 130, 560, 315] : [110, 170, 560, 315]);
    if (beat === 'consult-card') source = { url: discussionProp, width: 1536, height: 1024, crop: [35, 90, 800, 450] };
  } else if (desk) {
    beat = time < 0.65 ? 'establish' : 'work-insert';
    if (metric === 'pre-class-preparation' && intensity === 'High' && time < 0.65) {
      source = { url: classroom, width: 1672, height: 940, crop: [0, 0, 1672, 940] }; beat = 'early-classroom';
    } else if (metric === 'pre-class-preparation' && intensity !== 'Low' && time > 3.2) {
      source = { url: readingProp, width: 1536, height: 1024, crop: [15, 175, 920, 518] }; beat = 'notes-insert';
    } else {
      // Tight actor crop excludes the generated LMS text on the reference boards.
      source = panel(metric, intensity, metric === 'pre-class-preparation'
        ? intensity === 'Low' ? [275, 55, 390, 570] : intensity === 'Medium' ? [95, 55, 345, 570] : [120, 50, 430, 575]
        : intensity === 'High' && metric === 'learning-reflection-quality' ? [205, 65, 260, 560]
        : intensity === 'High' && metric === 'online-peer-response-quality' ? [5, 135, 245, 490] : [10, 55, 325, 570]);
    }
  }
  const travel = reducedMotion ? 0 : time / 4;
  const dialogueVisible = !hideDialogue && time >= 0.6;
  const actorCrop = desk && beat !== 'early-classroom' && beat !== 'notes-insert';
  const actorWidth = source.crop[2] / source.crop[3] * 53.4375;
  return <section className={`l3a-scene l3a-metric-${metric} ${desk ? 'l3a-desk-scene' : ''} ${reducedMotion ? 'l3a-reduced' : ''}`}
    aria-label={`${metric} — ${intensity} adaptation`} data-metric={metric} data-intensity={intensity} data-storyboard={storyboardId({ metric, intensity })} data-beat={beat}>
    <CinematicCamera pose={{ scale: 1 + travel * (metric === 'on-task-focus' ? 0.045 : 0.022), x: desk ? -travel * 0.5 : travel * 0.3, y: 0, vignette: 0.28 }}>
      {desk && <ArtFrame source={source} className="l3a-world-wash" />}
      <ArtFrame source={source} className={actorCrop ? 'l3a-actor-frame' : ''}
        style={actorCrop ? { width: `${actorWidth}%`, height: '95%', left: `${(55 - actorWidth) / 2}%`, top: '2.5%' } : undefined} />
      <div className="l3a-warm-light" style={{ opacity: reducedMotion ? 0.1 : 0.08 + Math.sin(time * 0.6) * 0.03 }} />
      <EnvironmentMotion progress={reducedMotion ? 0 : time / 19} seed={36 + INTENSITIES.indexOf(intensity)} style={{ opacity: 0.65 }} />
      <div className="l3a-dust" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ left: `${14 + i * 17}%`, top: `${15 + ((i * 23) % 60)}%`, transform: `translate(${travel * (i + 2) * 4}px, ${-travel * (i + 4) * 3}px)`, opacity: 0.12 + i * 0.035 }} />)}</div>
      {metric === 'pre-class-preparation' && <Preparation intensity={intensity} time={time} />}
      {metric === 'learning-reflection-quality' && <Reflection intensity={intensity} time={time} />}
      {metric === 'online-peer-response-quality' && <PeerResponse intensity={intensity} time={time} />}
      {metric === 'in-class-discussion-quality' && intensity === 'High' && time >= 1.5 && <DiscussionCard time={time} />}
      {metric === 'on-task-focus' && intensity !== 'High' && beat !== 'phone-glance' && time > 1.85 && <FocusTask time={time} />}
    </CinematicCamera>
    <div className="l3a-foreground" aria-hidden="true" style={{ transform: `translateX(${-travel * 7}px)` }} />
    {dialogueVisible && <DialogueLayer style={{ bottom: '6%', left: '9%', right: '9%', fontFamily: 'Georgia, serif', fontSize: 'clamp(15px, 2.1cqw, 30px)', lineHeight: 1.45 }}>{DIALOGUE[metric][intensity]}</DialogueLayer>}
  </section>;
}
