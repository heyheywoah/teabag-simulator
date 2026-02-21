# Teabag Simulator Schematics Map

Line-anchored reference for `teabag-simulator.html` so edits can target the right mechanic quickly.

## Section Map (By Line Range)

| Area | Lines |
| --- | --- |
| SFX Engine | 24-304 |
| Resolution / canvas setup | 308-345 |
| Core constants + tuning surface | 352-490 |
| Zones + biome data | 491-586 |
| Zone runtime state + persistence | 587-653 |
| Zone blending | 654-665 |
| Character definitions (all NPC archetypes) | 666-959 |
| Day/night system | 960-1011 |
| Keyboard input | 1012-1052 |
| Mobile touch input | 1053-1177 |
| Mobile sidebars render | 1178-1241 |
| Particles / popups / shake / camera | 1242-1344 |
| Platform + bus stop generation | 1345-1522 |
| City/building/prop generation + draw | 1523-1988 |
| Cars | 1989-2102 |
| Character renderer + payload registry bridge | 2103-2306 |
| Character gallery mode | 2307-2529 |
| Player model | 2530-2543 |
| NPC model + spawning | 2544-2619 |
| Score + KO tracking | 2620-2639 |
| Global game state + GameContext scaffold | 2640-2726 |
| Update pipeline (menu/pause/gameplay/world) | 2727-3359 |
| Render pipeline (front screens + world layers + HUD) | 3360-3788 |
| Parallax silhouettes | 3789-3885 |
| Clouds / birds | 3886-3934 |
| Title / mode / zone picker / pause menus | 3935-4236 |
| Main loop + frame reset + boot | 4237-4265 |

## Recent Integration Notes (2026-02-21)

- Shared NPC renderer module: `runtime/npc-render-shared.js` owns the runtime `drawCharacter` body with an additive designer-payload branch and legacy fallback.
- Runtime include anchor: `teabag-simulator.html:22` (`<script src="runtime/npc-render-shared.js"></script>`).
- Runtime payload registry anchors:
  - `teabag-simulator.html:2104` (`DESIGNER_PAYLOAD_INDEX_PATH`)
  - `teabag-simulator.html:2225` (`loadDesignerPayloadRegistry()`)
  - `teabag-simulator.html:2267` (`resolveDesignerPayloadById(...)`)
  - `teabag-simulator.html:2272` (`resolveDesignerPayloadPose(...)`)
  - `teabag-simulator.html:2282` (`drawCharacter(...)` wrapper bridge)
  - `teabag-simulator.html:4256` (boot-time `loadDesignerPayloadRegistry()` call)
