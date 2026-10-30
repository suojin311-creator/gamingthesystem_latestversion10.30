import type { CSSProperties, ReactNode } from 'react';
import { Img, interpolate } from 'remotion';
import type { MetricId } from '../../shared/contracts';
import { CinematicCamera } from '../shared/engine/CinematicCamera/CinematicCamera';
import { EnvironmentMotion } from '../shared/engine/EnvironmentMotion/EnvironmentMotion';
import { clamp01, pulse } from '../shared/engine/timeline/animationMath';
import { branches, LEVEL1 } from './level1Content';
import './branch.css';

type Point = readonly [number, number];
type Quad = readonly [Point, Point, Point, Point];

// Map a small HTML paper/screen onto the photographed prop's four corners.
// Coordinates belong to the unchanged 1672 × 941 reference plates, not the viewport.
function projectSurface(width: number, height: number, [a, b, c, d]: Quad): string {
  const dx1 = b[0] - c[0];
  const dx2 = d[0] - c[0];
  const dx3 = a[0] - b[0] + c[0] - d[0];
  const dy1 = b[1] - c[1];
  const dy2 = d[1] - c[1];
  const dy3 = a[1] - b[1] + c[1] - d[1];
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  return `matrix3d(${(b[0] - a[0] + g * b[0]) / width},${(b[1] - a[1] + g * b[1]) / width},0,${g / width},${(d[0] - a[0] + h * d[0]) / height},${(d[1] - a[1] + h * d[1]) / height},0,${h / height},0,0,1,0,${a[0]},${a[1]},0,1)`;
}

function Surface({ width, height, quad, className, children }: {
  width: number; height: number; quad: Quad; className: string; children: ReactNode;
}) {
  return <div className={`l1-prop-surface ${className}`} style={{ width, height, transform: projectSurface(width, height, quad) }}>{children}</div>;
}

function Check({ progress }: { progress: number }) {
  return <svg className="l1-ink-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5 10 19 21 4" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1 - clamp01(progress) }} /></svg>;
}

function Preparation({ seconds }: { seconds: number }) {
  return (
    <Surface width={440} height={310} quad={[[524, 565], [755, 488], [991, 653], [686, 748]]} className="l1-preparation-paper">
      <div className="l1-paper-rule">Pre-class preparation</div>
      {['Read Chapter 3', 'Watch the lecture', 'Complete the quiz', 'Write a short summary', 'Prepare two questions'].map((item, index) => (
        <div className="l1-paper-task" key={item}>
          <span className="l1-paper-box"><Check progress={index < 3 ? 1 : (seconds - (index === 3 ? 0.5 : 1.4)) / 0.5} /></span>
          <span>{item}</span>
        </div>
      ))}
      <div className="l1-paper-footer">Reading notes</div>
    </Surface>
  );
}

function Discussion({ seconds }: { seconds: number }) {
  const active = seconds < 2.15 ? 0 : seconds < 4.3 ? 1 : -1;
  return (
    <Surface width={310} height={266} quad={[[950, 421], [1151, 445], [1116, 614], [897, 591]]} className="l1-stem-paper">
      <div className="l1-paper-rule">Discussion sentence stems</div>
      {['Could you elaborate?', 'I’d like to build on that.', 'Could you give an example?', 'I see it differently because…'].map((text, index) => (
        <div className="l1-stem-line" key={text} style={{ backgroundColor: active === index ? '#c49b4529' : 'transparent' }}><span>•</span>{text}</div>
      ))}
      <div className="l1-card-rule" />
      <div className="l1-card-note">Listen · question · build</div>
    </Surface>
  );
}

