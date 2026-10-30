import React from 'react';
import {professorLabel} from '../level1-settlement/content.mjs';
import { OfficeReveal } from '@ending/cinematics/ending/OfficeReveal';
import '@ending/cinematics/ending/ending.css';
import '../../src/cinematics/opening/styles.css';
import { SPEAKER_COLORS, CAPTION_SHADOW } from '../../src/shared/data/cinematicPalette.js';
import { SoloMemory } from './Memories';
import { REVEAL_START, QUOTE_START, QUOTE_SECOND_START, TAKEAWAY_START, TAKEAWAY_SECOND_START, INVITATION_START, BUTTON_START, SUSPENSE, THEORY_QUOTE, TAKEAWAY, INVITATION, ease, lineAt, officeSeconds, sectionAt } from './timeline.mjs';
import './film.css';

export default function Composition({ input, time, reducedMotion, surface, onEnterLab }) {
  const section = sectionAt(time), line = lineAt(time);
  const reveal = section.id === 'reveal';
  const invitationOpacity = ease(time, INVITATION_START, .6);
  const buttonOpacity = ease(time, BUTTON_START, .5);
  return <main ref={surface} className="end-stage ending-adapted" data-section={section.id} data-elapsed={time.toFixed(3)}>
    {['level1', 'level2', 'level3'].includes(section.id) && <SoloMemory {...{ input, reducedMotion, time: time - section.start }} level={Number(section.id.slice(-1))} />}
    {(section.id === 'opening' || time >= 10.1) && <OfficeReveal input={input} reducedMotion={reducedMotion} seconds={officeSeconds(time)} />}
    {time < .45 && <div className="ending-entry-shade" style={{opacity:1-ease(time,0,.45)}} aria-hidden="true" />}
    {line && <div className="ending-spoken" style={{color:SPEAKER_COLORS[line.role], textShadow:CAPTION_SHADOW, opacity:ease(time,line.start,.16)}}>
      <p className="ending-speaker">{line.role==='player'?professorLabel(input.playerName):line.speaker}</p><p role="status">{line.text}</p>
    </div>}
    {section.id === 'suspense' && <div className="ending-suspense" style={{opacity:ease(time,10.1,.7)*(1-ease(time,13.8,.7))}}><p>{SUSPENSE}</p></div>}
    {reveal && <section className="ending-unified" aria-labelledby="ending-theory-title">
      <div className="ending-unified-copy">
        <div className="ending-theory">
          <h1 id="ending-theory-title" style={{opacity:ease(time,REVEAL_START,.6)}}>GOODHART’S LAW</h1>
          <p className="ending-quote" aria-label={THEORY_QUOTE}><span className="ending-reveal-line" data-reveal-line="quote-first" style={{opacity:ease(time,QUOTE_START,.6)}}>“When a measure becomes a target,</span>{' '}<span className="ending-reveal-line" data-reveal-line="quote-second" style={{opacity:ease(time,QUOTE_SECOND_START,.6)}}>it ceases to be a good measure.”</span></p>
        </div>
        <p className="ending-takeaway" aria-label={TAKEAWAY}><span className="ending-reveal-line" data-reveal-line="takeaway-first" style={{opacity:ease(time,TAKEAWAY_START,.6)}}>Your assessment doesn’t just measure learning.</span>{' '}<span className="ending-reveal-line" data-reveal-line="takeaway-second" style={{opacity:ease(time,TAKEAWAY_SECOND_START,.6)}}>It <strong>shapes how students learn.</strong></span></p>
        <div className="ending-invitation">
          <p aria-hidden={invitationOpacity===0} style={{opacity:invitationOpacity}}>{INVITATION}</p>
          <div className="ending-unified-action opening-scene" aria-hidden={buttonOpacity===0} style={{opacity:buttonOpacity,visibility:buttonOpacity===0?'hidden':'visible'}}><button type="button" className="opening-action ending-design-button" disabled={!onEnterLab} aria-disabled={!onEnterLab} onClick={onEnterLab}>ENTER DESIGN LAB <span aria-hidden="true">→</span></button></div>
        </div>
      </div>
    </section>}
    <div className="end-film-vignette" aria-hidden="true" />
  </main>;
}