- Gallery-only sample routing anchor: `teabag-simulator.html:2320` (`GALLERY_TYPES` includes `designerPayloadId: "npc_strict_valid"`).
- Offline payload cache path: `sw.js` precaches `runtime/npc-render-shared.js` plus payload registry files (`data/npc_payloads/index.json`, `strict-valid.json`, `visual-override.json`); bump `CACHE_NAME` when payload cache manifest changes.
- Runtime call sites still target `drawCharacter(...)`; unresolved/missing payload ids fall back to legacy rendering.
- Shared renderer now uses one legacy-equivalent motion state for both legacy and payload branches; payload shoe layers pivot from their matching leg pivots (left/right) when `partRole`/layer naming maps them to shoes.
- Designer runtime preview now has a single `Start Loop` / `Stop Loop` toggle (`npc-designer.html`, `npc-designer.js`) that advances the same `tick -> walkPhase` surface used by game-exact motion parity rendering.
- Designer now persists current workspace state to `localStorage` and exposes a simple session snapshot menu (`Save`, `Save As`, `Load`) with unsaved-change confirmation before load.

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2641`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`2813`) | `drawTitleScreen` (`3936`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`2830`) | `drawModeSelect` (`4023`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`2853`) | `drawZonePicker` (`4059`) |
| `playing` | `startGame` (`2728`) or pause resume | ESC/P/pause touch -> `paused` (`3345`) | gameplay renderer via `render(gameCtx, dt)` (`3755`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`2892`, `2897`) | `drawPauseMenu` (`4130`) overlay |

Note: `galleryMode` (`2308`) is orthogonal to `gameState`; `Tab` toggles preview rendering through `renderFrontScreen` (`3361`).

## Update/Render Dispatch Helpers

- `createGameContext()` at `teabag-simulator.html:2648`
- `const GAME_CTX` init at `teabag-simulator.html:2725`
- `startGame(gameCtx)` at `teabag-simulator.html:2728`
- `triggerPrestige(gameCtx)` at `teabag-simulator.html:2777`
- `updateTitleMenuState(gameCtx, dt)` at `teabag-simulator.html:2811`
- `updateModeSelectState(gameCtx)` at `teabag-simulator.html:2816`
- `updateZonePickerState(gameCtx)` at `teabag-simulator.html:2835`
- `updateMenuState(gameCtx, dt)` at `teabag-simulator.html:2857`
- `updatePauseNavigation(gameCtx)` at `teabag-simulator.html:2876`
- `updatePauseSelectionAction(gameCtx)` at `teabag-simulator.html:2887`
- `updatePauseAdjustments(gameCtx)` at `teabag-simulator.html:2901`
- `updatePauseState(gameCtx)` at `teabag-simulator.html:2915`
- `updatePlayerMovementAndJump(dt, p, onNPC)` at `teabag-simulator.html:2924`
- `updateMountedCombatState(p)` at `teabag-simulator.html:3052`
- `updatePlayerTimersAndFX(dt, p, onNPC)` at `teabag-simulator.html:3150`
- `updatePlayerState(dt)` at `teabag-simulator.html:3178`
- `updateNPCFSM(dt, p)` at `teabag-simulator.html:3192`
- `updateNPCSpawning(p)` at `teabag-simulator.html:3253`
- `updateBusStopAmbient(dt, p)` at `teabag-simulator.html:3275`
- `updateNPCState(dt, p)` at `teabag-simulator.html:3291`
- `updateWorldState(gameCtx, dt, p)` at `teabag-simulator.html:3297`
- `updatePlayingState(gameCtx, dt)` at `teabag-simulator.html:3342`
- `update(gameCtx, dt)` dispatcher at `teabag-simulator.html:3354`
- `renderFrontScreen(gameCtx)` at `teabag-simulator.html:3361`
- `renderWorldLayer(sky)` at `teabag-simulator.html:3393`
- `renderEntityLayer()` at `teabag-simulator.html:3481`
- `renderPostFX(sky)` at `teabag-simulator.html:3562`
- `renderHUDLayer(gameCtx)` at `teabag-simulator.html:3608`
- `renderOverlayLayer(gameCtx, sky)` at `teabag-simulator.html:3750`
- `render(gameCtx, dt)` dispatcher at `teabag-simulator.html:3755`
- `endFrameInputReset(gameCtx)` at `teabag-simulator.html:4238`
- `loop(gameCtx, timestamp)` at `teabag-simulator.html:4245`

## Tuning Surface (Gameplay + HUD)

Central tuning object: `TUNING` at `teabag-simulator.html:370`

| Group | Canonical fields | Main consumers |
| --- | --- | --- |
| `movement` | air control/jump multipliers, drop-through, landing, walk/breath/blink, sprint trail | `updatePlayerMovementAndJump` (`2924`), `updatePlayerTimersAndFX` (`3150`) |
| `combat` | combo damage curve, chain window, dismount velocity, KO shake, aerial bonus | `updateMountedCombatState` (`3052`), `renderHUDLayer` (`3608`) |
| `spawn` | NPC pacing, panic/flee cadence, spawn margins, sprint-ahead pressure | `updateNPCFSM` (`3192`), `updateNPCSpawning` (`3253`), `updateBusStopAmbient` (`3275`) |
| `world` | camera lead/follow, campaign soft wall, bootstrap world warmup/spawn burst, generation margin | `startGame` (`2728`), `triggerPrestige` (`2777`), `updateWorldState` (`3297`) |
| `uiTiming` | postFX intensity, chain HUD timing, combo label, KO/zone transition animation curves | `renderPostFX` (`3562`), `renderHUDLayer` (`3608`), zone transition setup (`3297`) |

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Context boundary wiring | `GAME_CTX` scaffold (`2648-2726`) | `update(gameCtx, dt)` + `render(gameCtx, dt)` (`3354`, `3755`) | frame-end reset + RAF loop (`4238-4253`) |
| Movement tuning | Physics constants + `TUNING.movement` (`352-489`) | `updatePlayerMovementAndJump` (`2924`) + `updatePlayerTimersAndFX` (`3150`) | `drawCharacter` wrapper (`2282`) via `renderEntityLayer` (`3481`) |
| Sprint behavior | Double-tap input (`1016-1039`, `1139-1159`) + speed constants (`355`, `372+`) | Sprint lock/carry logic in `updatePlayerMovementAndJump` (`2924`) | Sprint trail particles in `updatePlayerTimersAndFX` (`3150`) |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`357-359`) + movement tuning (`372-395`) | Jump gate/execution in `updatePlayerMovementAndJump` (`2924`) | Airborne pose flags through `drawCharacter` (`2282`) |
| Drop-through platforms | Player flags (`2531+`) + movement tuning (`379-385`) | Drop-through trigger/clear in `updatePlayerMovementAndJump` (`2924`) | Platform collision resolution in same function |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`363-364`) + `TUNING.combat` (`396-415`) | Teabag/KO loop in `updateMountedCombatState` (`3052`) | Hit popups + KO announcements in `updateMountedCombatState` + HUD (`3608`) |
| KO + chain scoring | KO metadata in `CHARACTER_DEFS` (`668-956`) | KO/chain scoring in `updateMountedCombatState` (`3052`) + decay in `updatePlayerTimersAndFX` (`3150`) | Chain HUD + center KO in `renderHUDLayer` (`3608`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`668-958`) including `legColor`/`shoeColor` | `spawnNPC` (`2568`) + `spawnBusStopNPCs` (`1363`) + `npcVisualOpts` (`2546`) | `drawCharacter` wrapper (`2282`) -> `runtime/npc-render-shared.js` |
| NPC density / pacing | Global caps (`365-368`) + `TUNING.spawn` (`416-443`) | `updateNPCFSM` (`3192`) + `updateNPCSpawning` (`3253`) + `updateBusStopAmbient` (`3275`) | Pressure manifests through same-frame world/entity render |
| Zone progression / prestige | `ZONES` (`492-583`) + `zoneLayout` (`588+`) | Zone transitions in `updateWorldState` (`3297`) + prestige in `triggerPrestige` (`2777`) | Zone transition banner in `renderOverlayLayer` (`3750`) |
| Procedural world gen | `generatePlatforms` (`1414`) + `generateCity` (`1664`) + `TUNING.world` (`444-465`) | Startup/prestige/stream generation in `startGame` (`2756`), `triggerPrestige` (`2802`), `updateWorldState` (`3332`) | World layer composition in `renderWorldLayer` (`3393`) |
| City spacing profile | `CITY_GAP_PROFILE` + helpers (`1534-1572`) | FG/BG stride in `generateCity` (`1664`) via `advanceCityCursor(...)` | Building density rendered in `renderWorldLayer` (`3393`) |
| Dog-walker gallery companion | `GALLERY_DOG_PREVIEW` (`2361`) + `drawGalleryCompanionDog` (`2368`) | Pose-specific calls in `drawGallery` (`2487`, `2497`, `2507`) | Gallery-only companion preview (no gameplay coupling) |
| Runtime payload registry | `DESIGNER_PAYLOAD_INDEX_PATH` (`2104`) + registry helpers (`2225-2276`) | Boot loader `loadDesignerPayloadRegistry()` (`2225`, call at `4256`) + lookup in `drawCharacter` (`2282`) | Optional `designerPayloadId` path with legacy fallback in renderer wrapper |
| Persistence | Save keys `teabag_save` / `teabag_sfx` (`293`, `601`) | `saveProgress` (`609`) + `saveSFXSettings` (`297`) | Loaded at boot (`293`, `601`) |

## Render Order (Authoritative)

Within `render(gameCtx, dt)` (`3755`), draw order is:

1. Front-screen short-circuit check via `renderFrontScreen(gameCtx)` (`3361`).
2. Sky gradient fill in gameplay path (`3765-3770`).
3. World layer via `renderWorldLayer(sky)` (`3393`) including stars/silhouettes/clouds/birds, buildings, cars, platforms, and ground.
4. Entity layer via `renderEntityLayer()` (`3481`) for bus-stop NPCs, props, NPCs, player, particles, and popups.
5. Overlay/HUD via `renderOverlayLayer(gameCtx, sky)` (`3750`) which routes through `renderPostFX` (`3562`) and `renderHUDLayer` (`3608`).
6. Pause overlay (`3778-3783`) using `drawPauseMenu()` (`4130`) when paused.
7. Mobile sidebars via `drawSideBars()` (`1179`) after gameplay/pause layers.

## Update Order (Authoritative)

Within `update(gameCtx, dt)` (`3354`), dispatch flow is:

1. Menu dispatcher via `updateMenuState(gameCtx, dt)` (`2857`).
2. Pause dispatcher via `updatePauseState(gameCtx)` (`2915`).
3. Playing dispatcher via `updatePlayingState(gameCtx, dt)` (`3342`).
4. Inside `updatePlayingState`:
   - pause-entry gate (`3343-3347`)
   - player systems via `updatePlayerState(dt)` (`3178`)
   - NPC systems via `updateNPCState(dt, p)` (`3291`)
   - world/progression/generation via `updateWorldState(gameCtx, dt, p)` (`3297`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `352-369`, `371-395`, `2924-3049` |
| Change teabag damage curve | `363-364`, `396-405`, `3074-3079` |
| Change chain window length | `406`, `3095`, `3133`, `3646` |
| Add new NPC type | `668-956` (definition), zone `npcPool` in `492-583` |
| Retune NPC shoe color | `CHARACTER_DEFS` visual fields (`668-956`), spawn pass-through (`1363-1394`, `2546-2568`), shared render path (`2282` + `runtime/npc-render-shared.js`) |
| Add new zone | `492-583`, blend assumptions `654-664`, world layer branch `3393+`, silhouettes `3789+` |
| Add/retune dog-walker gallery companion | `GALLERY_DOG_PREVIEW` / helper (`2361-2453`) + pose call sites (`2487`, `2497`, `2507`) |
| Retune city spacing profile | `1534-1572` (gap profile + helpers), FG/BG stride in `generateCity` (`1664+`) |
| Change spawn pressure | `365-368`, `416-443`, `3253-3274` |
| Change prestige behavior | `2777-2809`, `3297-3335`, overlay timing in `renderPostFX` (`3562-3607`) |
| Change pause menu controls | pause helpers (`2876-2915`), menu renderer (`4130-4236`) |
| Change touch controls | touch model (`1054+`), mapping (`1139-1166`), sidebar UI (`1179-1241`) |
| Change scoring formula | KO scoring block (`3101-3104`) + chain HUD (`3632-3649`) |

## Search Cheatsheet

Use these from repo root:

- `rg -n "function createGameContext|const GAME_CTX|function endFrameInputReset|function loop\(" teabag-simulator.html`
- `rg -n "const TUNING|movement: Object.freeze|combat: Object.freeze|spawn: Object.freeze|world: Object.freeze|uiTiming: Object.freeze" teabag-simulator.html`
- `rg -n "function startGame|function triggerPrestige|bootstrapGenerationMargin|generationMargin" teabag-simulator.html`
- `rg -n "CITY_GAP_PROFILE|function sampleCityGap|function advanceCityCursor|function generateCity" teabag-simulator.html`
- `rg -n "dog_walker|function drawGalleryCompanionDog|GALLERY_DOG_PREVIEW|function drawGallery" teabag-simulator.html`
- `rg -n "function updateTitleMenuState|function updateModeSelectState|function updateZonePickerState|function updateMenuState|function updatePauseNavigation|function updatePauseSelectionAction|function updatePauseAdjustments|function updatePauseState|function updatePlayerMovementAndJump|function updateMountedCombatState|function updatePlayerTimersAndFX|function updatePlayerState|function updateNPCFSM|function updateNPCSpawning|function updateBusStopAmbient|function updateNPCState|function updateWorldState|function updatePlayingState|function update\(" teabag-simulator.html`
- `rg -n "function renderFrontScreen|function renderWorldLayer|function renderEntityLayer|function renderPostFX|function renderHUDLayer|function renderOverlayLayer|function render\(" teabag-simulator.html`
- `rg -n "TEABAG_DAMAGE|TEABAG_WINDOW|chainWindowSeconds|comboDamageStep" teabag-simulator.html`
- `rg -n "gameState ===|gameState =" teabag-simulator.html`
- `rg -n "const ZONES =|npcPool|triggerPrestige" teabag-simulator.html`
- `rg -n "shoeColor|legColor|function spawnBusStopNPCs|function npcVisualOpts|function spawnNPC|function drawCharacter" teabag-simulator.html`
- `rg -n "MIN_NPCS_ON_SCREEN|MAX_NPCS|NPC_DESPAWN_DIST|visibleNPCs|sprintAheadDistance" teabag-simulator.html`
- `rg -n "localStorage|teabag_save|teabag_sfx" teabag-simulator.html`

## Coupling Notes (Avoid Regressions)

- Combo decay intentionally pauses while airborne; it ticks only when `onRealGround` is true (`3153`).
- Chain combo decays only when not mounted (`3155`) and refreshes on remount (`3133`).
- Teabag uses crouch release timing (`3071-3074`), not crouch press.
- Zone unlocks happen both on crossing into a zone (`3320-3321`) and on prestige (`2782-2783`).
- `drawCharacter` remains the single runtime character draw entrypoint for player/NPC/gallery flows; wrapper bridge lives at `teabag-simulator.html:2282` and delegates to `SHARED_CHARACTER_RENDERER` (`teabag-simulator.html:2278`) with optional designer-payload lookup/fallback.
- Frame-end input reset ordering is critical and centralized in `endFrameInputReset(gameCtx)` (`teabag-simulator.html:4238`); keep it after `render(gameCtx, dt)` in `loop` (`teabag-simulator.html:4245`).
- Bootstrap world warmup and spawn burst values are centralized in `TUNING.world` (`444-465`); keep bootstrap (`2756`, `2802`) and streaming (`3332`) generation margins intentionally aligned for pacing.
- FG and BG both use `advanceCityCursor(...)` (`1572`) for width-aware symmetric stride; keep left-anchor placement (`1678`, `1697`) as `b.x = cursor - b.w` so right/left parity is preserved.
- `drawGalleryCompanionDog(...)` is gallery-only; it should not be called from `renderEntityLayer` or NPC update paths.
- `party_girl` keeps `hasDress`/`shortDress` and the special bare-leg look through renderer options; keep flag plumbing aligned (`spawnNPC` -> `npcVisualOpts` -> renderer opts).
- `shoeColor` flows from `CHARACTER_DEFS` into bus-stop/world NPC objects (`1368-1391`, `2571-2603`), then through `npcVisualOpts` (`2546`) into `drawCharacter`; preserve that pipeline and fallback order.
- Payload branch coupling: keep `partRole` semantics (`left_leg`/`right_leg`/`left_shoe`/`right_shoe`) stable so shoe layers inherit leg pivot swing, matching legacy leg+shoe attachment behavior.
