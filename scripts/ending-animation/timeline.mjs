export const REVEAL_START = 14.5;
export const QUOTE_START = REVEAL_START + 3;
export const QUOTE_SECOND_START = REVEAL_START + 6;
export const TAKEAWAY_START = REVEAL_START + 9;
export const TAKEAWAY_SECOND_START = REVEAL_START + 12;
export const INVITATION_START = REVEAL_START + 15;
export const BUTTON_START = REVEAL_START + 18;
export const DURATION = BUTTON_START + .5;
export const SECTIONS = [
  { id: 'opening', start: 0, end: 3.8, title: 'Office reflection' },
  { id: 'level1', start: 3.8, end: 5.9, title: 'Level 1 memory' },
  { id: 'level2', start: 5.9, end: 8, title: 'Level 2 memory' },
  { id: 'level3', start: 8, end: 10.1, title: 'Level 3 memory' },
  { id: 'suspense', start: 10.1, end: REVEAL_START, title: 'There’s a name…' },
  { id: 'reveal', start: REVEAL_START, end: DURATION, title: 'Goodhart’s Law · Put it into practice' },
];
export const RECAP = ['One metric became the target.', 'More metrics became a checklist.', 'The weights set different reward priorities.'];
export const SUSPENSE = 'There’s a name for what you just experienced…';
export const THEORY_QUOTE = 'When a measure becomes a target, it ceases to be a good measure.';
export const TAKEAWAY = 'Your assessment doesn’t just measure learning. It shapes how students learn.';
export const INVITATION = 'Now put what you’ve learned into practice.';
export const LINES = [
  { start: .15, end: 3.8, speaker: 'You', role: 'player', text: 'Maybe it’s not just about finding the perfect weights…' },
];
export const sectionAt = time => SECTIONS.find(s => time < s.end) ?? SECTIONS.at(-1);
export const lineAt = time => LINES.find(line => time >= line.start && time < line.end);
export const ease = (time, start, duration) => { const t = Math.max(0, Math.min(1, (time - start) / duration)); return t * t * (3 - 2 * t); };

// One short action from the player's last trial, never a fabricated comparison.
export const actualShotAt = input => input.lastRun.shots.at(-1);
export function officeSeconds(time) {
  if (time < 3.8) return 31 + time;
  // The same office camera continues gently through suspense and the final hold.
  return 35.2 + Math.max(0, time - 10.1) * .35;
}
