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
| Update pipeline (menu/pause/gameplay/world) | 2626-3238 |
| Render pipeline (front screens + world layers + HUD) | 3239-3664 |
| Parallax silhouettes | 3665-3761 |
| Clouds / birds | 3762-3810 |
| Title / mode / zone picker / pause menus | 3811-4112 |
| Main loop + boot | 4113-4135 |

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2619`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`2701`) | `drawTitleScreen` (`3812`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`2719`) | `drawModeSelect` (`3899`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`2743`) | `drawZonePicker` (`3935`) |
| `playing` | `startGame` (`2662`) or pause resume | esc/pause -> `paused` (`3223`) | gameplay renderer via `render()` (`3631`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`2783`) | `drawPauseMenu` (`4006`) overlay |

Note: `galleryMode` (`2403`) is orthogonal to `gameState`; `Tab` toggles preview rendering via `renderFrontScreen` (`3240-3270`).

### Update/Render Dispatch Helpers

- `updateTitleMenuState(dt)` at `teabag-simulator.html:2698`
- `updateModeSelectState()` at `teabag-simulator.html:2703`
- `updateZonePickerState()` at `teabag-simulator.html:2722`
- `updateMenuState(dt)` at `teabag-simulator.html:2744`
- `updatePauseNavigation()` at `teabag-simulator.html:2763`
- `updatePauseSelectionAction()` at `teabag-simulator.html:2774`
- `updatePauseAdjustments()` at `teabag-simulator.html:2788`
- `updatePauseState()` at `teabag-simulator.html:2802`
- `updatePlayerMovementAndJump(dt, p, onNPC)` at `teabag-simulator.html:2811`
- `updateMountedCombatState(p)` at `teabag-simulator.html:2938`
- `updatePlayerTimersAndFX(dt, p, onNPC)` at `teabag-simulator.html:3035`
- `updatePlayerState(dt)` at `teabag-simulator.html:3062`
- `updateNPCFSM(dt, p)` at `teabag-simulator.html:3076`
- `updateNPCSpawning(p)` at `teabag-simulator.html:3136`
- `updateBusStopAmbient(dt, p)` at `teabag-simulator.html:3157`
- `updateNPCState(dt, p)` at `teabag-simulator.html:3172`
- `updateWorldState(dt, p)` at `teabag-simulator.html:3178`
- `updatePlayingState(dt)` at `teabag-simulator.html:3221`
- `update(dt)` dispatcher at `teabag-simulator.html:3233`
- `renderFrontScreen()` at `teabag-simulator.html:3240`
- `renderWorldLayer(sky)` at `teabag-simulator.html:3272`
- `renderEntityLayer()` at `teabag-simulator.html:3360`
- `renderPostFX(sky)` at `teabag-simulator.html:3441`
- `renderHUDLayer()` at `teabag-simulator.html:3486`
- `renderOverlayLayer(sky)` at `teabag-simulator.html:3626`
- `render(dt)` dispatcher at `teabag-simulator.html:3631`

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Movement tuning | constants `GROUND_Y..AIR_ACCEL` (`352-361`) | velocity + accel logic (`2813-2835`, `2891-2935`) | player draw pose (`3429-3435`) |
| Sprint behavior | double-tap capture (`896-911`, `1018-1041`) + `SPRINT_MULT` (`355`) | sprint state calc (`2813-2818`) | sprint particles (`3055-3059`) |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`356-359`) | jump gate + execution (`2859-2886`) | airborne pose flags (`3432-3433`) |
| Drop-through platforms | crouch + platform flags (`2518`) | trigger + clear (`2842-2848`, `2921-2924`) | platform collision (`2897-2919`) |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`362-363`) | teabag loop (`2951-3032`) | hit popups + announcements (`2967-2968`, `3536-3552`) |
| KO + chain scoring | character KO metadata in `CHARACTER_DEFS` (`546+`) | KO branch (`2969-3000`), chain timer (`3039`) | center KO text + chain HUD (`3507-3526`, `3536-3552`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`546-836`) | spawn composition (`2532-2596`) | `drawCharacter` (`1948-2401`) + tracker (`2605-2612`) |
| NPC density / pacing | `MIN_NPCS_ON_SCREEN`, `MAX_NPCS`, `NPC_DESPAWN_DIST` (`365-367`) | spawn/despawn loop (`3104-3130`) | visible pressure in world (same frame) |
| Zone progression / prestige | `ZONES` (`370-461`), `zoneLayout` (`466+`) | zone tracking + prestige trigger (`3167-3179`, `2665-2696`) | zone pill + transition banner (`3587-3622`) |
| Procedural world gen | gen funcs (`1291`, `1498`, `1866`) | called in startup/reset + per-frame update (`2652-2653`, `3187-3194`) | rendered in layer order (`3272-3439`) |
| Persistence | `teabag_save` + `teabag_sfx` keys (`293`, `298`, `480`, `489`) | `saveProgress` (`487`) + `saveSFXSettings` (`297`) | loaded at boot (`293`, `480`) |

## Render Order (Authoritative)

Within `render(dt)` (`3631`), world draw order is:

1. Sky gradient fill (`3641-3646`)
2. Stars + silhouettes + clouds + birds (`3273-3287`)
3. BG buildings (0.3 parallax), FG buildings (0.7), cars (`3289-3295`)
4. Platforms and bus stop structures (`3297-3304`)
5. Sidewalk + ground pattern blend (`3306-3357`)
6. Bus stop NPCs, props, NPCs, player (`3364-3435`)
7. Particles/popups (`3437-3438`)
8. Night + zone tint + prestige postFX (`3442-3483`)
9. HUD + announcements (`3487-3624`)
10. Pause overlay + sidebars (`3654-3662`)

## Update Order (Authoritative)

Within `update(dt)` (`3233`), dispatch flow is:

1. Title/mode/zone menu helpers (`2698-2742`)
2. Menu dispatcher (`2744-2761`)
3. Pause helpers + dispatcher (`2763-2809`)
4. Playing pause gate (`3221-3226`)
5. Player movement/jump systems (`2811-2936`)
6. Mounted combat + head-mount checks (`2938-3033`)
7. Player timers/animation/fx (`3035-3060`)
8. NPC FSM + despawn (`3076-3134`)
9. NPC spawning pressure (`3136-3155`)
10. Bus-stop ambient updates (`3157-3170`)
11. Camera + zone/progression + generation + world systems (`3178-3219`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `352-361`, `2813-2895` |
| Change teabag damage curve | `362-363`, `2962-2964` |
| Change chain window length | `2980`, `3018`, `3039`, HUD bar `3522` |
| Add new NPC type | `546-834` (definition), zone `npcPool` in `370-461` |
| Add new zone | `370-461`, zone blend assumptions `532-543`, render pattern branch `3315+`, silhouettes `3668+` |
| Change spawn pressure | `365-367`, `3136-3155` |
| Change prestige behavior | `2665-2696`, `3167-3179`, postFX `3461-3483` |
| Change pause menu controls | update paused helpers `2763-2809`, renderer `4006-4112` |
| Change touch controls | touch model `933`, mapping `1018-1043`, sidebar UI `1057-1117` |
| Change scoring formula | KO scoring block `2986-2988`, trackers `2598-2612` |

## Search Cheatsheet

Use these from repo root:

- `rg -n "function updateTitleMenuState|function updateModeSelectState|function updateZonePickerState|function updateMenuState|function updatePauseNavigation|function updatePauseSelectionAction|function updatePauseAdjustments|function updatePauseState|function updatePlayerMovementAndJump|function updateMountedCombatState|function updatePlayerTimersAndFX|function updatePlayerState|function updateNPCFSM|function updateNPCSpawning|function updateBusStopAmbient|function updateNPCState|function updateWorldState|function updatePlayingState|function update\(" teabag-simulator.html`
- `rg -n "function renderFrontScreen|function renderWorldLayer|function renderEntityLayer|function renderPostFX|function renderHUDLayer|function renderOverlayLayer|function render\(" teabag-simulator.html`
- `rg -n "// Teabag mechanic|TEABAG_DAMAGE|TEABAG_WINDOW" teabag-simulator.html`
- `rg -n "gameState ===|gameState =" teabag-simulator.html`
- `rg -n "const ZONES =|npcPool|triggerPrestige" teabag-simulator.html`
- `rg -n "visibleNPCs|MIN_NPCS_ON_SCREEN|MAX_NPCS|NPC_DESPAWN_DIST" teabag-simulator.html`
- `rg -n "localStorage|teabag_save|teabag_sfx" teabag-simulator.html`

## Coupling Notes (Avoid Regressions)

- Combo decay is intentionally paused while airborne; it only ticks when `onRealGround` is true (`3037`).
- Chain combo decays only when not mounted (`3039`), and is refreshed on remount (`3018`).
- Teabag uses crouch release timing (`2956-2959`), not crouch press, so input changes can alter DPS unexpectedly.
- Zone unlocks happen both on crossing into a zone (`3175-3177`) and on prestige (`2669-2671`).
- `drawCharacter` is shared by player, NPCs, bus-stop NPCs, title screen, and gallery; style edits have global blast radius.
