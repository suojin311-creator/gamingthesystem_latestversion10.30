# Integrated Level 3A weighted-task films

The default weights slot presents the pinned partner Level 3A delivery at
`ba9f81ee619c14b3342104228cdd2a5cc2bc2b3b`. Comparison/theory still use their
existing game placeholders. Level 3B is not imported.

Game-supplied shot effort and ordering are authoritative. `mapping.mjs` converts
IDs and Low/Medium/High names only; it never calculates effort from weights.
The host passes the current game caption per shot. The iframe reports its real
completion once, with source-window/run-token checks on the host.

`scripts/level3-animation/` adapts the read-only source: no numeric sheets,
rejected single portrait, peer-only cutaways or empty establishing inserts.
Metric names are top-left and Alex's label/caption share the blue palette.
Decoded shots cross-dissolve through the shared frozen-frame utility.

Build/cache and review ZIP instructions: `docs/LEVEL3A_ANIMATION.md`.
