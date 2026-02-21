# TEABAG SIMULATOR

You know that move in online games that makes you want to throw your controller through the TV? The one that's been getting people reported since Halo 2? Yeah, we made a whole game about it.

Jump on strangers. Crouch repeatedly. Watch numbers go up. Question your life choices. Repeat.

**https://heyheywoah.github.io/teabag-simulator/**

Works on desktop and mobile. Add to home screen on your phone for the full degenerate experience.

## How To Play

Land on an NPC's head to mount them. Mash crouch to teabag. Each bob does damage. KO them, launch off, land on the next one. Chain KOs for multipliers. That's it. That's the game.

### Desktop Controls

| Key               | Action               |
| ----------------- | -------------------- |
| A / D (or arrows) | Move left / right    |
| W (or up arrow)   | Jump / double jump   |
| S / Space         | Crouch / teabag      |
| Double-tap A or D | Sprint               |
| Down on platform  | Drop through         |
| ESC / P           | Pause                |
| Tab               | Character gallery    |
| T                 | Toggle touch overlay |

### Mobile Controls

- **Left sidebar** — D-pad (move, navigate menus)
- **Right sidebar** — Jump button, Bag button (crouch/teabag), Pause button
- Double-tap a direction to sprint

## Game Modes

**Campaign** — Travel through all 6 zones left to right. Reach the end and prestige to loop with harder NPCs and increasingly unhinged visual effects (vignette, scanlines, chromatic aberration).

**Endless** — Pick any unlocked zone and go forever.

## Zones

| Zone               | Vibe                                                                           |
| ------------------ | ------------------------------------------------------------------------------ |
| Downtown           | Skyscrapers, bus stops, hydrants. The classic.                                 |
| Shopping District  | Storefronts, awnings, brick sidewalks. Shopaholics and influencers roam.       |
| Park               | Trees, fountains, benches. Joggers and dog walkers minding their own business. |
| Red Light District | Neon signs, dark buildings, purple haze. Bouncers will test your patience.     |
| Industrial         | Warehouses, smokestacks, barrels. Forklift Phil doesn't go down easy.          |
| Suburbs            | Picket fences, mailboxes, triangle roofs. Karen lives here.                    |

## NPC Roster

### Common

- **Pedestrian** — Your everyday victim. Randomized appearance.
- **Small** — Shorter, less health. Easy pickings.
- **Tall** — Lankier, more health.

### Special (named, unique KO text)

