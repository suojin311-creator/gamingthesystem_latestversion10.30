import { metricDefinition, type MetricId } from '../../shared/data/metrics';
export type { MetricId } from '../../shared/data/metrics';
export type SceneLine = { speaker: 'Alex' | 'Maya'; text: string };
export type Metric = {
  id: MetricId;
  name: string;
  shortName: string;
  description: string;
  example: string;
  assessmentCriteria: string;
  before: number;
  after: number;
  improvement: string;
  uncertainty: string;
  evidence: string;
  studentReplies: readonly string[];
  reviewQuestion: string;
  studentBehaviour: string;
  learningLabel: string;
  takeaway: string;
  scene: SceneLine[];
};

// Illustrative scores, not measurements of real students. Stable across replays.
export const METRICS: Metric[] = [
  {
    ...metricDefinition('prep'),
    example: 'Students will arrive ready to discuss the reading.', before: 34, after: 88,
    assessmentCriteria: 'Complete the preparation checklist.',
    improvement: 'More preparation tasks completed', uncertainty: 'Understanding still unclear',
    evidence: 'Students complete the preparation, but some skim just enough to meet the requirement.',
    studentReplies: ['I finished the whole list! 📋', 'The reading? I mostly skimmed it 😬'],
    reviewQuestion: 'How did you get through the reading so quickly?',
    studentBehaviour: 'Skimming just to finish.',
    learningLabel: 'Understanding', takeaway: 'The checklist is complete. The ideas are unclear.',
    scene: [
      { speaker: 'Alex', text: 'I finished everything on the list!' },
      { speaker: 'Maya', text: 'What was the main idea in the reading?' },
      { speaker: 'Alex', text: 'Uh... I finished the checklist.' },
    ],
  },
  {
    ...metricDefinition('part'),
    example: 'Students will contribute more thoughtful ideas.', before: 29, after: 85,
    assessmentCriteria: 'Make at least one contribution in class.',
    improvement: 'More visible contributions', uncertainty: 'Depth still unclear',
    evidence: 'Students speak more often, but some contributions are brief or repetitive.',
    studentReplies: ['I put my hand up! 🙋', 'I… didn’t really have an explanation 🤷'],
    reviewQuestion: 'I saw your hand up. What were you adding to the lesson?',
    studentBehaviour: 'More talk. Little explanation.',
    learningLabel: 'Depth', takeaway: 'More contributions. Little explanation.',
    scene: [
      { speaker: 'Alex', text: 'I agree! Same here!' },
      { speaker: 'Maya', text: 'Can you explain why?' },
      { speaker: 'Alex', text: 'I just wanted to participate.' },
    ],
  },
  {
    ...metricDefinition('focus'),
    example: 'Students will think more deeply about the task.', before: 41, after: 91,
    assessmentCriteria: 'Be recorded as on task during classroom checks.',
    improvement: 'More visible time on task', uncertainty: 'Thinking still unclear',
    evidence: 'Students stay visibly on task, but some focus on looking busy rather than thinking deeply.',
    studentReplies: ['I kept the page open! 💻', 'That counts as staying focused… right? 👀'],
    reviewQuestion: 'You looked focused. How were you using that time?',
    studentBehaviour: 'Looking busy takes priority.',
    learningLabel: 'Thinking', takeaway: 'The page stayed open. The thinking is unclear.',
    scene: [
      { speaker: 'Alex', text: 'Look, I stayed on task the whole time!' },
      { speaker: 'Maya', text: 'What did you discover?' },
      { speaker: 'Alex', text: 'I was making sure I looked busy.' },
    ],
  },
  {
    ...metricDefinition('discuss'),
    example: 'Students will explore and develop ideas together.', before: 32, after: 84,
    assessmentCriteria: 'Ask a follow-up question and build on a classmate’s point.',
    improvement: 'More discussion criteria met', uncertainty: 'New ideas still unclear',
    evidence: 'Students use the discussion behaviours that earn credit, but some contributions become formulaic.',
    studentReplies: ['I used all the right phrases! 💬', 'A new idea? Umm… 🤔'],
    reviewQuestion: 'Those phrases sound familiar. What did they help you work out?',
    studentBehaviour: 'Discussion turns formulaic.',
    learningLabel: 'New ideas', takeaway: 'The right phrases. Few new ideas.',
    scene: [
      { speaker: 'Alex', text: "Could you elaborate? I’d like to build on that." },
      { speaker: 'Maya', text: 'What new idea came out of the discussion?' },
      { speaker: 'Alex', text: 'I followed the discussion checklist.' },
    ],
  },
  {
    ...metricDefinition('reflect'),
    example: 'Students will reflect on what changed their thinking.', before: 38, after: 89,
    assessmentCriteria: 'Use the reflection format: describe your thinking before and after.',
    improvement: 'More structured reflections', uncertainty: 'Changed thinking still unclear',
    evidence: 'Reflections match the expected structure, but some students repeat the same safe patterns.',
    studentReplies: ['I followed the example! 📝', 'I just used the same pattern again 🔁'],
    reviewQuestion: 'Your reflection looks polished. How did you decide what to write?',
    studentBehaviour: 'Repeating safe reflection patterns.',
    learningLabel: 'Changed thinking', takeaway: 'A polished reflection. Changed thinking is unclear.',
    scene: [
      { speaker: 'Alex', text: 'Before, I thought... Now, I think...' },
      { speaker: 'Maya', text: 'What actually changed your mind?' },
      { speaker: 'Alex', text: "That’s the format on the rubric." },
    ],
  },
  {
    ...metricDefinition('peer'),
    example: 'Students will engage with their classmates’ ideas.', before: 27, after: 86,
    assessmentCriteria: 'Include a specific suggestion and a follow-up question in your response.',
    improvement: 'More response criteria met', uncertainty: 'Exchange of ideas still unclear',
    evidence: 'Online replies become more specific, but some students learn a repeatable response formula.',
    studentReplies: ['A suggestion and a question! 🎯', 'I use that pattern every time 🤭'],
    reviewQuestion: 'What helped you write those replies so fast?',
    studentBehaviour: 'Replying to tick boxes.',
    learningLabel: 'Real exchange', takeaway: 'The criteria are met. The exchange is unclear.',
    scene: [
      { speaker: 'Alex', text: 'Specific suggestion? Check. Follow-up question? Check!' },
      { speaker: 'Maya', text: 'Did you really discuss their ideas?' },
      { speaker: 'Alex', text: 'I met every response criterion.' },
    ],
  },
];

export function getMetric(id: MetricId | null) {
  return METRICS.find(metric => metric.id === id);
}
