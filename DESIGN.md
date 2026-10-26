# Ném Còn — khung gỗ hội làng

## Reference and intent
The supplied Ném Còn screenshot is a style reference: stepped gold borders, dark carved wood title bars, warm parchment content, compact gold buttons. Keep that game intact. The separate Nhảy Sạp page uses the supplied valley, bamboo, dancers, and movement sprite sheets as its scene art, with the same wood-and-gold HUD tokens.

## Tokens
Wood shadow #3b1d0d, wood #71380f, bronze #b77919, gold #edc35b, parchment #f4e4bc, light #fff3cf, ink #362313. Base spacing 4px; component spacing 8/12/16/24px. Existing Be Vietnam Pro supports Vietnamese accents; use 12/14/16px body, 20/24/32px headings, bold short labels.

## Primitives
WoodFrame: angular stepped corners, double gold border and inset dark edge. ParchmentPanel: warm light surface and brown text. WoodButton: wood surface, gold text, clear hover/pressed/focus states. PixelIcon: original SVG on a consistent square grid, no platform emoji in primary controls. DifficultyChoice: selected state plus plain-language mechanical description.

## Layout
Keep canvas as the main surface. Compact wooden HUD and footer, parchment dropdown, centered scrollable dialogs. Mode picker presents three modes and three difficulty choices with descriptions. Help/culture keeps existing content and navigation in a wood-framed parchment panel.

## Interaction and motion
Preserve gameplay controls and all mode/skill handlers. Motion only for feedback, hover, scoring, and gameplay. Respect reduced motion. Difficulty changes apply between throws so an airborne shot cannot change its scoring tolerance.

## Responsive and accessibility
Keep labels readable at 375, 768 and 1280 widths; scroll long dialogs within viewport. Maintain visible keyboard focus, accessible names, selected-state semantics and Vietnamese diacritics. Existing landscape game orientation is retained.

## Gameplay communication
Easy has a wide visible scoring gate, full trajectory and forgiving charge. Medium uses the standard scoring gate and shortened trajectory. Hard uses a narrow scoring gate and no default prediction; targeting skill restores prediction. Bot base target hit-rate bands remain distinct even as player performance changes. Skill effects can override these base rates.

## Nhảy Sạp game surface
The supplied images are the visual contract for the highland courtyard, green bamboo poles, folk clothing, and jump/fall animation. Keep the game canvas as the focal surface with a compact wood-frame HUD. Use a four-beat cycle at 103 BPM: three open beats offer one randomized direction cue each, followed by one closing beat. The game tokens are night field #19150e, deep wood #28170d, warm wood #553018, bronze #8c531b, bamboo gold #edc35b, safe green #8cbb5c, and fall coral #ff9b68; body copy stays at 12–14px with 20–32px headings. A correct W/A/S/D or arrow-key press moves one tile on a bounded 4-by-3 sạp grid. Missed or incorrect cues leave the dancer in danger when the sạp closes. Controls are touchable buttons; the timing rail sits directly below them. Embed the linked YouTube track with visible playback controls and begin its playback from the player's start action.

## Accepted debt
Existing canvas renderer and legacy style sheet remain in place; scoped festival theme overrides provide a reversible skin. Existing photographic/painted environment and skill card art remain. This is a style adaptation, not pixel-identical replication of the reference dialog.

## Đẩy Gậy: articulated highland duel
The two supplied pictures define art direction, not a screenshot of a web interface. Reuse the supplied 1447×616 mountain arena. Generate a transparent painted Hmong boy parts atlas; render torso, upper arm, forearm, thigh, calf and shoe independently, mirrored for the opponent. Preserve outlined painted shading and embroidered black/red/green clothing. Use a single straight white/red pole and inverse kinematics with fixed bone lengths and hands attached to that pole. Attacking raises that side's pole end, leans the shoulder forward and advances a lifted front foot; defending lowers the hips, widens the stance and increases resistance. Smooth state changes exponentially; fixed 120Hz simulation; no independently regenerated animation frames.

HUD uses existing wood/gold/parchment tokens, red #c74335 for left and teal #2b7975 for right; ring chalk #fff3cf. Reusable primitives are PlayerPanel (stamina, stance), ActionButton (released/held/focus/disabled), AdvantageRail (left/equal/right), MatchDialog (ready/winner/draw). Canvas has a fixed 1447:616 stage with responsive width, HUD and controls reflow at 600px, touch targets at least 44px. Keyboard A/S and L/K maps to attack/defend. Simultaneous inputs choose defense; releasing focus clears held inputs. Pause freezes match time. Reduced motion disables nonessential effects; gameplay motion remains informative. Ring-out uses the outer shoe contact against the chalk ellipse at the fighting lane. At 60s, signed time-integrated territorial advantage determines the winner, within a 2px deadband means draw. Beginner persona gets visible controls and help; keyboard and touch players have the same mechanics. Acceptance requires four stance combinations, both ring-out directions, timeout/draw, pause/restart, responsive screenshots and consecutive-frame joint/hand/length checks.
