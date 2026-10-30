import FullGame from './FullGame';
import GameAudio from './audio/GameAudio';
import SoundReview from './audio/SoundReview';
import LevelOneExperience from './levels/level1/LevelOneExperience';
import LevelTwo from './levels/level2/LevelTwo';
import LevelThree from './levels/level3/LevelThree';
import { PREVIEW_PLAYER_NAME } from './shared/utils/playerName';

// All previews use the same level components. Only their entry/continuation differs.
function GameEntry() {
  if (import.meta.env.MODE === 'level1') {
    return <LevelOneExperience playerName={PREVIEW_PLAYER_NAME} />;
  }
  if (import.meta.env.MODE === 'level2') return <LevelTwo playerName={PREVIEW_PLAYER_NAME} />;
  if (import.meta.env.MODE === 'level3') return <LevelThree playerName={PREVIEW_PLAYER_NAME} />;
  // The complete offline bundle shares one game HTML across its four launchers.
  // Standalone builds above keep their existing entry/continuation behaviour.
  const direct = new URLSearchParams(window.location.search).get('level');
  if (direct === '1') return <LevelOneExperience playerName={PREVIEW_PLAYER_NAME} />;
  if (direct === '2') return <LevelTwo playerName={PREVIEW_PLAYER_NAME} />;
  if (direct === '3') return <LevelThree playerName={PREVIEW_PLAYER_NAME} />;
  return <FullGame />;
}

export default function App(){if(new URLSearchParams(location.search).has('soundcheck'))return <SoundReview/>;return <><GameEntry/><GameAudio/></>;}
