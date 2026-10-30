# Level 2 — More metrics

Current animation-branch presentation uses `cinematics/level2/LevelTwoCinematic`
only at the existing three/six/final scene slots. Post-film pages show the
existing observation above two equal perspective cards, without review chat.
See docs/LEVEL2_ANIMATION_PREVIEW.md for the backup, clip cuts and current build.
Older dialogue/presentation details below are retained as implementation history.
Cover the gaps now goes directly to six cards: preserve/lock the original trio,
require the player to check the remaining three, and enable Observe only when
all are checked. No separate gaps page or Illustrative outcomes label remains.
Observed Students cards use the Level 1 red outline for three visible pulses.

- `LevelTwo.tsx`: complete 3 → 6 → 10 → 25 → 100 flow, in-memory state and paced presentation.
- `GrowthSequence.tsx`: stable counter/matrix/paper surface, next-milestone cue and pausable 0.7-second paper transition.
- `Conversation.tsx`: faster Level 2 dialogue and finding pace; the last message releases the next action immediately.
- Shared `MetricSelection.tsx`: short icon cards and a three-slot Alex’s Checklist; selected definitions are reviewed in the tray. Evaluations do not duplicate it.
- `data.ts`: three combination branches, evidence, checklists and integration types.
- `Perspectives.tsx`: same-round report, awaiting-observation state, prominent student behaviour and a smaller learning-risk label.
- `CinematicPlaceholder.tsx`: replaceable three-metric, six-metric and final story slots.
- `styles.css`: layout, icon/check reports and growing checklist paper pile, scoped to `.level-two`.

Default App starts at Level 1 and continues here. A shared three-second chapter transition files the previous metric away, opens three empty slots, then reveals the LEVEL 02 title and one teacher line. It waits for the lower-right Choose three metrics button. `npm run dev -- --mode level2`
opens this level directly; `npm run build:level2` produces its self-contained preview.

Use the six common definitions, conversation bubbles, audio and visible-time
utilities from `../../shared/`. Do not import Level 1's component internals.
The optional `previousMetricId` prop carries the prior choice in memory.

See [LEVEL2_HANDOFF.md](../../../docs/LEVEL2_HANDOFF.md) for cinematic IDs,
completion data and boundaries. The combined host enables Continue to Level 3 through the optional onContinue callback. The standalone Level 2 entry leaves that callback absent and stops here.

The original classroom scene slot remains for the user’s authored animation. The added peer demonstration and narrative are withdrawn. One Add more metrics action runs 10 → 25 → 100 through `ChecklistGrowth`; completed 10/25 actions each hold 3.5 visible seconds, anticipate the next count and turn over 0.7 seconds. The surface keeps its DOM, height and scroll position, and the final Observe action stays explicit. See docs/LEARNING_OPTIMIZATIONS.md.
