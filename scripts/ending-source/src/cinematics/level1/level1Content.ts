import type { MetricId } from '../../shared/contracts';
import preparation from '../../../docs/visual-style/references/Level1 - Six Behaviour Consequences/REF-L1-001 — Pre-class Preparation.png';
import participation from '../../../docs/visual-style/references/Level1 - Six Behaviour Consequences/REF-L1-002 — In-class Participation.png';
import focus from '../../../docs/visual-style/references/Level1 - Six Behaviour Consequences/REF-L1-003 — On-task Focus.png';
import discussion from '../../../docs/visual-style/references/Level1 - Six Behaviour Consequences/REF-L1-004 — Discussion Quality.png';
import reflection from '../../../docs/visual-style/references/Level1 - Six Behaviour Consequences/REF-L1-005 — Learning Reflection.png';
import response from '../../../docs/visual-style/references/Level1 - Six Behaviour Consequences/REF-L1-006 — Online Peer Response.png';

// Presentation only. These entries never select or calculate a gameplay result.
export const branches = {
  'pre-class-preparation': {
    label: 'Pre-class Preparation', plate: preparation,
    boast: 'I finished everything on the list!',
    question: 'What was the main idea in the reading?',
    reveal: 'Uh... I finished the checklist.',
  },
  'in-class-participation': {
    label: 'In-class Participation', plate: participation,
    boast: 'I agree! Same here!',
    question: 'Can you explain why?',
    reveal: 'I just wanted to participate.',
  },
  'on-task-focus': {
    label: 'On-task Focus', plate: focus,
    boast: 'Look, I stayed on task the whole time!',
    question: 'What did you discover?',
    reveal: 'I... kept the page open.',
  },
  'in-class-discussion-quality': {
    label: 'In-class Discussion Quality', plate: discussion,
    boast: 'Could you elaborate? I’d like to build on that.',
    question: 'What new idea came out of the discussion?',
    reveal: 'I followed the discussion checklist.',
  },
  'learning-reflection-quality': {
    label: 'Learning Reflection Quality', plate: reflection,
    boast: 'Before, I thought... Now, I think...',
    question: 'What actually changed your mind?',
    reveal: 'That’s the format on the rubric.',
  },
  'online-peer-response-quality': {
    label: 'Online Peer Response Quality', plate: response,
    boast: 'Specific suggestion? Check. Follow-up question? Check!',
    question: 'Did you really discuss their ideas?',
    reveal: 'I met every response criterion.',
  },
} as const satisfies Record<MetricId, { label: string; plate: string; boast: string; question: string; reveal: string }>;

export const metricIds = Object.keys(branches) as MetricId[];
export const isMetricId = (value: string | null): value is MetricId => value !== null && Object.hasOwn(branches, value);

// Approximate storyboard beats expanded just enough for the original lines to read.
export const LEVEL1 = { fps: 30, branch: 12.6, common: 4, office: 16.8, duration: 33.4 } as const;
export const COMMON_LINE = 'Professor! I figured out exactly what you were looking for!';
export const FIRST_THOUGHT = 'The numbers look great... but something still feels wrong.';
export const SECOND_THOUGHT = 'Maybe one metric is too narrow.';
export const BRIDGE_LINE = 'What if we measured more than one?';
export type PreviewPart = 'full' | 'common' | 'office';
export const partStart = (part: PreviewPart) => part === 'common' ? LEVEL1.branch : part === 'office' ? LEVEL1.branch + LEVEL1.common : 0;
