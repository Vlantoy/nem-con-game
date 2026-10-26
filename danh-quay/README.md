# Đánh quay 3D · Sơn Mạch

Open `/danh-quay/` on the repository's static server (port 8081 in development). No build step, remote API, runtime CDN or installation is required. Three.js 0.180.0 is vendored locally under MIT; see `vendor/LICENSE-three.txt`.

## Playing

Start against the computer or choose two players on one device. Drag backward starting at your top, release to launch. A short tap cancels. The dotted line shows direction, the gauge shows power. Pointer cancellation, Esc, tab blur/visibility and pause are handled. A keyboard-accessible alternative provides angle/power sliders and a launch button. Sound is opt-in.

Each side has three attempts, alternating turns. Target positions repeat for each paired round, with identical initial states. Hit earns 20, target stability loss earns up to 50, knocking over earns 25 and leaving the ring earns 15; total is capped at 100 per attempt. High total wins; equal totals draw. This is a creative score challenge inspired by spinning-top games, not a claim to reproduce a universal traditional rule set.

## Implementation

Three.js renders actual perspective geometry with lighting/shadows: lathed wooden tops, colored rings, geometric trim, bamboo fence, low-poly mountains/trees/house, dirt ring. No generated images or external models are used. Camera is fixed and responsive. DPR capped at 1.7; shadow resolution 1024.

`physics.js` is renderer-independent deterministic arcade physics: damped ground motion, substepped circle contacts, impulse transfer, stability/spin loss, ring exit, visual topple condition. It is not a full gyroscopic rigid-body simulator. There is no random input into shot outcomes. Surface/scenery randomness is seeded. The computer uses fixed small aim deviations, not hidden player tracking.

Run `node --test danh-quay/tests/physics.test.cjs` for impact/miss, repeatability, launch guards, frame-size stability and terminal state checks.

## Direct duel revision

Active gameplay now uses `duel.js`, replacing the previous turn-based target challenge. Mouse left button, touch hold and Space feed the same hold/release action, with no input-mode switch. Aim rotates automatically, slower during charge; release creates a directional burst with cooldown. Bot waits for the first player release, then attacks. Ring exit or zero stability loses; at 60 seconds higher stability wins. Input cancellation/blur/pause clears charge without firing. Old `physics.js` remains as archived target prototype and is not loaded by the game.

Run `node --test danh-quay/tests/duel.test.cjs` for current rules. Previous turn-based instructions above describe the earlier prototype only.

## Ring-out rules (current)

Health/stability and damage are removed. Contacts transfer momentum and create decaying visual wobble only. A top loses by exiting the current ring. Each round lasts 30 seconds after practice; the ring shrinks from 4.65 to 2.05 units during the final 10 seconds, with matching visible boundary scaling. If both remain at timeout or both exit together, replay the round without awarding a win. First to two round wins wins the match. Charging/overheat and the single hold/release control remain. Current tests cover ring exit, shrinking, ties, wobble recovery, input cooldown and startup integration.