- **Muscle** (BEAST DOWN) — Wide, tanky, angry brows.
- **Sumo** (SUMO DOWN) — Round boy. Big belly. Mawashi belt. 600 HP.
- **Giant/Titan** (TITAN FELLED) — Tallest in the game.
- **Chad** (CHAD REKT) — Pompadour, blue eyes, green shorts.
- **Karen** (MANAGER'D) — Asymmetric bob. Sunglasses on forehead.
- **Babushka** (BABUSHKA NAP) — Headscarf, floral dress, built like a tank.
- **Gym Girl** (NO REPS LEFT) — High ponytail, exposed midriff.
- **Baller** (BENCHED) — Jersey #69, headband, fade haircut.
- **Goth Mommy** (MOMMY ISSUES) — The final boss of bus stops.

### Zone-Exclusive

Shopaholic, Influencer, Jogger, Dog Walker (gallery preview includes companion dog), Club Dude, Party Girl, Sundress Girl, Bouncer, Hard Hat, Forklift Phil, Soccer Mom, Mailman, Lawn Dad

## Mechanics

- **Mounting** — Land on an NPC's head from above. They panic.
- **Teabagging** — Rapidly crouch/uncrouch while mounted. Each bob within the timing window deals damage and builds combo.
- **Combo** — Consecutive teabags on a single NPC. Increases damage per hit.
- **Chain Combo** — KO an NPC, launch off, mount another within 3 seconds. Chain multiplier applies to score. Timer refreshes on each mount.
- **Aerial Bonus** — Mount a new NPC while your chain is active for bonus points.
- **Double Jump** — Jump again mid-air. Puff ring particle effect.
- **Sprint** — Double-tap a direction. 2.31x speed. Preserves momentum in air.
- **Coyote Time** — 80ms grace period to jump after leaving a ledge.
- **Jump Buffer** — 100ms input buffer for pre-landing jumps.
- **Drop Through** — Crouch on a platform to fall through it (Smash Bros style).
- **Prestige** — Campaign only. Walk past the final zone to loop. NPCs get +50% HP per prestige. Visual effects stack.

## World Generation

Everything is procedurally generated in both directions as you move:

- **Buildings** — Zone-specific architecture (skyscrapers, storefronts, pavilions, warehouses, houses) with foreground (0.7x parallax) and background (0.3x parallax) layers
- **Silhouettes** — Deep background layer (0.05x parallax) with zone-appropriate shapes
- **Platforms** — Smash Bros-style one-way platforms, randomly distributed
- **Bus Stops** — Downtown only. Custom sprite shelter with 1-5 NPCs who panic when you're nearby. Rare Goth Mommy spawn.
- **Props** — Zone-specific (lamps, hydrants, benches, trees, fountains, neon signs, barrels, smokestacks, mailboxes, fences)
- **Traffic** — Sedans, SUVs, sports cars, vans, pickups, and buses drive behind the sidewalk layer
- **Zone Blending** — 600-unit crossfade between zones (sky tint, ground pattern, silhouettes, building styles)

## Day/Night Cycle

300-second cycle (5 minutes = 24 hours). 12 sky gradient stops from midnight through dawn, sunrise, noon, golden hour, sunset, dusk, and back. Stars twinkle at night. Building windows light up. Ambient darkness overlay.

## SFX

10 synthesized sound effects built with the Web Audio API — no audio files. Sounds are defined as modular node graphs in `sfx/sounds.js` and played by an inline engine in the game.

| Sound          | Trigger                  |
| -------------- | ------------------------ |
| jump           | First jump               |
| doubleJump     | Second jump              |
| land           | Hard landing (vy > 200)  |
| mount          | Landing on an NPC's head |
| teabagHit      | Each teabag bob          |
| ko             | NPC health reaches 0     |
| menuSelect     | Confirming a menu option |
| menuNav        | Navigating menus         |
| zoneTransition | Entering a new zone      |
| prestige       | Completing the zone loop |

Volume and mute controls in the pause menu. Persisted to localStorage.

## Dev Tools

### Sound Designer (`sound-designer.html`)

Standalone tool for crafting game sounds using the Web Audio API. Modular synth-style node graph with:

- **4 layers per sound** — Each with its own source, waveshaper, filter, LFO, and gain
- **Source types** — Sine, square, sawtooth, triangle, white/pink/brown noise, FM synthesis
- **Effects chain** — Delay, reverb, chorus, phaser, compressor, distortion, EQ, bitcrusher, tremolo
- **ADSR envelope** — Attack, decay, sustain, release with visual curve
- **Real-time visualization** — Oscilloscope waveform, frequency spectrum, envelope/filter curves
- **12 sound slots** with randomize, copy/paste, export JSON, import JSON, copy as JS
- **Keyboard shortcuts** — Space to preview, R to randomize, 1-0 for quick slot select

### NPC Character Designer (`npc-designer.html`)

Standalone character-authoring tool for building layered NPC pose sheets before game integration.

- **Editable base forms** — Start from `male_base` or `female_base`, then fully edit every base layer
- **Three independent poses** — `normal`, `panic`, `ko` workspaces with copy-pose actions
- **Tool surface** — Select, move, resize handles, rectangle, ellipse, line, curve, polygon, color, gradient, eyedropper, hand + zoom controls
- **Layer workflow** — Multi-select (Shift/Cmd/Ctrl), rename, reorder, hide/show, lock/unlock, duplicate, delete, group move/resize
- **Height references** — Toggle lines and labels derived from current game character dimensions (plus optional silhouette overlays)
- **Live previews** — Side-by-side previews for all three poses with facing-direction toggle
- **Runtime-parity preview** — Dedicated preview panel that calls the shared game `drawCharacter` renderer with pose/facing/scale/tick controls plus world-context silhouettes
- **Constraint UX** — Always-visible Design Readiness panel and Constraint Reference panel with hard blockers vs warnings and jump-to-target issue navigation
- **Visual-rule override workflow** — Hard Safety rules always block compact export; visual issues become warnings when Strict Visual Rules is OFF (optional auto-fix when strict is ON)
- **JSON round-trip** — Export/import full editable JSON, copy/download JSON, plus compact integration payload export for downstream character conversion

#### NPC Designer Usage

1. Open `npc-designer.html`.
2. Pick a base template (`male_base` or `female_base`).
3. Choose a pose tab (`normal`, `panic`, `ko`) and edit layers.
4. Configure Runtime Preview Profile values (base NPC type, runtime npcType, scale/health/colors/hair/body toggles).
5. Use layer controls for selection/group transforms and ordering.
6. Toggle height references to compare proportions against existing roster sizes.
7. Watch Design Readiness for hard blockers/warnings and use jump links to navigate directly to fields/poses/layers.
8. Use Runtime-Parity Preview to validate runtime shape/animation parity before export.
9. Export editable JSON for continued iteration or import JSON to restore state.
10. Export compact payload when hard blockers are clear.

## Tech

Single HTML file game. Canvas 2D rendering at 960x540 (2x pixel scale). No frameworks, no build step, no dependencies. The entire game — physics, rendering, UI, input, generation, particles, day/night, SFX engine — is inline JavaScript.

PWA-enabled with service worker and manifest for offline play and home screen install.

## Credits

by [heyheywoah](https://github.com/heyheywoah) + claude opus
