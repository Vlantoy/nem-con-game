# Bắn nỏ 3D

Open `/ban-no/` on the project's static server. Three.js is reused locally from `danh-quay/vendor` (MIT license alongside). No runtime network assets or build step.

Mouse: move to aim, hold left button to draw, release to shoot. Touch: hold/drag to aim and draw, lift to shoot. No input-mode selection. Pointer cancel and tab blur cancel charging without firing; pause freezes flight and reload wait. Five arrows per round, 2/4/6/8/10 points by target radius, missed arrows score zero. Record stored locally if storage is available. Sound is opt-in.

Perspective 3D geometry for wooden crossbow/animated string, bolt, straw target/rings, fence, woods and mountains. Fixed camera, capped DPR and shadow map. Projectile follows gravity, collision interpolates at target plane. No wind, moving targets or opponent in this first version. Impact arrows persist for visual feedback; currently there is no frame-by-frame impact vibration animation. Gameplay scoring is creative rather than an assertion of universal traditional competition rules.

Run `node --test ban-no/tests/engine.test.cjs`.

## Sway, wind and distance update

Mouse/touch specifies the desired weapon orientation; the actual orientation follows with exponential lag plus continuous multi-frequency sway. Drawing briefly steadies the weapon, prolonged holds increase fatigue sway. The view-model bow rotates with that actual orientation and the reticle is projected from its muzzle, not placed at the pointer position. Projectiles originate at the muzzle and use the same direction, plus gravity and per-level horizontal wind acceleration.

Three stages: 14 m / calm, 22 m / right wind 1.5, 30 m / left wind 2.4 (simulation acceleration units). Each stage has five arrows; 24 points unlocks the next. Existing scores reset each stage. Arrow traces are cleared when restarting/advancing. This supersedes the fixed-distance/no-wind description above.

## Continuous sway / small target

Weapon sway remains active at all times, including while drawing; prolonged holds add fatigue. Target scoring radius reduced to 0.9 units, matching the rendered circles. Every shot now uses full speed 38 regardless of draw duration. The power meter and numeric charge display are removed; the crossbow string retains its draw animation. Wind regression checks compare drift at the target plane, not the eventual ground landing of a missed shot.