function Focus({ seconds }: { seconds: number }) {
  // The laptop back faces the viewer. Keep the task on the existing projector,
  // rather than inventing a screen on the back of the laptop.
  return (
    <div className="l1-task-screen-mask">
      <Surface width={550} height={370} quad={[[1138, 45], [1672, -20], [1672, 337], [1138, 367]]} className="l1-projector l1-task-projector">
        <div className="l1-task-heading">In-class task <span>01 / 01</span></div>
        <h3>Read the case.</h3>
        <p>What do you notice?</p>
        <div className="l1-case-notes"><span>Case notes</span><i /><i /><i /></div>
        <span className="l1-task-cursor" style={{ translate: `${pulse(seconds, 1.3, 2.2, 3.9) * 4}px ${pulse(seconds, 6.7, 7.2, 8.1) * 2}px` }}>↖</span>
      </Surface>
    </div>
  );
}

function TypingCaret({ seconds }: { seconds: number }) {
  return <span className="l1-typing-caret" style={{ opacity: Math.floor(seconds * 1.9) % 2 === 0 ? 0.95 : 0.2 }} />;
}

function Reflection({ seconds }: { seconds: number }) {
  const snippets = ['Before, I thought…', 'Now, I think…', 'Evidence…', 'What changed…'];
  const responses = ['Learning was completing the task.', 'I can explain my understanding.', 'The activity shows my progress.', 'My thinking has developed.'];
  return (
    <Surface width={820} height={560} quad={[[889, 252], [1462, 263], [1403, 689], [813, 617]]} className="l1-learning-screen">
      <div className="l1-browser-strip"><i /><i /><i /><span>Learning space</span></div>
      <div className="l1-course-bar">Learning and Technology <span>Week 3</span></div>
      <div className="l1-reflection-page">
        <div className="l1-screen-sidebar"><strong>Course</strong><span>Overview</span><span>Resources</span><b>Reflection</b><span>Discussion</span></div>
        <div className="l1-reflection-main">
          <div className="l1-reflection-title"><h3>Learning reflection</h3><span>Draft saved</span></div>
          {snippets.map((prompt, index) => {
            const count = Math.max(0, Math.min(responses[index].length, Math.floor((Math.min(seconds, 5.7) - index * 0.95) * 24)));
            return <div className="l1-reflection-field" key={prompt}><label>{prompt}</label><div>{responses[index].slice(0, count)}{(seconds < 5.7 ? seconds >= index * 0.95 && seconds < (index + 1) * 0.95 : index === 3) && <TypingCaret seconds={seconds} />}</div></div>;
          })}
          <div className="l1-rubric-line" style={{ opacity: seconds > 6.4 ? 1 : 0.55 }}>Rubric: before · now · evidence · change</div>
        </div>
      </div>
    </Surface>
  );
}

function PeerResponse({ seconds }: { seconds: number }) {
  const response = 'I agree with your point. A specific example could support the idea. How might this work in another classroom?';
  const count = Math.max(0, Math.min(response.length, Math.floor(Math.min(seconds, 5.6) * 26)));
  return (
    <Surface width={840} height={565} quad={[[363, 242], [953, 209], [1012, 600], [406, 662]]} className="l1-learning-screen l1-peer-screen">
      <div className="l1-browser-strip"><i /><i /><i /><span>Learning space</span></div>
      <div className="l1-course-bar">Course discussion <span>Week 3</span></div>
      <div className="l1-forum-page">
        <div className="l1-forum-thread">
          <div className="l1-peer-post"><div className="l1-peer-author"><span>J</span><strong>Jamie</strong><small>Shared a reflection</small></div><p>I noticed that clear requirements changed how our group approached the activity.</p><p>What helped your group learn?</p></div>
          <div className="l1-reply-label">Your response</div>
          <div className="l1-peer-reply">{response.slice(0, count)}<TypingCaret seconds={seconds} /></div>
          <div className="l1-forum-draft">Draft saved</div>
        </div>
        <div className="l1-response-criteria"><h4>Response criteria</h4>{['Build on the idea', 'Specific suggestion', 'Follow-up question', 'Constructive tone'].map((text, index) => <div key={text}><span className="l1-criteria-box"><Check progress={(seconds - (0.5 + index * 1.05)) / 0.5} /></span><span>{text}</span></div>)}</div>
      </div>
    </Surface>
  );
}

