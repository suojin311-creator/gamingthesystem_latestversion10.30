import type { Phase } from '../state';
import type { Cue } from '../../../shared/hooks/useFeedback';
import Conversation, { type ConversationLine } from '../../../shared/components/Conversation';
import { BRISK_TYPING_DELAY, briskDialogueTime } from '../../../shared/utils/conversationTiming';

export default function Dialogue({ phase, playerName, studentReplies, reviewQuestion, enabled, paused = false, play, onSettled, assessmentReport = false }: {
  phase: Phase; playerName: string; studentReplies?: readonly string[]; reviewQuestion?: string; enabled: boolean;
  play: (cue: Cue) => void; onSettled: () => void; paused?: boolean;
  assessmentReport?: boolean;
}) {
  const single: Record<Phase, string> = {
    choose: 'Where should I start?', predict: 'What do I expect students to do?',
    result: assessmentReport ? 'More students met the criteria. What happened in class?' : 'Looking good. I’ll check the classroom.', cinematic: '',
    review: reviewQuestion || 'Tell me how you approached that task.',
  };
  const lines: ConversationLine[] = [{ speaker: 'Maya', name: playerName, text: single[phase] }];
  if (phase === 'review') lines.push(...(studentReplies || ['I finished the tasks.']).map(text => ({ speaker: 'Alex' as const, name: 'Alex', text })));
  return <Conversation lines={lines} enabled={enabled} paused={paused} play={play} typingDelay={phase === 'review' ? BRISK_TYPING_DELAY : undefined} readDelay={phase === 'review' ? briskDialogueTime : undefined} onLastMessage={phase === 'review' ? onSettled : undefined} onSettled={onSettled} />;
}
