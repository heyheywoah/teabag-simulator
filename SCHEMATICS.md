# Teabag Simulator Schematics Map

Line-anchored reference for `teabag-simulator.html` so edits can target the right mechanic quickly.

## Section Map (By Line Range)

| Area | Lines |
| --- | --- |
| SFX Engine | 23-303 |
| Resolution / canvas setup | 307-344 |
| Core constants + tuning surface | 351-489 |
| Zones + biome data | 490-585 |
| Zone runtime state + persistence | 586-652 |
| Zone blending | 653-664 |
| Character definitions (all NPC archetypes) | 665-958 |
| Day/night system | 959-1010 |
| Keyboard input | 1011-1051 |
| Mobile touch input | 1052-1176 |
| Mobile sidebars render | 1177-1240 |
| Particles / popups / shake / camera | 1241-1343 |
| Platform + bus stop generation | 1344-1520 |
| City/building/prop generation + draw | 1521-1953 |
| Cars | 1954-2064 |
| Character renderer | 2068-2522 |
| Character gallery mode | 2523-2629 |
| Player model | 2630-2643 |
| NPC model + spawning | 2644-2718 |
| Score + KO tracking | 2719-2738 |
| Global game state + GameContext scaffold | 2739-2819 |
| Update pipeline (menu/pause/gameplay/world) | 2820-3452 |
| Render pipeline (front screens + world layers + HUD) | 3453-3881 |
| Parallax silhouettes | 3882-3978 |
| Clouds / birds | 3979-4027 |
| Title / mode / zone picker / pause menus | 4028-4329 |
| Main loop + frame reset + boot | 4330-4357 |

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2740`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`2906`) | `drawTitleScreen` (`4029`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`2916-2923`) | `drawModeSelect` (`4116`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`2937-2946`) | `drawZonePicker` (`4152`) |
| `playing` | `startGame` (`2821`, `2867`) or pause resume | ESC/P/pause touch -> `paused` (`3437-3438`) | gameplay renderer via `render(gameCtx, dt)` (`3848`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`2985-2990`) | `drawPauseMenu` (`4223`) overlay |

Note: `galleryMode` (`2524`) is orthogonal to `gameState`; `Tab` toggles preview rendering through `renderFrontScreen` (`3454`).

## Update/Render Dispatch Helpers

- `createGameContext()` at `teabag-simulator.html:2747`
- `const GAME_CTX` init at `teabag-simulator.html:2818`
- `startGame(gameCtx)` at `teabag-simulator.html:2821`
- `triggerPrestige(gameCtx)` at `teabag-simulator.html:2870`
- `updateTitleMenuState(gameCtx, dt)` at `teabag-simulator.html:2904`
- `updateModeSelectState(gameCtx)` at `teabag-simulator.html:2909`
- `updateZonePickerState(gameCtx)` at `teabag-simulator.html:2928`
- `updateMenuState(gameCtx, dt)` at `teabag-simulator.html:2950`
- `updatePauseNavigation(gameCtx)` at `teabag-simulator.html:2969`
- `updatePauseSelectionAction(gameCtx)` at `teabag-simulator.html:2980`
- `updatePauseAdjustments(gameCtx)` at `teabag-simulator.html:2994`
- `updatePauseState(gameCtx)` at `teabag-simulator.html:3008`
- `updatePlayerMovementAndJump(dt, p, onNPC)` at `teabag-simulator.html:3017`
- `updateMountedCombatState(p)` at `teabag-simulator.html:3145`
- `updatePlayerTimersAndFX(dt, p, onNPC)` at `teabag-simulator.html:3243`
- `updatePlayerState(dt)` at `teabag-simulator.html:3271`
- `updateNPCFSM(dt, p)` at `teabag-simulator.html:3285`
- `updateNPCSpawning(p)` at `teabag-simulator.html:3346`
- `updateBusStopAmbient(dt, p)` at `teabag-simulator.html:3368`
- `updateNPCState(dt, p)` at `teabag-simulator.html:3384`
- `updateWorldState(gameCtx, dt, p)` at `teabag-simulator.html:3390`
- `updatePlayingState(gameCtx, dt)` at `teabag-simulator.html:3435`
- `update(gameCtx, dt)` dispatcher at `teabag-simulator.html:3447`
- `renderFrontScreen()` at `teabag-simulator.html:3454`
- `renderWorldLayer(sky)` at `teabag-simulator.html:3486`
- `renderEntityLayer()` at `teabag-simulator.html:3574`
- `renderPostFX(sky)` at `teabag-simulator.html:3655`
- `renderHUDLayer()` at `teabag-simulator.html:3701`
- `renderOverlayLayer(sky)` at `teabag-simulator.html:3843`
- `render(gameCtx, dt)` dispatcher at `teabag-simulator.html:3848`
- `endFrameInputReset(gameCtx)` at `teabag-simulator.html:4331`
- `loop(gameCtx, timestamp)` at `teabag-simulator.html:4338`

## Tuning Surface (Gameplay + HUD)

Central tuning object: `TUNING` at `teabag-simulator.html:370`

| Group | Canonical fields | Main consumers |
| --- | --- | --- |
| `movement` | air control/jump multipliers, drop-through, landing, walk/breath/blink, sprint trail | `updatePlayerMovementAndJump` (`3017`), `updatePlayerTimersAndFX` (`3243`) |
| `combat` | combo damage curve, chain window, dismount velocity, KO shake, aerial bonus | `updateMountedCombatState` (`3145`), `renderHUDLayer` (`3701`) |
| `spawn` | NPC pacing, panic/flee cadence, spawn margins, sprint-ahead pressure | `updateNPCFSM` (`3285`), `updateNPCSpawning` (`3346`), `updateBusStopAmbient` (`3368`) |
| `world` | camera lead/follow, campaign soft wall, bootstrap world warmup/spawn burst, generation margin | `startGame` (`2821`), `triggerPrestige` (`2870`), `updateWorldState` (`3390`) |
| `uiTiming` | postFX intensity, chain HUD timing, combo label, KO/zone transition animation curves | `renderPostFX` (`3655`), `renderHUDLayer` (`3701`), zone transition setup (`3411`) |

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Context boundary wiring | `GAME_CTX` scaffold (`2747-2818`) | `update(gameCtx, dt)` + `render(gameCtx, dt)` (`3447`, `3848`) | frame end reset + RAF loop (`4331-4350`) |
| Movement tuning | physics constants + `TUNING.movement` (`351-489`) | movement/jump resolver (`3017-3143`) | player pose in `drawCharacter` (`2069`) via `renderEntityLayer` (`3574`) |
| Sprint behavior | double-tap input (`1015-1050`, `1145-1156`) + speed constants (`355`, `374`, `437-440`) | sprint state + air carry (`3019-3025`) | sprint particles (`3265-3266`) |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`356-358`) + movement tuning (`373-385`) | jump gate + execution (`3065-3092`) | airborne pose flags (`3646-3647`) |
| Drop-through platforms | player flags (`2639`) + movement tuning (`380`, `384`) | trigger/clear (`3049-3054`, `3129-3131`) | one-way platform collision (`3105-3126`) |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`362-363`) + `TUNING.combat` (`396-415`) | teabag loop (`3164-3235`) | hit popups/announcements (`3174-3175`, `3774-3796`) |
| KO + chain scoring | character KO metadata in `CHARACTER_DEFS` (`667+`) | KO branch + chain timers (`3178-3199`, `3226`, `3248`) | chain HUD + center KO (`3725-3743`, `3753-3769`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`667-958`) | spawn composition (`2656-2718`) | `drawCharacter` (`2069-2522`) + tracker (`2726-2735`, `3771+`) |
| NPC density / pacing | global caps (`365-367`) + `TUNING.spawn` (`416-443`) | spawn/despawn loops (`3339-3366`) | world pressure in same frame |
| Zone progression / prestige | `ZONES` (`491-584`), `zoneLayout` (`587+`) | zone tracking + prestige (`3405-3415`, `2870-2901`) | zone pill + transition banner (`3804-3840`) |
| Procedural world gen | generation funcs (`1412`, `1619`) + `TUNING.world` margins (`448`, `452`) | startup/prestige/per-frame generation (`2849-2850`, `2895-2896`, `3425-3426`) | rendered in layer order (`3486-3846`) |
| Persistence | save keys `teabag_save`/`teabag_sfx` (`293`, `601`) | `saveProgress` (`608`) + `saveSFXSettings` (`297`) | loaded at boot (`293`, `601`) |

## Render Order (Authoritative)

Within `render(gameCtx, dt)` (`3848`), draw order is:

1. Sky gradient fill (`3858-3863`)
2. Stars + silhouettes + clouds + birds (`3487-3501`)
3. BG buildings (0.3), FG buildings (0.7), cars (`3503-3509`)
4. Platforms and bus stop structures (`3511-3518`)
5. Sidewalk + ground pattern blend (`3520-3571`)
6. Bus stop NPCs, props, NPCs, player (`3578-3649`)
7. Particles/popups (`3651-3652`)
8. PostFX + HUD (`3843-3845`, internals `3655-3842`)
9. Pause overlay when paused (`3871-3876`)
10. Sidebars (`3878`)

## Update Order (Authoritative)

Within `update(gameCtx, dt)` (`3447`), dispatch flow is:

1. Menu dispatcher (`3448` -> `2950-2967`)
2. Pause dispatcher (`3449` -> `3008-3015`)
3. Playing pause gate (`3437-3439`)
4. Player movement/jump systems (`3017-3143`)
5. Mounted combat + head-mount checks (`3145-3241`)
6. Player timers/animation/fx (`3243-3269`)
7. NPC FSM + despawn (`3285-3345`)
8. NPC spawn pressure (`3346-3367`)
9. Bus-stop ambient updates (`3368-3383`)
10. Camera + zone/progression + generation + world systems (`3390-3433`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `351-367`, `370-395`, `3017-3092` |
| Change teabag damage curve | `362-363`, `398-405`, `3167-3170` |
| Change chain window length | `405`, `3188`, `3226`, `3739` |
| Add new NPC type | `667-957` (definition), zone `npcPool` in `491-584` |
| Add new zone | `491-584`, blend assumptions `653-664`, render pattern branch `3526+`, silhouettes `3882+` |
| Change spawn pressure | `365-367`, `416-443`, `3346-3367` |
| Change prestige behavior | `2870-2901`, `3405-3415`, postFX `3675-3698` |
| Change pause menu controls | paused helpers `2969-3015`, renderer `4223-4329` |
| Change touch controls | touch model `1054`, mapping `1132-1166`, sidebar UI `1178-1240` |
| Change scoring formula | KO scoring block `3195-3196`, trackers `2719-2738` |

## Search Cheatsheet

Use these from repo root:

- `rg -n "function createGameContext|const GAME_CTX|function endFrameInputReset|function loop\(" teabag-simulator.html`
- `rg -n "const TUNING|movement: Object.freeze|combat: Object.freeze|spawn: Object.freeze|world: Object.freeze|uiTiming: Object.freeze" teabag-simulator.html`
- `rg -n "function startGame|function triggerPrestige|bootstrapGenerationMargin|generationMargin" teabag-simulator.html`
- `rg -n "function updateTitleMenuState|function updateModeSelectState|function updateZonePickerState|function updateMenuState|function updatePauseNavigation|function updatePauseSelectionAction|function updatePauseAdjustments|function updatePauseState|function updatePlayerMovementAndJump|function updateMountedCombatState|function updatePlayerTimersAndFX|function updatePlayerState|function updateNPCFSM|function updateNPCSpawning|function updateBusStopAmbient|function updateNPCState|function updateWorldState|function updatePlayingState|function update\(" teabag-simulator.html`
- `rg -n "function renderFrontScreen|function renderWorldLayer|function renderEntityLayer|function renderPostFX|function renderHUDLayer|function renderOverlayLayer|function render\(" teabag-simulator.html`
- `rg -n "TEABAG_DAMAGE|TEABAG_WINDOW|chainWindowSeconds|comboDamageStep" teabag-simulator.html`
- `rg -n "gameState ===|gameState =" teabag-simulator.html`
- `rg -n "const ZONES =|npcPool|triggerPrestige" teabag-simulator.html`
- `rg -n "MIN_NPCS_ON_SCREEN|MAX_NPCS|NPC_DESPAWN_DIST|visibleNPCs|sprintAheadDistance" teabag-simulator.html`
- `rg -n "localStorage|teabag_save|teabag_sfx" teabag-simulator.html`

## Coupling Notes (Avoid Regressions)

- Combo decay intentionally pauses while airborne; it ticks only when `onRealGround` is true (`3245-3246`).
- Chain combo decays only when not mounted (`3248`) and refreshes on remount (`3226`).
- Teabag uses crouch release timing (`3164-3167`), not crouch press.
- Zone unlocks happen both on crossing into a zone (`3413-3415`) and on prestige (`2875-2876`).
- `drawCharacter` is shared by player, NPCs, bus-stop NPCs, title screen, and gallery (`2069`, `3574`, `4029`, `2523`).
- Frame-end input reset ordering is critical and now centralized in `endFrameInputReset(gameCtx)` (`4331-4335`); keep it after `render(gameCtx, dt)` in `loop` (`4341-4343`).
- Bootstrap world warmup and spawn burst values are centralized in `TUNING.world` (`444-465`); keep bootstrap (`452+`) and streaming (`448`, `3425-3426`) margins intentionally aligned for pacing.
