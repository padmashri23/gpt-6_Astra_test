# Verification and fixes

Tested on Windows with Node.js 24.12, Playwright 1.58.2, and installed Chrome using Intel UHD hardware acceleration. Browser plugin was unavailable, so Playwright was used. The browser was actually launched; interaction checks use real keyboard/touch events. This is not a build-only verification.

## Results

- **41 deterministic combat tests pass** (`npm test`).
- **26 browser checks pass** (`npm run test:browser`).
- **Six complete unforced browser matches** were played across two build/test cycles, using all three playable fighters and all three difficulty levels. Match health and wins were not forced for these runs.
- Additional production-build checks cover five extreme camera arrangements, training CPU activation, focus loss, held-input clearing, help navigation, graphics-resource disposal, real-time timer behavior, responsive layout, and emulated touch attacks (`node tests/edge-cases.mjs`).
- Desktop viewport: **1440 × 900**. Narrow viewport: **390 × 844**. Touch landscape viewport: **844 × 390**.
- Build completes without errors. The main module and Three.js are split into separate chunks. All runtime fonts and images are served locally.

Final full-match regression sample (the input driver is an automated keyboard player, not a human balance panel):

| CPU | Player fighter | Result | Wall-clock duration | Player / CPU hits | Average FPS |
| --- | --- | --- | --- | --- | --- |
| Rookie | Rhea Vale | 2–1 win | 89 s | 26 / 18 | 60 |
| Contender | Bram Kor | 0–2 loss | 43 s | 8 / 19 | 59 |
| Veteran | Sable Nyx | 0–2 loss | 39 s | 6 / 19 | 60 |

Earlier full matches lasted 76, 43, and 41 seconds, respectively, and also completed normally. Deterministic tests additionally run 15 complete CPU matches: one per difficulty and a 12-match seeded Rookie/Veteran comparison. Veteran pressure completed those comparisons faster than Rookie pressure.

## Requested test coverage

| System | Verification |
| --- | --- |
| Movement | Real A/D walking, Shift running, arena boundary and body separation tests |
| Jumping / sidestepping | Real Space/W/S input, landing, height-based evasion, out-of-cone misses |
| Every attack | Keyboard punches, kicks, heavy, sweep, rising palm, airborne kick, throw and special; fighter-specific rules in deterministic tests |
| Blocking | Player and CPU guard in browser; high/low/mid interactions and damage prevention in simulation |
| Grabs | Guard-breaking throw; misses on crouched, airborne, out-of-range or stunned targets |
| Combos | All nine named chains; real J/J/K finisher; scaling, buffering, interrupted attacks, hit-freeze input preservation |
| Hit detection | Range, direction, height, one-hit-per-attack, interrupted-strike cancellation |
| Damage | Exact rounded damage, fighter power multipliers, scaling, healing, health clamps |
| Knockdown / recovery | Heavy/throw/finisher knockdowns, protected recovery, return of control, sustained-spam regression |
| CPU | Movement, defense, offense, combos, specials, training activation and complete matches |
| Round transitions | Health/position resets, round count, first-to-two scoring |
| KO / timeout | Zero-health KO, percentage-health timeout result, tied-round replay, match end |
| Character selection | All three fighters, both arenas, opponent selector and difficulty settings |
| Menus / pause | Main menu, help, selection, pause, frozen simulation, settings, return navigation |
| Restart / replay | Restart from pause, training reset, results → rematch, fighter changes |
| Difficulty | All three in real matches, plus seeded comparisons |
| Camera | Five extreme arrangements, depth alignment, in-frame head/foot projection, responsive zoom |
| Audio / effects | Nonzero Web Audio output, running audio context, actual hit particles, special animation and camera impact |
| Progression | Two consecutive arcade bouts, arena change, champion result |
| Resources / stability | Twelve character/stage rebuilds: geometry count 133 → 130, textures 5 → 5; no growth or application errors |

Controlled setup is used to isolate attack/defense cases and exercise both result paths. Full-match runs use normal health, CPU decisions, round timing and keyboard play. Audio is tested electronically; no claim of human listening evaluation is made.

