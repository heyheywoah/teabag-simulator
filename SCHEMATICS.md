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
| Global game state + GameContext scaffold | 2739-2825 |
| Update pipeline (menu/pause/gameplay/world) | 2826-3458 |
| Render pipeline (front screens + world layers + HUD) | 3459-3887 |
| Parallax silhouettes | 3888-3984 |
| Clouds / birds | 3985-4033 |
| Title / mode / zone picker / pause menus | 4034-4335 |
| Main loop + frame reset + boot | 4336-4363 |

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2740`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`2912`) | `drawTitleScreen` (`4035`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`2922-2929`) | `drawModeSelect` (`4122`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`2941-2952`) | `drawZonePicker` (`4158`) |
| `playing` | `startGame` (`2827`, `2873`) or pause resume | ESC/P/pause touch -> `paused` (`3443-3444`) | gameplay renderer via `render(gameCtx, dt)` (`3854`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`2991-2996`) | `drawPauseMenu` (`4229`) overlay |

Note: `galleryMode` (`2524`) is orthogonal to `gameState`; `Tab` toggles preview rendering through `renderFrontScreen` (`3460`).

## Update/Render Dispatch Helpers

- `createGameContext()` at `teabag-simulator.html:2747`
- `const GAME_CTX` init at `teabag-simulator.html:2824`
- `startGame(gameCtx)` at `teabag-simulator.html:2827`
- `triggerPrestige(gameCtx)` at `teabag-simulator.html:2876`
- `updateTitleMenuState(gameCtx, dt)` at `teabag-simulator.html:2910`
- `updateModeSelectState(gameCtx)` at `teabag-simulator.html:2915`
- `updateZonePickerState(gameCtx)` at `teabag-simulator.html:2934`
- `updateMenuState(gameCtx, dt)` at `teabag-simulator.html:2956`
- `updatePauseNavigation(gameCtx)` at `teabag-simulator.html:2975`
- `updatePauseSelectionAction(gameCtx)` at `teabag-simulator.html:2986`
- `updatePauseAdjustments(gameCtx)` at `teabag-simulator.html:3000`
- `updatePauseState(gameCtx)` at `teabag-simulator.html:3014`
- `updatePlayerMovementAndJump(dt, p, onNPC)` at `teabag-simulator.html:3023`
- `updateMountedCombatState(p)` at `teabag-simulator.html:3151`
- `updatePlayerTimersAndFX(dt, p, onNPC)` at `teabag-simulator.html:3249`
- `updatePlayerState(dt)` at `teabag-simulator.html:3277`
- `updateNPCFSM(dt, p)` at `teabag-simulator.html:3291`
- `updateNPCSpawning(p)` at `teabag-simulator.html:3352`
- `updateBusStopAmbient(dt, p)` at `teabag-simulator.html:3374`
- `updateNPCState(dt, p)` at `teabag-simulator.html:3390`
- `updateWorldState(gameCtx, dt, p)` at `teabag-simulator.html:3396`
- `updatePlayingState(gameCtx, dt)` at `teabag-simulator.html:3441`
- `update(gameCtx, dt)` dispatcher at `teabag-simulator.html:3453`
- `renderFrontScreen(gameCtx)` at `teabag-simulator.html:3460`
- `renderWorldLayer(sky)` at `teabag-simulator.html:3492`
- `renderEntityLayer()` at `teabag-simulator.html:3580`
- `renderPostFX(sky)` at `teabag-simulator.html:3661`
- `renderHUDLayer(gameCtx)` at `teabag-simulator.html:3707`
- `renderOverlayLayer(gameCtx, sky)` at `teabag-simulator.html:3849`
- `render(gameCtx, dt)` dispatcher at `teabag-simulator.html:3854`
- `endFrameInputReset(gameCtx)` at `teabag-simulator.html:4337`
- `loop(gameCtx, timestamp)` at `teabag-simulator.html:4344`

## Tuning Surface (Gameplay + HUD)

Central tuning object: `TUNING` at `teabag-simulator.html:370`

| Group | Canonical fields | Main consumers |
| --- | --- | --- |
| `movement` | air control/jump multipliers, drop-through, landing, walk/breath/blink, sprint trail | `updatePlayerMovementAndJump` (`3023`), `updatePlayerTimersAndFX` (`3249`) |
| `combat` | combo damage curve, chain window, dismount velocity, KO shake, aerial bonus | `updateMountedCombatState` (`3151`), `renderHUDLayer` (`3707`) |
| `spawn` | NPC pacing, panic/flee cadence, spawn margins, sprint-ahead pressure | `updateNPCFSM` (`3291`), `updateNPCSpawning` (`3352`), `updateBusStopAmbient` (`3374`) |
| `world` | camera lead/follow, campaign soft wall, bootstrap world warmup/spawn burst, generation margin | `startGame` (`2827`), `triggerPrestige` (`2876`), `updateWorldState` (`3396`) |
| `uiTiming` | postFX intensity, chain HUD timing, combo label, KO/zone transition animation curves | `renderPostFX` (`3661`), `renderHUDLayer` (`3707`), zone transition setup (`3417`) |

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Context boundary wiring | `GAME_CTX` scaffold (`2747-2824`) | `update(gameCtx, dt)` + `render(gameCtx, dt)` (`3453`, `3854`) | frame end reset + RAF loop (`4337-4350`) |
| Movement tuning | physics constants + `TUNING.movement` (`351-489`) | movement/jump resolver (`3023-3149`) | player pose in `drawCharacter` (`2069`) via `renderEntityLayer` (`3580`) |
| Sprint behavior | double-tap input (`1015-1050`, `1145-1156`) + speed constants (`355`, `374`, `437-440`) | sprint state + air carry (`3025-3031`) | sprint particles (`3271-3272`) |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`356-358`) + movement tuning (`373-385`) | jump gate + execution (`3071-3098`) | airborne pose flags (`3652-3653`) |
| Drop-through platforms | player flags (`2639`) + movement tuning (`380`, `384`) | trigger/clear (`3055-3060`, `3135-3137`) | one-way platform collision (`3110-3132`) |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`362-363`) + `TUNING.combat` (`396-415`) | teabag loop (`3170-3241`) | hit popups/announcements (`3181-3182`, `3759-3775`) |
| KO + chain scoring | character KO metadata in `CHARACTER_DEFS` (`667+`) | KO branch + chain timers (`3184-3205`, `3232`, `3254`) | chain HUD + center KO (`3731-3749`, `3753-3775`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`667-958`) | spawn composition (`2656-2718`) | `drawCharacter` (`2069-2522`) + tracker (`2726-2735`, `3777+`) |
| NPC density / pacing | global caps (`365-367`) + `TUNING.spawn` (`416-443`) | spawn/despawn loops (`3344-3372`) | world pressure in same frame |
| Zone progression / prestige | `ZONES` (`491-584`), `zoneLayout` (`587+`) | zone tracking + prestige (`3411-3421`, `2876-2907`) | zone pill + transition banner (`3810-3846`) |
| Procedural world gen | generation funcs (`1412`, `1619`) + `TUNING.world` margins (`448`, `452`) | startup/prestige/per-frame generation (`2855-2856`, `2901-2902`, `3431-3432`) | rendered in layer order (`3492-3852`) |
| Persistence | save keys `teabag_save`/`teabag_sfx` (`293`, `601`) | `saveProgress` (`608`) + `saveSFXSettings` (`297`) | loaded at boot (`293`, `601`) |

## Render Order (Authoritative)

Within `render(gameCtx, dt)` (`3854`), draw order is:

1. Sky gradient fill (`3864-3869`)
2. Stars + silhouettes + clouds + birds (`3493-3507`)
3. BG buildings (0.3), FG buildings (0.7), cars (`3509-3515`)
4. Platforms and bus stop structures (`3517-3524`)
5. Sidewalk + ground pattern blend (`3526-3577`)
6. Bus stop NPCs, props, NPCs, player (`3584-3655`)
7. Particles/popups (`3657-3658`)
8. PostFX + HUD (`3850-3852`, internals `3661-3846`)
9. Pause overlay when paused (`3877-3882`)
10. Sidebars (`3884`)

## Update Order (Authoritative)

Within `update(gameCtx, dt)` (`3453`), dispatch flow is:

1. Menu dispatcher (`3454` -> `2956-2972`)
2. Pause dispatcher (`3455` -> `3014-3020`)
3. Playing pause gate (`3443-3446`)
4. Player movement/jump systems (`3023-3149`)
5. Mounted combat + head-mount checks (`3151-3247`)
6. Player timers/animation/fx (`3249-3275`)
7. NPC FSM + despawn (`3291-3350`)
8. NPC spawn pressure (`3352-3372`)
9. Bus-stop ambient updates (`3374-3388`)
10. Camera + zone/progression + generation + world systems (`3396-3439`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `351-367`, `370-395`, `3017-3092` |
| Change teabag damage curve | `362-363`, `398-405`, `3167-3170` |
| Change chain window length | `405`, `3188`, `3226`, `3739` |
| Add new NPC type | `667-957` (definition), zone `npcPool` in `491-584` |
| Add new zone | `491-584`, blend assumptions `653-664`, render pattern branch `3526+`, silhouettes `3888+` |
| Change spawn pressure | `365-367`, `416-443`, `3352-3372` |
| Change prestige behavior | `2876-2907`, `3411-3421`, postFX `3681-3704` |
| Change pause menu controls | paused helpers `2975-3020`, renderer `4229-4335` |
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

- Combo decay intentionally pauses while airborne; it ticks only when `onRealGround` is true (`3251-3252`).
- Chain combo decays only when not mounted (`3254`) and refreshes on remount (`3232`).
- Teabag uses crouch release timing (`3170-3173`), not crouch press.
- Zone unlocks happen both on crossing into a zone (`3419-3421`) and on prestige (`2881-2883`).
- `drawCharacter` is shared by player, NPCs, bus-stop NPCs, title screen, and gallery (`2069`, `3580`, `4035`, `2560`).
- Frame-end input reset ordering is critical and now centralized in `endFrameInputReset(gameCtx)` (`4337-4341`); keep it after `render(gameCtx, dt)` in `loop` (`4347-4349`).
- Bootstrap world warmup and spawn burst values are centralized in `TUNING.world` (`444-465`); keep bootstrap (`452+`) and streaming (`448`, `3431-3432`) margins intentionally aligned for pacing.
