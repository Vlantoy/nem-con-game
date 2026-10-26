# Đi cà kheo

Static pixel Canvas game at `/ca-kheo/`, no external dependencies. Hold mouse/touch/Space to move one stilt forward, release to plant it; the next action uses the opposite leg. Target footprint previews landing. Short or overlong steps lose balance; water gaps fail. Checkpoints at 10 m and 20 m, finish at 30 m. Pause, hidden tab and canceled pointers reset pending steps without planting them.

Uses existing Ném còn background and character art; stilts/terrain are Canvas drawings. Inspired by alternating-leg walking controls, with original Sơn Mạch course and UI. This is an arcade stepping simulation rather than a full rigid-body balance model. Current sprite animation is transform-based, not a new frame-by-frame character sheet.

`node --test ca-kheo/tests/engine.test.cjs` checks step alternation, falls, gap landings, safe respawns and a complete valid route.

## Articulated movement revision

Current engine uses swing/lower/transfer/stance phases. Feet stay planted until the lowering animation contacts terrain; the body has spring-damped horizontal/vertical inertia. Legs and arms use two-segment joint solving, while the existing character image supplies cropped upper-body art. Ground spread and body/support imbalance accumulate a recoverable instability window rather than an arbitrary hold timer. Falling is simulated for 1.15 seconds before showing results. This is an assisted kinematic model, not a general-purpose ragdoll solver. Tests simulate a complete viable route with all animation phases.
