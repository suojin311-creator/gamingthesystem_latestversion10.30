import { useEffect, useState } from 'react';
import { getMetric } from './levels/level1/metrics';
import type { LevelOneProps, LevelOneResult } from './levels/level1/LevelOne';
import LevelOneExperience from './levels/level1/LevelOneExperience';
import LevelTwo, { type LevelTwoProps } from './levels/level2/LevelTwo';
import type { LevelTwoResult } from './levels/level2/data';
import LevelThree, { type LevelThreeProps } from './levels/level3/LevelThree';

export type GameplayProps = {
  // The opening owns name entry. Pass its confirmed playerName here once it ends.
  playerName: string;
  initialGuideDelay?: number;
  initialLevel?: 1 | 2 | 3;
  renderLevelOneCinematic?: LevelOneProps['renderCinematic'];
  renderLevelTwoCinematic?: LevelTwoProps['renderCinematic'];
  renderLevelThreeCinematic?: LevelThreeProps['renderCinematic'];
  onLevelOneComplete?: LevelOneProps['onComplete'];
  onLevelTwoComplete?: LevelTwoProps['onComplete'];
  onLevelThreeComplete?: LevelThreeProps['onComplete'];
  onDesignLab?: LevelThreeProps['onDesignLab'];
};

export default function Gameplay({ playerName, initialLevel = 1, initialGuideDelay = 0, renderLevelOneCinematic, renderLevelTwoCinematic, renderLevelThreeCinematic, onLevelOneComplete, onLevelTwoComplete, onLevelThreeComplete, onDesignLab }: GameplayProps) {
  const [level, setLevel] = useState(initialLevel);
  const [previousResult, setPreviousResult] = useState<LevelOneResult>();
  const [previousTwoResult, setPreviousTwoResult] = useState<LevelTwoResult>();
  useEffect(() => {
    const fresh = (event: PageTransitionEvent) => {
      if (event.persisted) { setLevel(initialLevel); setPreviousResult(undefined); setPreviousTwoResult(undefined); }
    };
    window.addEventListener('pageshow', fresh);
    return () => window.removeEventListener('pageshow', fresh);
  }, [initialLevel]);
  if (level === 1) return <LevelOneExperience initialGuideDelay={initialGuideDelay} playerName={playerName} renderCinematic={renderLevelOneCinematic} onComplete={result => { setPreviousResult(result); onLevelOneComplete?.(result); }} onContinue={() => { setLevel(2); window.scrollTo(0, 0); }} />;
  if (level === 2) return <LevelTwo playerName={playerName} previousMetricId={previousResult?.metricId} previousObservation={previousResult ? getMetric(previousResult.metricId)?.studentBehaviour : undefined} renderCinematic={renderLevelTwoCinematic} onComplete={onLevelTwoComplete} onContinue={result => { setPreviousTwoResult(result); setLevel(3); window.scrollTo(0, 0); }} />;
  return <LevelThree playerName={playerName} levelOneMetricId={previousResult?.metricId} initialMetricIds={previousTwoResult?.selectedMetricIds} renderCinematic={renderLevelThreeCinematic} onComplete={onLevelThreeComplete} onDesignLab={onDesignLab} />;
}
