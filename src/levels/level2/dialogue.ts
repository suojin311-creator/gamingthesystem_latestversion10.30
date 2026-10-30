import type { ConversationLine } from '../../shared/components/Conversation';
import { METRIC_CATALOG, metricDefinition, type MetricId } from '../../shared/data/metrics';
import { classifyTrio, type LevelTwoCinematicRequest } from './data';

const names = (ids: readonly MetricId[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(ids.map(id => metricDefinition(id).shortName));

export function observationDialogue(complete: boolean, count: number, selected: MetricId[], playerName: string): ConversationLine[] {
  const teacher = (text: string): ConversationLine => ({ speaker: 'Maya', name: playerName, text });
  const alex = (text: string): ConversationLine => ({ speaker: 'Alex', name: 'Alex', text });
  if (complete) return [teacher('Would changing what counts most change what you spend time on?'), alex('Depends… what’s the big reward? 🪙'), alex('Show me that, and I’ll make a plan.')];
  if (count !== 3) return [teacher('Now all six count. Are you learning more, or just keeping up?'), alex('Keeping up! There’s a box for everything now. 😅'), alex('I’m getting quick at ticking them off.')];
  const tracked = names(selected);
  const missing = names(METRIC_CATALOG.filter(metric => !selected.includes(metric.id)).map(metric => metric.id));
  switch (classifyTrio(selected)) {
    case 'visible': return [teacher(`${missing} still matter. Where did they fit in?`), alex('Looking busy was the mission, right? 🧐'), alex(`I left ${missing} for later.`)];
    case 'quality': return [teacher(`Your work on ${tracked} looks polished. What did you leave out?`), alex('I made those three look just right. 🪄'), alex('The other three? They weren’t on my list.')];
    case 'mixed': return [teacher(`You covered ${tracked}. What happened to the rest?`), alex('I kept checking the three on my score sheet. 🧷'), alex('If it wasn’t on the list, I moved on.')];
  }
}

export function classroomDialogue(request: LevelTwoCinematicRequest): { speaker: string; text: string }[] {
  const teacher = (text: string) => ({ speaker: request.playerName, text });
  const alex = (text: string) => ({ speaker: 'Alex', text });
  if (request.kind === 'three') {
    const tracked = names(request.selectedMetricIds);
    switch (request.branch) {
      case 'visible': return [alex(`${tracked}—all looking good!`), teacher('Busy hands, open pages… but can you explain the lesson?'), alex('I was watching for the checks, not the ideas.')];
      case 'quality': return [alex(`${tracked}—I used the examples for all three!`), teacher('It meets the criteria. Which idea made you think again?'), alex('I picked the wording that usually gets credit.')];
      case 'mixed': return [alex(`${tracked}—that’s my list done!`), teacher('How did you choose where to spend your time?'), alex('The list told me what mattered for my marks.')];
    }
  }
  if (request.kind === 'six') return [alex('Six metrics, six green ticks! I’ve got everything covered!'), teacher('But what did you actually learn?'), alex('Well... I learned exactly how to meet the criteria!')];
  return [teacher('A hundred ticks, and you’re racing through the checklist.'), teacher('Adding requirements hasn’t changed what you’re chasing.')];
}
