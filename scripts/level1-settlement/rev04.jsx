import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import studying from '../../revision-assets/level1/L1-01-studying.png';
import books from '../../revision-assets/level1/derived/L1-books-aside-opaque.png';
import smile from '../../revision-assets/level1/L1-03-knowing-smile.png';
import surprised from '../../revision-assets/level1/L1-04-classmate-surprised.png';
import alex from '../../revision-assets/level1/derived/L1-alex-talking.png';
import classroom from '@partner-assets/backgrounds/BG-002 — Classroom First-Person Background.png';
import { transitionShot, TRANSITION_SHOTS } from './rev04.mjs';
import { professorLabel } from './content.mjs';
import './rev04.css';

export const transitionImages = [studying, books, smile, surprised, alex, classroom];
const ease = n => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };
function Bubble({ speaker, children, tone, style, tail = 'left', progress }) {
  return <aside className={`rev04-bubble rev04-tone-${tone} rev04-tail-${tail}`} data-speaker={speaker}
    style={{ ...style, opacity: ease(progress / .22), translate: `0 ${(1 - ease(progress / .22)) * 7}px` }}>
    <span className="rev04-identity">{speaker}</span><p>{children}</p>
  </aside>;
}
function Shot({ shot, local, playerName, reducedMotion }) {
  const drift = reducedMotion ? 0 : ease(local / (shot.end - shot.start)) * .018;
  return <AbsoluteFill className={`rev04 rev04-shot-${shot.id}`}>
    <Img className="rev04-classroom" src={classroom} style={{ scale: 1.02 + drift }} />
    {shot.id === 'studying' && <Img className="rev04-photo rev04-study" src={studying} style={{ scale: 1 + drift }} />}
    {shot.id === 'alex' && <>
      <div className="rev04-alex-character"><Img src={alex} style={{ scale: 1 + drift }} /></div>
      <Bubble speaker="Alex" tone="alex" tail="right" progress={local - .25} style={{ left: '5%', top: '14%', width: '58%' }}>
        Why are you studying so hard? We only need to <strong>meet the metric</strong> the professor set!
      </Bubble>
    </>}
    {shot.id === 'surprised' && <>
      <Img className="rev04-photo rev04-surprised" src={surprised} style={{ scale: 1 + drift }} />
      <Bubble speaker="Classmate" tone="classmate" progress={local - .2} style={{ left: '55%', top: '6%', width: '40%' }}>
        Wait, <strong>that’s all</strong> we need to do?
      </Bubble>
    </>}
    {shot.id === 'books' && <div className="rev04-action" data-action={local < .65 ? 'reach' : 'hands-and-books'}>
      {/* Cut on the authored reach, then track the hand/book gesture. No invented joint movement. */}
      <Img className={`rev04-photo ${local < .65 ? 'rev04-reach' : 'rev04-book-detail'}`} src={books}
        style={local < .65 ? {} : { translate: `${reducedMotion ? 0 : -ease((local - .65) / 2.6) * 18}px 0` }} />
    </div>}
    {shot.id === 'smile' && (local < 1.9 ? <div className="rev04-smile-window">
      {/* Face-only framing excludes the raised fist and reset desk layout. */}
      <Img className="rev04-photo rev04-smile" src={smile} style={{ scale: 1 + drift }} />
    </div> : <div className="rev04-alex-character rev04-alex-response"><Img src={alex} /></div>)}
    {shot.id === 'professor' && <Bubble speaker={professorLabel(playerName)} tone="professor" tail="down" progress={local - .25}
      style={{ left: '18%', bottom: '9%', width: '64%' }}>
      Maybe <strong>one metric</strong> is too narrow.
    </Bubble>}
  </AbsoluteFill>;
}

export function SharedTransition({ seconds, playerName, reducedMotion }) {
  const shot = transitionShot(seconds);
  const local = Math.max(0, seconds - shot.start);
  const previous = TRANSITION_SHOTS[TRANSITION_SHOTS.indexOf(shot) - 1];
  // Freeze the outgoing shot over a fully decoded incoming shot. The reach and
  // hand insert use intentional cuts, so the books never dissolve/teleport.
  const dissolving = !reducedMotion && previous && shot.id !== 'books' && local < .3;
  return <AbsoluteFill className="rev04-sequence" data-shot={shot.id} data-transition-seconds={seconds.toFixed(3)}>
    <Shot shot={shot} local={local} playerName={playerName} reducedMotion={reducedMotion} />
    {dissolving && <AbsoluteFill aria-hidden="true" style={{ opacity: 1 - ease(local / .3), pointerEvents: 'none' }}>
      <Shot shot={previous} local={previous.end - previous.start - 1 / 30} playerName={playerName} reducedMotion={reducedMotion} />
    </AbsoluteFill>}
  </AbsoluteFill>;
}
