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
| City/building/prop generation + draw | 1521-1991 |
| Cars | 1992-2105 |
| Character renderer | 2106-2560 |
| Character gallery mode | 2561-2667 |
| Player model | 2668-2681 |
| NPC model + spawning | 2682-2756 |
| Score + KO tracking | 2757-2776 |
| Global game state + GameContext scaffold | 2777-2863 |
| Update pipeline (menu/pause/gameplay/world) | 2864-3496 |
| Render pipeline (front screens + world layers + HUD) | 3497-3925 |
| Parallax silhouettes | 3926-4022 |
| Clouds / birds | 4023-4071 |
| Title / mode / zone picker / pause menus | 4072-4373 |
| Main loop + frame reset + boot | 4374-4401 |

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2778`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`2950`) | `drawTitleScreen` (`4073`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`2960-2967`) | `drawModeSelect` (`4160`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`2979-2990`) | `drawZonePicker` (`4196`) |
| `playing` | `startGame` (`2865`, `2911`) or pause resume | ESC/P/pause touch -> `paused` (`3481-3482`) | gameplay renderer via `render(gameCtx, dt)` (`3892`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`3029-3034`) | `drawPauseMenu` (`4267`) overlay |

Note: `galleryMode` (`2562`) is orthogonal to `gameState`; `Tab` toggles preview rendering through `renderFrontScreen` (`3498`).

## Update/Render Dispatch Helpers

- `createGameContext()` at `teabag-simulator.html:2785`
- `const GAME_CTX` init at `teabag-simulator.html:2862`
- `startGame(gameCtx)` at `teabag-simulator.html:2865`
- `triggerPrestige(gameCtx)` at `teabag-simulator.html:2914`
- `updateTitleMenuState(gameCtx, dt)` at `teabag-simulator.html:2948`
- `updateModeSelectState(gameCtx)` at `teabag-simulator.html:2953`
- `updateZonePickerState(gameCtx)` at `teabag-simulator.html:2972`
- `updateMenuState(gameCtx, dt)` at `teabag-simulator.html:2994`
- `updatePauseNavigation(gameCtx)` at `teabag-simulator.html:3013`
- `updatePauseSelectionAction(gameCtx)` at `teabag-simulator.html:3024`
- `updatePauseAdjustments(gameCtx)` at `teabag-simulator.html:3038`
- `updatePauseState(gameCtx)` at `teabag-simulator.html:3052`
- `updatePlayerMovementAndJump(dt, p, onNPC)` at `teabag-simulator.html:3061`
- `updateMountedCombatState(p)` at `teabag-simulator.html:3189`
- `updatePlayerTimersAndFX(dt, p, onNPC)` at `teabag-simulator.html:3287`
- `updatePlayerState(dt)` at `teabag-simulator.html:3315`
- `updateNPCFSM(dt, p)` at `teabag-simulator.html:3329`
- `updateNPCSpawning(p)` at `teabag-simulator.html:3390`
- `updateBusStopAmbient(dt, p)` at `teabag-simulator.html:3412`
- `updateNPCState(dt, p)` at `teabag-simulator.html:3428`
- `updateWorldState(gameCtx, dt, p)` at `teabag-simulator.html:3434`
- `updatePlayingState(gameCtx, dt)` at `teabag-simulator.html:3479`
- `update(gameCtx, dt)` dispatcher at `teabag-simulator.html:3491`
- `renderFrontScreen(gameCtx)` at `teabag-simulator.html:3498`
- `renderWorldLayer(sky)` at `teabag-simulator.html:3530`
- `renderEntityLayer()` at `teabag-simulator.html:3618`
- `renderPostFX(sky)` at `teabag-simulator.html:3699`
- `renderHUDLayer(gameCtx)` at `teabag-simulator.html:3745`
- `renderOverlayLayer(gameCtx, sky)` at `teabag-simulator.html:3887`
- `render(gameCtx, dt)` dispatcher at `teabag-simulator.html:3892`
- `endFrameInputReset(gameCtx)` at `teabag-simulator.html:4375`
- `loop(gameCtx, timestamp)` at `teabag-simulator.html:4382`

## Tuning Surface (Gameplay + HUD)

Central tuning object: `TUNING` at `teabag-simulator.html:370`

| Group | Canonical fields | Main consumers |
| --- | --- | --- |
| `movement` | air control/jump multipliers, drop-through, landing, walk/breath/blink, sprint trail | `updatePlayerMovementAndJump` (`3061`), `updatePlayerTimersAndFX` (`3287`) |
| `combat` | combo damage curve, chain window, dismount velocity, KO shake, aerial bonus | `updateMountedCombatState` (`3189`), `renderHUDLayer` (`3745`) |
| `spawn` | NPC pacing, panic/flee cadence, spawn margins, sprint-ahead pressure | `updateNPCFSM` (`3329`), `updateNPCSpawning` (`3390`), `updateBusStopAmbient` (`3412`) |
| `world` | camera lead/follow, campaign soft wall, bootstrap world warmup/spawn burst, generation margin | `startGame` (`2865`), `triggerPrestige` (`2914`), `updateWorldState` (`3434`) |
| `uiTiming` | postFX intensity, chain HUD timing, combo label, KO/zone transition animation curves | `renderPostFX` (`3699`), `renderHUDLayer` (`3745`), zone transition setup (`3455`) |

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Context boundary wiring | `GAME_CTX` scaffold (`2785-2862`) | `update(gameCtx, dt)` + `render(gameCtx, dt)` (`3491`, `3892`) | frame end reset + RAF loop (`4375-4388`) |
| Movement tuning | physics constants + `TUNING.movement` (`351-489`) | movement/jump resolver (`3061-3187`) | player pose in `drawCharacter` (`2107`) via `renderEntityLayer` (`3618`) |
| Sprint behavior | double-tap input (`1015-1050`, `1145-1156`) + speed constants (`355`, `374`, `437-440`) | sprint state + air carry (`3063-3069`) | sprint particles (`3309-3310`) |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`356-358`) + movement tuning (`373-385`) | jump gate + execution (`3109-3136`) | airborne pose flags (`3690-3691`) |
| Drop-through platforms | player flags (`2677`) + movement tuning (`380`, `384`) | trigger/clear (`3093-3098`, `3173-3175`) | one-way platform collision (`3148-3170`) |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`362-363`) + `TUNING.combat` (`396-415`) | teabag loop (`3208-3279`) | hit popups/announcements (`3219-3220`, `3797-3813`) |
| KO + chain scoring | character KO metadata in `CHARACTER_DEFS` (`667+`) | KO branch + chain timers (`3222-3243`, `3270`, `3292`) | chain HUD + center KO (`3769-3787`, `3791-3813`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`667-958`) including visual fields like `legColor`/`shoeColor` | spawn composition (`2694-2756`) + bus-stop ambient NPC seeds (`1362-1393`) | `drawCharacter` (`2107-2560`) + tracker (`2764-2773`, `3815+`) |
| NPC density / pacing | global caps (`365-367`) + `TUNING.spawn` (`416-443`) | spawn/despawn loops (`3382-3410`) | world pressure in same frame |
| Zone progression / prestige | `ZONES` (`491-584`), `zoneLayout` (`587+`) | zone tracking + prestige (`3449-3459`, `2914-2945`) | zone pill + transition banner (`3848-3884`) |
| Procedural world gen | generation funcs (`1412`, `1662`) + `TUNING.world` margins (`448`, `452`) | startup/prestige/per-frame generation (`2893-2894`, `2939-2940`, `3469-3470`) | rendered in layer order (`3530-3890`) |
| City spacing profile | `CITY_GAP_PROFILE` + spacing helpers (`1532-1573`) | FG/BG placement stride in `generateCity` (`1664-1697`) | building density read in world layer (`3547-3553`) |
| Persistence | save keys `teabag_save`/`teabag_sfx` (`293`, `601`) | `saveProgress` (`608`) + `saveSFXSettings` (`297`) | loaded at boot (`293`, `601`) |

## Render Order (Authoritative)

Within `render(gameCtx, dt)` (`3892`), draw order is:

1. Sky gradient fill (`3902-3907`)
2. Stars + silhouettes + clouds + birds (`3531-3545`)
3. BG buildings (0.3), FG buildings (0.7), cars (`3547-3553`)
4. Platforms and bus stop structures (`3555-3562`)
5. Sidewalk + ground pattern blend (`3564-3615`)
6. Bus stop NPCs, props, NPCs, player (`3622-3693`)
7. Particles/popups (`3695-3696`)
8. PostFX + HUD (`3888-3890`, internals `3699-3884`)
9. Pause overlay when paused (`3915-3920`)
10. Sidebars (`3922`)

## Update Order (Authoritative)

Within `update(gameCtx, dt)` (`3491`), dispatch flow is:

1. Menu dispatcher (`3492` -> `2994-3010`)
2. Pause dispatcher (`3493` -> `3052-3058`)
3. Playing pause gate (`3481-3484`)
4. Player movement/jump systems (`3061-3187`)
5. Mounted combat + head-mount checks (`3189-3285`)
6. Player timers/animation/fx (`3287-3313`)
7. NPC FSM + despawn (`3329-3388`)
8. NPC spawn pressure (`3390-3410`)
9. Bus-stop ambient updates (`3412-3426`)
10. Camera + zone/progression + generation + world systems (`3434-3477`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `351-367`, `370-395`, `3055-3130` |
| Change teabag damage curve | `362-363`, `398-405`, `3205-3208` |
| Change chain window length | `405`, `3226`, `3264`, `3777` |
| Add new NPC type | `667-957` (definition), zone `npcPool` in `491-584` |
| Retune NPC shoe color | `CHARACTER_DEFS` visual fields (`667-957`), spawn pass-through (`1362-1393`, `2712-2777`), renderer shoe fallback/draw (`2122-2220`) |
| Add new zone | `491-584`, blend assumptions `653-664`, render pattern branch `3564+`, silhouettes `3926+` |
| Retune city spacing profile | `1532-1573` (gap profile + helpers), FG/BG stride logic `1664-1697` |
| Change spawn pressure | `365-367`, `416-443`, `3390-3410` |
| Change prestige behavior | `2914-2945`, `3449-3459`, postFX `3719-3742` |
| Change pause menu controls | paused helpers `3013-3058`, renderer `4267-4373` |
| Change touch controls | touch model `1054`, mapping `1132-1166`, sidebar UI `1178-1240` |
| Change scoring formula | KO scoring block `3233-3234`, trackers `2757-2776` |

## Search Cheatsheet

Use these from repo root:

- `rg -n "function createGameContext|const GAME_CTX|function endFrameInputReset|function loop\(" teabag-simulator.html`
- `rg -n "const TUNING|movement: Object.freeze|combat: Object.freeze|spawn: Object.freeze|world: Object.freeze|uiTiming: Object.freeze" teabag-simulator.html`
- `rg -n "function startGame|function triggerPrestige|bootstrapGenerationMargin|generationMargin" teabag-simulator.html`
- `rg -n "CITY_GAP_PROFILE|function sampleCityGap|function advanceCityCursor|function generateCity" teabag-simulator.html`
- `rg -n "function updateTitleMenuState|function updateModeSelectState|function updateZonePickerState|function updateMenuState|function updatePauseNavigation|function updatePauseSelectionAction|function updatePauseAdjustments|function updatePauseState|function updatePlayerMovementAndJump|function updateMountedCombatState|function updatePlayerTimersAndFX|function updatePlayerState|function updateNPCFSM|function updateNPCSpawning|function updateBusStopAmbient|function updateNPCState|function updateWorldState|function updatePlayingState|function update\(" teabag-simulator.html`
- `rg -n "function renderFrontScreen|function renderWorldLayer|function renderEntityLayer|function renderPostFX|function renderHUDLayer|function renderOverlayLayer|function render\(" teabag-simulator.html`
- `rg -n "TEABAG_DAMAGE|TEABAG_WINDOW|chainWindowSeconds|comboDamageStep" teabag-simulator.html`
- `rg -n "gameState ===|gameState =" teabag-simulator.html`
- `rg -n "const ZONES =|npcPool|triggerPrestige" teabag-simulator.html`
- `rg -n "shoeColor|legColor|function spawnBusStopNPCs|function npcVisualOpts|function spawnNPC|function drawCharacter" teabag-simulator.html`
- `rg -n "MIN_NPCS_ON_SCREEN|MAX_NPCS|NPC_DESPAWN_DIST|visibleNPCs|sprintAheadDistance" teabag-simulator.html`
- `rg -n "localStorage|teabag_save|teabag_sfx" teabag-simulator.html`

## Coupling Notes (Avoid Regressions)

- Combo decay intentionally pauses while airborne; it ticks only when `onRealGround` is true (`3289-3290`).
- Chain combo decays only when not mounted (`3292`) and refreshes on remount (`3270`).
- Teabag uses crouch release timing (`3208-3211`), not crouch press.
- Zone unlocks happen both on crossing into a zone (`3457-3459`) and on prestige (`2919-2921`).
- `drawCharacter` is shared by player, NPCs, bus-stop NPCs, title screen, and gallery (`2107`, `3618`, `4073`, `2598`).
- Frame-end input reset ordering is critical and now centralized in `endFrameInputReset(gameCtx)` (`4375-4379`); keep it after `render(gameCtx, dt)` in `loop` (`4385-4387`).
- Bootstrap world warmup and spawn burst values are centralized in `TUNING.world` (`444-465`); keep bootstrap (`452+`) and streaming (`448`, `3469-3470`) margins intentionally aligned for pacing.
- FG and BG both use `advanceCityCursor(...)` for width-aware symmetric stride; keep left-anchor placement as `b.x = cursor - b.w` so right/left parity is preserved.
- `party_girl` keeps `hasDress`/`shortDress` but now renders full-length bare legs via the dress branch in `drawCharacter`; keep NPC flag plumbing aligned (`spawnNPC` -> `npcVisualOpts` -> renderer opts).
- `shoeColor` now flows from `CHARACTER_DEFS` into both world and bus-stop NPC objects, then through `npcVisualOpts` into `drawCharacter`; if you add new shoe styling, preserve that pipeline and fallback order.
