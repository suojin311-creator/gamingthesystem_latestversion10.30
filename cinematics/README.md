# Finished animation integration

This folder contains the imported opening and integrated Level 1/2 iframe
adapters on animation/opening-integration. LevelOneExperience shares the approved
Level 1 report, film and settlement between full-game and standalone entries.
The partner source remains read-only; the film is prepared from its pinned
checkout using scripts/level1-film.mjs. Level 2 uses scripts/level2-film.mjs and
only its existing three/six/final placeholder slots. Its post-film results retain
the observation and two perspective cards without review chat. Level 3A now
presents the three game-supplied task/effort states, with no Level 3B import.
Comparison/theory retain the existing placeholders. See docs/LEVEL3A_ANIMATION.md.

The separately reviewed ending is built through `scripts/ending-animation/`;
its actual-history input adapter lives in `ending/input.ts`. It is not yet wired
into the default game. See `docs/ENDING_ANIMATION_PREVIEW.md` and the independent
`play/Ending-animation-preview.zip`.

Add the corresponding folders when their actual source is imported:

```text
cinematics/
  opening/        opening, existing name entry and its assets
  level1/         the six selected-metric scenes
  level2/         three-metric branches, six-metric and final checklist scenes
  level3/         weighted task shots, Alex's response and theory reveal
```

Keep each delivery's necessary relative imports/assets together. Expose one
adapter per supplied scene family and use the existing callbacks from
`src/Gameplay.tsx`; do not copy level rules into this folder. The actual adapters
will be implemented against the delivered source rather than guessed now.

Start with [Animation integration](../../docs/ANIMATION_INTEGRATION.md).
Use [Development workflow](../../docs/DEVELOPMENT_WORKFLOW.md) to preview only
the affected entry; build all downloadable versions when preparing a release.
