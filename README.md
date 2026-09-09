# Cinder Circuit

[![Test and deploy](https://github.com/padmashri23/gpt-6_Astra_test/actions/workflows/deploy.yml/badge.svg)](https://github.com/padmashri23/gpt-6_Astra_test/actions/workflows/deploy.yml)

A complete single-player browser 3D arcade fighter. Three original fighters, two modeled arenas, a two-bout arcade circuit, quick matches, and training. All combat, character geometry, animation, environments, effects, and synthesized music are authored for this project. No assets from existing fighting games are used.

## Play

**[Play it in your browser](https://padmashri23.github.io/gpt-6_Astra_test/)** — deployed from `main` by GitHub Actions. Needs a WebGL-capable browser; a keyboard is recommended.

On Windows, double-click **start-game.cmd**. It serves the included production build and opens the game. Keep the terminal open while playing. Node.js **22.12 or later** is required. With the included `dist/` build, no package installation or internet connection is needed.

On any platform, play the included build with:

```sh
node serve.mjs --open
```

To develop or rebuild from source, run these commands from this folder (installing dependencies needs an internet connection):

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Chrome or Edge with hardware acceleration is recommended. A keyboard and a landscape desktop display provide the best experience.

For the production build:

```sh
npm run build
npm run preview
```

Open **http://127.0.0.1:4173**. `dist/` contains the complete static production game. Serve this directory with an HTTP server; opening `index.html` through `file://` is unsupported. Audio starts after the first click. No accounts, API keys, paid services, or remote game servers are required.

## Controls

| Input | Action |
| --- | --- |
| A / D or left / right arrows | Walk |
| Shift + A / D | Run |
| W / S | Sidestep in depth |
| Space | Jump |
| C or down arrow | Crouch |
| J | Quick punch; crouching rising palm |
| K | Kick; crouching low sweep; airborne kick |
| I | Heavy knockdown strike |
| L (hold) | Standing guard |
| C + L (hold) | Low guard |
| U | Short-range throw |
| O | Character special, costs 50 charge |
| Escape / P | Pause, settings, move list, restart |
| R in training | Reset training |

Touch buttons are available on touch devices. For combos, tap the next attack around contact, or as the current strike recovers. Don't hold attack keys; repeat presses are separate moves. The pause menu and How to Play screen list each fighter's chains.

## Fighters

| Fighter | Style | Special | Passive |
| --- | --- | --- | --- |
| Rhea Vale | Fast kickboxing, extended kick reach, 100 health | Gale Driver: advancing spin kick | Slip charge: successfully sidestep an attack for bonus meter |
| Bram Kor | Slower power boxing, stronger throws, 115 health | Foundry Rush: advancing double-fist crush | Iron reserve: gain extra meter when blocking |
| Sable Nyx | Mobile acrobatics, 102 health | Orbit Breaker: low spinning special | Second wind: combo finishers restore 4 health |

Each fighter has three named, three-input combo finishers. Landing three consecutive hits forces a knockdown. Follow-up hits scale to 82%, then 64% damage; successful finishers add a damage bonus. Recovery has a protected window. These rules prevent unlimited stun chains.

High guard blocks high and mid strikes. Crouching evades highs; low guard blocks sweeps but loses to mids. Throws beat blocking, but miss crouching or airborne targets and have very short reach. Specials spend meter even when they miss. The meter replenishes slowly and also builds through combat.

## Game systems

- Articulated, faceted 3D characters with idle, walk, run, jump, crouch, guard, punch, kick, sweep, heavy, throw, special, hit, knockdown, recovery, and victory poses.
- Circular bounded arena movement, body separation, range and forward-cone hit detection, height checks, startup/active/recovery timing, locked strike direction, short input buffering, interruption, and damage scaling.
- Health and charge HUD, hit feedback, combo counter, 60-second rounds, draws, timeouts using health percentages, first-to-two rounds, KO, victory/defeat, restart and rematch.
- Rookie, Contender, and Veteran CPU profiles with reaction delays, range decisions, guard reads, low attacks, throws, combo attempts, specials, and sidesteps.
- Two fully modeled stages: The Sundown Foundry and The Quiet Reservoir.
- Main menu, fighter/arena/opponent selection, training dummy behavior, training reset and charge refill, pause, move guide, audio/effects settings, and two-bout arcade progression.
- Original Web Audio percussion, bass, melody, and action effects; transient hit particles, hit stop, camera impact, and animated UI.
- Responsive HUD and touch controls; automatic pause on focus loss; local settings storage; locally bundled fonts and artwork.

## Project structure

- `src/combat.js`: renderer-independent 60 Hz combat simulation and CPU.
- `src/data.js`: fighter attributes, moves, combos, stages and difficulty profiles.
- `src/scene.js`: Three.js models, skeletal-style procedural animation, stages, lighting, particles and camera.
- `src/audio.js`: synthesized score and effects.
- `src/main.js`: menus, input, HUD, match lifecycle, audio and render integration.
- `src/style.css`: responsive visual system.
- `tests/combat.test.js`: deterministic mechanics and match regression tests.
- `tests/browser.mjs`: actual-browser interaction, match and responsive tests.
- `public/assets/`: original generated menu key art and bundled OFL fonts.
- `docs/design-concept.png`: initial visual direction.

## Run the tests

```sh
npm test
# Start the dev server in a second terminal, then:
npm run test:browser
```

Browser tests use installed Chrome through Playwright. Set `CINDER_BROWSER=msedge` to use installed Edge. Screenshots and browser results are saved under the operating system temporary directory, in `cinder-qa`. A read-only diagnostic snapshot is available at `window.cinder.snapshot()`. Controlled simulation setup is enabled only with `?test=1` on localhost; the browser regression suite uses it to isolate scenarios, alongside real keyboard input and complete unforced matches.

See **TESTING.md** for the verification results, bugs fixed, and scope of testing.

## Scope and limitations

- Single-player versus CPU only. No local multiplayer, networking, rollback, gamepad mapping, saved campaign, or custom controls.
- Stylized procedural 3D models and animation, rather than motion capture or cinematic character fidelity. The menu uses original illustrated key art; live fights use actual 3D geometry.
- Hit detection uses gameplay reach, a directional cone, and height rules, rather than per-limb mesh collision. Throws have a short authored clinch/reaction sequence rather than a paired motion-captured grapple.
- This is a compact two-bout circuit, not a large story campaign. Arenas have solid movement limits, with no ring-outs or destructible scenery.
- Audio is a lightweight synthesized score. Audio output is browser-tested electronically; subjective listening quality is not certified.
- Desktop Chrome/Edge is the primary target. Touch is a convenience; sustained play on physical phones, Safari, and Firefox has not been verified. Software-only graphics use reduced resolution and no dynamic shadows, and may still run slowly.
- Balance has been exercised through deterministic simulations and browser matches, but is not supported by a large human playtest sample.

## Assets and licenses

All fighter identities, costume geometry, stage geometry, animation rules, combat code, generated artwork and synthesized sound sequences were created for this project. The main-menu artwork was generated with the built-in image generation tool; no reference game characters or assets were used. Typography uses **Barlow** and **Barlow Condensed**, distributed under the SIL Open Font License; license files are included in `public/assets/`. Three.js, Vite, and Playwright retain their respective open-source licenses. See `docs/ART.md` for the artwork brief and visual implementation notes.
