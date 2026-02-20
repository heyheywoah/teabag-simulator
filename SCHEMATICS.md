# Teabag Simulator Schematics Map

Line-anchored reference for `teabag-simulator.html` so edits can target the correct mechanic quickly.

## Section Map (By Line Range)

| Area | Lines |
| --- | --- |
| SFX Engine | 23-303 |
| Resolution / canvas setup | 307-344 |
| Core constants | 351-368 |
| Zones + biome data | 369-464 |
| Zone runtime state + persistence | 465-531 |
| Zone blending | 532-543 |
| Character definitions (all NPC archetypes) | 544-837 |
| Day/night system | 838-889 |
| Keyboard input | 890-930 |
| Mobile touch input | 931-1055 |
| Mobile sidebars render | 1056-1119 |
| Particles / popups / camera | 1120-1222 |
| Platform + bus stop generation | 1223-1399 |
| City/building/prop generation + draw | 1400-1832 |
| Cars | 1833-1943 |
| Character renderer | 1947-2401 |
| Character gallery mode | 2402-2508 |
| Player model | 2509-2522 |
| NPC model + spawning | 2523-2597 |
| Score + KO tracking | 2598-2617 |
| Global game state | 2618-2625 |
| Update pipeline (menu/pause/gameplay/world) | 2626-3194 |
| Render pipeline (front screens + world layers + HUD) | 3195-3613 |
| Parallax silhouettes | 3614-3710 |
| Clouds / birds | 3711-3759 |
| Title / mode / zone picker / pause menus | 3760-4061 |
| Main loop + boot | 4062-4084 |

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2619`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`2701`) | `drawTitleScreen` (`3761`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`2719`) | `drawModeSelect` (`3848`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`2743`) | `drawZonePicker` (`3884`) |
| `playing` | `startGame` (`2662`) or pause resume | esc/pause -> `paused` (`3179`) | gameplay renderer via `render()` (`3580`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`2771`) | `drawPauseMenu` (`3955`) overlay |

Note: `galleryMode` (`2403`) is orthogonal to `gameState`; `Tab` toggles preview rendering via `renderFrontScreen` (`3196-3226`).

### Update/Render Dispatch Helpers

- `updateMenuState(dt)` at `teabag-simulator.html:2698`
- `updatePauseState()` at `teabag-simulator.html:2751`
- `updatePlayerState(dt)` at `teabag-simulator.html:2787`
- `updateNPCState(dt, p)` at `teabag-simulator.html:3042`
- `updateWorldState(dt, p)` at `teabag-simulator.html:3134`
- `updatePlayingState(dt)` at `teabag-simulator.html:3177`
- `update(dt)` dispatcher at `teabag-simulator.html:3189`
- `renderFrontScreen()` at `teabag-simulator.html:3196`
- `renderWorldLayer(sky)` at `teabag-simulator.html:3228`
- `renderEntityLayer()` at `teabag-simulator.html:3316`
- `renderOverlayLayer(sky)` at `teabag-simulator.html:3397`
- `render(dt)` dispatcher at `teabag-simulator.html:3580`

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Movement tuning | constants `GROUND_Y..AIR_ACCEL` (`352-361`) | velocity + accel logic (`2795-2817`, `2873-2917`) | player draw pose (`3386-3391`) |
| Sprint behavior | double-tap capture (`896-911`, `1018-1041`) + `SPRINT_MULT` (`355`) | sprint state calc (`2795-2801`) | sprint particles (`3034-3037`) |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`356-359`) | jump gate + execution (`2841-2868`) | airborne pose flags (`3388-3389`) |
| Drop-through platforms | crouch + platform flags (`2518`) | trigger + clear (`2824-2830`, `2904-2906`) | platform collision (`2879-2901`) |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`362-363`) | teabag loop (`2931-3012`) | hit popups + announcements (`2947-2948`, `3491-3506`) |
| KO + chain scoring | character KO metadata in `CHARACTER_DEFS` (`546+`) | KO branch (`2949-2980`), chain timer (`3017`) | center KO text + chain HUD (`3461-3479`, `3491-3506`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`546-836`) | spawn composition (`2532-2596`) | `drawCharacter` (`1948-2401`) + tracker (`2605-2612`) |
| NPC density / pacing | `MIN_NPCS_ON_SCREEN`, `MAX_NPCS`, `NPC_DESPAWN_DIST` (`365-367`) | spawn/despawn loop (`3094-3118`) | visible pressure in world (same frame) |
| Zone progression / prestige | `ZONES` (`370-461`), `zoneLayout` (`466+`) | zone tracking + prestige trigger (`3147-3159`, `2665-2696`) | zone pill + transition banner (`3541-3576`) |
| Procedural world gen | gen funcs (`1291`, `1498`, `1866`) | called in startup/reset + per-frame update (`2652-2653`, `3167-3174`) | rendered in layer order (`3228-3395`) |
| Persistence | `teabag_save` + `teabag_sfx` keys (`293`, `298`, `480`, `489`) | `saveProgress` (`487`) + `saveSFXSettings` (`297`) | loaded at boot (`293`, `480`) |

## Render Order (Authoritative)

Within `render(dt)` (`3580`), world draw order is:

1. Sky gradient fill (`3590-3595`)
2. Stars + silhouettes + clouds + birds (`3229-3243`)
3. BG buildings (0.3 parallax), FG buildings (0.7), cars (`3245-3251`)
4. Platforms and bus stop structures (`3253-3260`)
5. Sidewalk + ground pattern blend (`3262-3313`)
6. Bus stop NPCs, props, NPCs, player (`3320-3391`)
7. Particles/popups (`3393-3394`)
8. Night + zone tint + prestige postFX (`3398-3439`)
9. HUD + announcements (`3441-3577`)
10. Pause overlay + sidebars (`3603-3611`)

## Update Order (Authoritative)

Within `update(dt)` (`3189`), dispatch flow is:

1. Menu-state helper (`2698-2749`)
2. Pause-state helper (`2751-2785`)
3. Playing pause gate (`3177-3183`)
4. Player physics/input/combo systems (`2787-3040`)
5. NPC FSM + spawn/despawn + bus-stop ambient (`3042-3132`)
6. Camera + zone/progression + generation + world systems (`3134-3175`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `352-361`, `2795-2877` |
| Change teabag damage curve | `362-363`, `2942-2944` |
| Change chain window length | `2960`, `2998`, `3017`, HUD bar `3476` |
| Add new NPC type | `546-834` (definition), zone `npcPool` in `370-461` |
| Add new zone | `370-461`, zone blend assumptions `532-543`, render pattern branch `3271+`, silhouettes `3617+` |
| Change spawn pressure | `365-367`, `3094-3118` |
| Change prestige behavior | `2665-2696`, `3147-3159`, postFX `3417-3439` |
| Change pause menu controls | update paused helper `2751-2785`, renderer `3955-4061` |
| Change touch controls | touch model `933`, mapping `1018-1043`, sidebar UI `1057-1117` |
| Change scoring formula | KO scoring block `2966-2968`, trackers `2598-2612` |

## Search Cheatsheet

Use these from repo root:

- `rg -n "function updatePlayerState|function updateNPCState|function updateWorldState|function updatePlayingState|function update\(" teabag-simulator.html`
- `rg -n "function renderFrontScreen|function renderWorldLayer|function renderEntityLayer|function renderOverlayLayer|function render\(" teabag-simulator.html`
- `rg -n "// Teabag mechanic|TEABAG_DAMAGE|TEABAG_WINDOW" teabag-simulator.html`
- `rg -n "gameState ===|gameState =" teabag-simulator.html`
- `rg -n "const ZONES =|npcPool|triggerPrestige" teabag-simulator.html`
- `rg -n "visibleNPCs|MIN_NPCS_ON_SCREEN|MAX_NPCS|NPC_DESPAWN_DIST" teabag-simulator.html`
- `rg -n "localStorage|teabag_save|teabag_sfx" teabag-simulator.html`

## Coupling Notes (Avoid Regressions)

- Combo decay is intentionally paused while airborne; it only ticks when `onRealGround` is true (`3015`).
- Chain combo decays only when not mounted (`3017`), and is refreshed on remount (`2998`).
- Teabag uses crouch release timing (`2936-2940`), not crouch press, so input changes can alter DPS unexpectedly.
- Zone unlocks happen both on crossing into a zone (`3155-3157`) and on prestige (`2669-2671`).
- `drawCharacter` is shared by player, NPCs, bus-stop NPCs, title screen, and gallery; style edits have global blast radius.
