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
| Update pipeline (menu/pause/gameplay/world) | 2626-3204 |
| Render pipeline (front screens + world layers + HUD) | 3205-3630 |
| Parallax silhouettes | 3631-3727 |
| Clouds / birds | 3728-3776 |
| Title / mode / zone picker / pause menus | 3777-4078 |
| Main loop + boot | 4079-4101 |

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2619`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`2701`) | `drawTitleScreen` (`3778`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`2719`) | `drawModeSelect` (`3865`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`2743`) | `drawZonePicker` (`3901`) |
| `playing` | `startGame` (`2662`) or pause resume | esc/pause -> `paused` (`3189`) | gameplay renderer via `render()` (`3597`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`2771`) | `drawPauseMenu` (`3972`) overlay |

Note: `galleryMode` (`2403`) is orthogonal to `gameState`; `Tab` toggles preview rendering via `renderFrontScreen` (`3206-3236`).

### Update/Render Dispatch Helpers

- `updateMenuState(dt)` at `teabag-simulator.html:2698`
- `updatePauseState()` at `teabag-simulator.html:2751`
- `updatePlayerMovementAndJump(dt, p, onNPC)` at `teabag-simulator.html:2787`
- `updateMountedCombatState(p)` at `teabag-simulator.html:2914`
- `updatePlayerTimersAndFX(dt, p, onNPC)` at `teabag-simulator.html:3011`
- `updatePlayerState(dt)` at `teabag-simulator.html:3038`
- `updateNPCState(dt, p)` at `teabag-simulator.html:3052`
- `updateWorldState(dt, p)` at `teabag-simulator.html:3144`
- `updatePlayingState(dt)` at `teabag-simulator.html:3187`
- `update(dt)` dispatcher at `teabag-simulator.html:3199`
- `renderFrontScreen()` at `teabag-simulator.html:3206`
- `renderWorldLayer(sky)` at `teabag-simulator.html:3238`
- `renderEntityLayer()` at `teabag-simulator.html:3326`
- `renderPostFX(sky)` at `teabag-simulator.html:3407`
- `renderHUDLayer()` at `teabag-simulator.html:3452`
- `renderOverlayLayer(sky)` at `teabag-simulator.html:3592`
- `render(dt)` dispatcher at `teabag-simulator.html:3597`

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Movement tuning | constants `GROUND_Y..AIR_ACCEL` (`352-361`) | velocity + accel logic (`2788-2811`, `2867-2911`) | player draw pose (`3396-3401`) |
| Sprint behavior | double-tap capture (`896-911`, `1018-1041`) + `SPRINT_MULT` (`355`) | sprint state calc (`2788-2794`) | sprint particles (`3031-3034`) |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`356-359`) | jump gate + execution (`2835-2862`) | airborne pose flags (`3398-3399`) |
| Drop-through platforms | crouch + platform flags (`2518`) | trigger + clear (`2818-2824`, `2897-2900`) | platform collision (`2873-2895`) |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`362-363`) | teabag loop (`2927-3008`) | hit popups + announcements (`2943-2944`, `3502-3518`) |
| KO + chain scoring | character KO metadata in `CHARACTER_DEFS` (`546+`) | KO branch (`2945-2976`), chain timer (`3015`) | center KO text + chain HUD (`3473-3492`, `3502-3518`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`546-836`) | spawn composition (`2532-2596`) | `drawCharacter` (`1948-2401`) + tracker (`2605-2612`) |
| NPC density / pacing | `MIN_NPCS_ON_SCREEN`, `MAX_NPCS`, `NPC_DESPAWN_DIST` (`365-367`) | spawn/despawn loop (`3104-3128`) | visible pressure in world (same frame) |
| Zone progression / prestige | `ZONES` (`370-461`), `zoneLayout` (`466+`) | zone tracking + prestige trigger (`3157-3169`, `2665-2696`) | zone pill + transition banner (`3553-3588`) |
| Procedural world gen | gen funcs (`1291`, `1498`, `1866`) | called in startup/reset + per-frame update (`2652-2653`, `3177-3184`) | rendered in layer order (`3238-3405`) |
| Persistence | `teabag_save` + `teabag_sfx` keys (`293`, `298`, `480`, `489`) | `saveProgress` (`487`) + `saveSFXSettings` (`297`) | loaded at boot (`293`, `480`) |

## Render Order (Authoritative)

Within `render(dt)` (`3597`), world draw order is:

1. Sky gradient fill (`3607-3612`)
2. Stars + silhouettes + clouds + birds (`3239-3253`)
3. BG buildings (0.3 parallax), FG buildings (0.7), cars (`3255-3261`)
4. Platforms and bus stop structures (`3263-3270`)
5. Sidewalk + ground pattern blend (`3272-3323`)
6. Bus stop NPCs, props, NPCs, player (`3330-3401`)
7. Particles/popups (`3403-3404`)
8. Night + zone tint + prestige postFX (`3408-3449`)
9. HUD + announcements (`3453-3590`)
10. Pause overlay + sidebars (`3620-3628`)

## Update Order (Authoritative)

Within `update(dt)` (`3199`), dispatch flow is:

1. Menu-state helper (`2698-2749`)
2. Pause-state helper (`2751-2785`)
3. Playing pause gate (`3187-3192`)
4. Player movement/jump systems (`2787-2912`)
5. Mounted combat + head-mount checks (`2914-3009`)
6. Player timers/animation/fx (`3011-3036`)
7. NPC FSM + spawn/despawn + bus-stop ambient (`3052-3142`)
8. Camera + zone/progression + generation + world systems (`3144-3185`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `352-361`, `2788-2871` |
| Change teabag damage curve | `362-363`, `2938-2940` |
| Change chain window length | `2956`, `2994`, `3015`, HUD bar `3488` |
| Add new NPC type | `546-834` (definition), zone `npcPool` in `370-461` |
| Add new zone | `370-461`, zone blend assumptions `532-543`, render pattern branch `3281+`, silhouettes `3634+` |
| Change spawn pressure | `365-367`, `3104-3128` |
| Change prestige behavior | `2665-2696`, `3157-3169`, postFX `3427-3449` |
| Change pause menu controls | update paused helper `2751-2785`, renderer `3972-4078` |
| Change touch controls | touch model `933`, mapping `1018-1043`, sidebar UI `1057-1117` |
| Change scoring formula | KO scoring block `2962-2964`, trackers `2598-2612` |

## Search Cheatsheet

Use these from repo root:

- `rg -n "function updatePlayerMovementAndJump|function updateMountedCombatState|function updatePlayerTimersAndFX|function updatePlayerState|function updateNPCState|function updateWorldState|function updatePlayingState|function update\(" teabag-simulator.html`
- `rg -n "function renderFrontScreen|function renderWorldLayer|function renderEntityLayer|function renderPostFX|function renderHUDLayer|function renderOverlayLayer|function render\(" teabag-simulator.html`
- `rg -n "// Teabag mechanic|TEABAG_DAMAGE|TEABAG_WINDOW" teabag-simulator.html`
- `rg -n "gameState ===|gameState =" teabag-simulator.html`
- `rg -n "const ZONES =|npcPool|triggerPrestige" teabag-simulator.html`
- `rg -n "visibleNPCs|MIN_NPCS_ON_SCREEN|MAX_NPCS|NPC_DESPAWN_DIST" teabag-simulator.html`
- `rg -n "localStorage|teabag_save|teabag_sfx" teabag-simulator.html`

## Coupling Notes (Avoid Regressions)

- Combo decay is intentionally paused while airborne; it only ticks when `onRealGround` is true (`3013`).
- Chain combo decays only when not mounted (`3015`), and is refreshed on remount (`2994`).
- Teabag uses crouch release timing (`2932-2935`), not crouch press, so input changes can alter DPS unexpectedly.
- Zone unlocks happen both on crossing into a zone (`3165-3167`) and on prestige (`2669-2671`).
- `drawCharacter` is shared by player, NPCs, bus-stop NPCs, title screen, and gallery; style edits have global blast radius.
