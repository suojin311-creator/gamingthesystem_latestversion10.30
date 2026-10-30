import Conversation, { type ConversationLine } from '../../shared/components/Conversation';
import type { Cue } from '../../shared/hooks/useFeedback';
import { BRISK_TYPING_DELAY, briskDialogueTime } from '../../shared/utils/conversationTiming';
export { findingReadingTime } from '../../shared/utils/conversationTiming';

/** Level 1's closing review shares this pace; earlier single lines keep theirs. */
export default function LevelTwoConversation(props: {
  lines: ConversationLine[]; enabled?: boolean; paused?: boolean;
  play: (cue: Cue) => void; onSettled: () => void; onLastMessage?: () => void;
}) {
  return <Conversation {...props} typingDelay={BRISK_TYPING_DELAY} readDelay={briskDialogueTime} />;
}