## Bugs discovered and fixed

1. **Contact-frame combo inputs disappeared.** The impact-freeze branch returned before reading an attack. It now retains the input in the attack buffer. A test first reproduced the failure (`jab` remained active instead of canceling into `kick`), then passed after the fix.
2. **Round announcements were effectively invisible.** Replacing their HTML on every frame restarted the entrance animation. HTML updates now occur only when the announcement changes. Screenshots confirm visible ROUND/READY/FIGHT/KO messages.
3. **Slow rendering stretched the intro and timer.** The frame accumulator discarded elapsed time beyond 50 ms. It now catches up fixed 60 Hz steps for up to 250 ms per frame; FPS diagnostics use actual wall time. A two-second production-browser check advanced the timer by approximately 2.02 seconds.
4. **Test-browser software rendering was extremely slow.** The bundled browser selected SwiftShader. Testing switched to installed Chrome's real Intel GPU; the game also detects software rendering, lowers resolution, and disables dynamic shadows. Static stage meshes are batched, reducing the scene from roughly 271 to 133 visible render calls. Hardware matches average 59–60 FPS. Very slow software rendering remains a documented limitation.
5. **External font loading failed under network restrictions.** Font files and licenses are now bundled locally. The production game does not need external font or asset requests.
6. **Fighters could obscure one another when lined up in depth.** A damped, bounded camera orbit now separates their silhouettes. Movement transforms with the view. Projection tests confirm that both fighters remain framed at extreme positions.
7. **Narrow-screen menu artwork created horizontal overflow during its entrance animation.** The application viewport now clips decorative overflow. The 390 px regression passes.
8. **Landscape touch menu controls overlapped the footer.** Short landscape displays now use a two-column title/menu arrangement; decorative footer text does not intercept input.
9. **Repeated help shortcuts could make Help its own back destination.** Opening Help while already there is ignored. Escape reliably returns to the match.
10. **Some skyline antennae floated above their buildings.** Roof and window heights were corrected after screenshot inspection.

A browser-test timing issue was also fixed: the combo test originally checked for an idle state before the next animation frame had consumed its keyboard event. The harness now waits for the attack to start before waiting for recovery. This was a test race, not a reported gameplay defect.

## Quality improvements after full play

- Kept combo inputs through hit freeze, where a player naturally taps the next strike.
- Made the pair easier to read during sidesteps with a limited camera orbit and view-relative movement.
- Preserved a three-hit knockdown cap, damage scaling, and recovery protection after sustained attack-spam checks.
- Added three genuinely different special poses: Rhea's advancing kick, Bram's double-fist rush, and Sable's low spin.
- Improved guard posture, floor surface detail, arena framing, skyline placement, and portrait camera zoom.
- Added a no-install production launcher, local font assets, and a graceful WebGL-unavailable message.

## Visual QA and evidence

The menu was inspected against `docs/design-concept.png` with the image-viewing tool, together with actual browser screenshots. Compared layout, cream/charcoal/lime palette, condensed italic type, menu geometry, image composition, spacing, and health/timer styling. The actual primary menu labels match the intended four choices. The concept's decorative preview HUD and invented small labels were intentionally omitted from the menu; the HUD is functional in the fight screen. Live 3D characters intentionally use a simpler faceted style than the illustrated menu art.

Screenshots and machine-readable browser results are in the OS temporary folder **cinder-qa**. Useful files include `menu.png`, `select-reservoir.png`, `combo.png`, `special.png`, `pause.png`, `champion.png`, `match-easy.png`, `match-normal.png`, `match-hard.png`, `camera-depth.png`, `mobile-menu.png`, `mobile-select.png`, `mobile-fight.png`, and `touch-landscape.png`.

## Remaining limitations

No known blocking combat or navigation defects remain in the tested desktop flows. This does not establish bug-free behavior on all hardware. Untested areas include physical-phone performance, Safari/Firefox, gamepad support (not implemented), multiplayer (not implemented), broad human balance testing, and subjective audio quality. Collision and animation are deliberately simplified arcade systems. See README.md for the complete scope.
