import { readingSeconds } from '../cinematic-reading.mjs';

// Presentation only. The game supplies branch and selected metrics.
export function revisionTimeline(kind, reflection = []) {
  const shots = [];
  let duration = 0;
  const add = (id, view, speaker, text, emphasis, hold) => {
    const seconds = hold ?? readingSeconds(text) + .45;
    shots.push({ id, view, speaker, text, emphasis, start: duration, end: duration + seconds });
    duration += seconds;
  };
  if (kind === 'three') {
    add('classmates-question', 'group', 'Classmates', 'How did you get such high scores?');
    add('alex-continues', 'group', 'Alex', 'Why spend time on things that don’t count?', 'don’t count');
    add('alex-explains', 'group', 'Alex', 'Here’s the trick: focus on the three metrics the professor is grading.', 'three metrics');
    add('strategy-spreading', 'group', null, 'Alex’s strategy is starting to catch on.', null, 3);
    add('professor-reflection', 'professor-wide', 'You', 'They’re focusing on what I measure. But am I seeing the whole picture? Maybe I need to measure more.');
  } else if (kind === 'six') {
    add('c-asks', 'six-group', 'Classmate C', 'Wow, Alex! Another top score? How do you do it?', 'Another top score');
    add('d-asks', 'six-group', 'Classmate D', 'Seriously, what’s your secret?', 'secret');
    add('six-checklist-reveal', 'six-paper', 'Alex', 'It’s simple! Just tick all six boxes. That’s all you need!', 'all six boxes', 8.2);
    add('classmates-impressed', 'impressed', null, null, null, 1.2);
    add('six-professor-reflection', 'professor-wide', 'You', 'Even six metrics aren’t enough? Maybe I need to add more…', 'add more');
  } else if (kind === 'checklist') {
    add('classroom-overload', 'overload', null, null, null, 1.5);
    add('beige-exhausted', 'beige', 'Classmate', 'A hundred metrics?! How are we supposed to finish all this?', 'A hundred metrics');
    add('green-overwhelmed', 'green', null, null, null, 1.5);
    add('c-exhausted', 'exhausted-c', 'Classmate C', 'Seriously! There’s no way we can keep up!', 'keep up');
    add('alex-composed', 'alex', null, null, null, .9);
    add('alex-strategy', 'alex', 'Alex', 'Relax! You just need to tick all the boxes.', 'all the boxes');
    add('alex-depth', 'alex', 'Alex', 'No need to go too deep into anything!', 'too deep');
    add('group-uncertainty', 'green', null, null, null, 1.2);
    // Exact original pen insert through the final complete Coverage map.
    add('original-evidence', 'evidence', null, null, null, 5.649);
    for (const [index, line] of reflection.entries()) {
      add('original-reflection-' + index, 'alex', 'You', line.text, null);
    }
    if (!reflection.length) throw new Error('Preserve the original 100-metric reflection contract.');
  } else {
    throw new Error('Unsupported Level 2 revision segment: ' + kind);
  }
  return { shots, duration };
}

export function revisionAt(timeline, elapsed) {
  const time = Math.max(0, Math.min(timeline.duration, elapsed));
  const index = timeline.shots.findIndex(shot => time < shot.end);
  const shot = timeline.shots[index < 0 ? timeline.shots.length - 1 : index];
  return { shot, time: Math.max(0, Math.min(shot.end - shot.start, time - shot.start)) };
}