export function ConsequenceScene({ metric, seconds, reducedMotion }: { metric: MetricId; seconds: number; reducedMotion: boolean }) {
  const branch = branches[metric];
  const time = Math.min(LEVEL1.branch + LEVEL1.common, Math.max(0, seconds));
  const attention = metric === 'in-class-participation' ? Math.max(pulse(time, 0.6, 1.1, 1.8), pulse(time, 2.35, 2.65, 3.1), pulse(time, 3.7, 4.25, 4.9)) : 0;
  const screenScene = metric === 'learning-reflection-quality' || metric === 'online-peer-response-quality';
  const cameraX = metric === 'pre-class-preparation' ? -2.2 : metric === 'learning-reflection-quality' ? -2.5 : metric === 'online-peer-response-quality' ? 1.7 : -0.6;
  const cameraY = screenScene ? -0.8 : metric === 'pre-class-preparation' ? -1 : 0.4;
  const cameraOptions = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  const cameraPose = {
    scale: reducedMotion ? 1.025 : interpolate(time, [0, 3.5, 6.3, 10.7, LEVEL1.branch, LEVEL1.branch + LEVEL1.common], [1.025, 1.06, 1.085, 1.105, 1.105, 1.065], cameraOptions) + attention * 0.004,
    x: reducedMotion ? 0 : interpolate(time, [0, 5.7, 10.6, 12.6, 16.6], [0, cameraX * 0.4, cameraX, cameraX, cameraX * 0.65], cameraOptions) + attention * 0.14,
    y: reducedMotion ? 0 : interpolate(time, [0, 8.4, 12.6, 16.6], [0, cameraY, cameraY, 0], cameraOptions),
    vignette: 0.24,
  };

  const surface = metric === 'pre-class-preparation' ? <Preparation seconds={time} />
    : metric === 'in-class-participation' ? null
    : metric === 'on-task-focus' ? <Focus seconds={time} />
    : metric === 'in-class-discussion-quality' ? <Discussion seconds={time} />
    : metric === 'learning-reflection-quality' ? <Reflection seconds={time} />
    : <PeerResponse seconds={time} />;

  return (
    <div className={`l1-branch-world l1-branch-${metric}`} data-metric={metric}>
      <CinematicCamera pose={cameraPose}>
        <Img className="l1-branch-plate" src={branch.plate} alt="" />
        <svg className="l1-prop-plane" viewBox="0 0 1672 941" preserveAspectRatio="none">
          <foreignObject x="0" y="0" width="1672" height="941"><div className="l1-prop-coordinate-space">{surface}</div></foreignObject>
        </svg>
        {metric === 'pre-class-preparation' && <Img className="l1-branch-occlusion" src={branch.plate} alt="" style={{ clipPath: 'polygon(47% 63%, 48.6% 55%, 50.1% 50%, 52% 50%, 58% 55%, 62% 61%, 59% 68%, 54% 66%, 51% 64%)' }} />}
        {metric === 'pre-class-preparation' && <Img className="l1-branch-occlusion" src={branch.plate} alt="" style={{ clipPath: 'polygon(35% 78%, 37% 75%, 38.6% 74%, 40.6% 74.5%, 43.5% 79%, 45.6% 85%, 44.3% 88%, 40% 89%, 35% 84%)' }} />}
        {metric === 'in-class-discussion-quality' && <Img className="l1-branch-occlusion" src={branch.plate} alt="" style={{ clipPath: 'polygon(63.8% 64.6%, 65% 63.6%, 67.5% 63.5%, 69% 65%, 69% 71.5%, 65% 74%, 63.2% 70%)' }} />}
        <EnvironmentMotion progress={reducedMotion ? 0 : time / 46} seed={metric.length} style={{ opacity: 0.26, mixBlendMode: 'screen' }} />
        <div className="l1-window-warmth" style={{ opacity: reducedMotion ? 0.1 : 0.11 + Math.sin(time * 0.35) * 0.025 } as CSSProperties} />
      </CinematicCamera>
      <div className="l1-scene-shading" />
    </div>
  );
}
