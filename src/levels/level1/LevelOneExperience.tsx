import { useState } from 'react';
import LevelOne, { type LevelOneProps } from './LevelOne';
import Settlement from './Settlement';
import LevelOneCinematic from '../../cinematics/level1/LevelOneCinematic';

/** One approved Level 1 presentation, shared by the full game and previews. */
export default function LevelOneExperience(props: LevelOneProps) {
  const [run, setRun] = useState(0);
  return <LevelOne {...props} key={run} showIntro={run === 0 && (props.showIntro ?? true)}
    renderCinematic={props.renderCinematic ?? ((request, complete) => <LevelOneCinematic request={request} onComplete={complete} />)}
    renderSettlement={props.renderSettlement ?? (({ result, onContinue }) => <Settlement playerName={props.playerName} result={result} onContinue={onContinue} onTryAnother={onContinue ? undefined : () => setRun(value => value + 1)} />)} />;
}
