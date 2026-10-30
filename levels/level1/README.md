# Level 1 — One metric

This folder owns the implemented Level 1 gameplay:

- `LevelOne.tsx`: entry component and decision flow; imports its own stylesheet.
- `metrics.ts`: six choices, scores, observations and temporary scene text.
- `state.ts`: in-memory state for one open game.
- `components/`: Level 1 dialogue, guide and replaceable cinematic placeholder.
- `styles.css`: Level 1 layouts and animations, scoped to `.level-one`.

Import shared base styles once in the application entry point. Reuse icons, audio,
visible-time delays and reading-time utilities from `../../shared/`.

The cinematic and completion contracts are documented in
[LEVEL1_HANDOFF.md](../../../docs/LEVEL1_HANDOFF.md).

The [latest standalone ZIP](../../../play/Level1-play.zip?raw=true) is built
from this component using `npm run build:level1`. Its continuation is disabled;
the combined game uses the same component with an enabled Level 2 continuation.
Use `npm run dev -- --mode level1` to develop the standalone entry.

The latest download includes the Level 1 improvements made during Level 2 work.
The older `level1-preview` branch has been synchronized for this release.
`npm run package:previews` rebuilds all latest individual/combined downloads
together. Version-numbered ZIPs preserve historical releases. See the
[repository guide](../../../docs/REPOSITORY_GUIDE.md).
