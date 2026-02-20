# Teabag Simulator Schematics Map

Line-anchored reference for `teabag-simulator.html` so edits can target the right mechanic quickly.

## Section Map (By Line Range)

| Area | Lines |
| --- | --- |
| SFX Engine | 23-303 |
| Resolution / canvas setup | 307-344 |
| Core constants + tuning surface | 351-473 |
| Zones + biome data | 474-569 |
| Zone runtime state + persistence | 570-636 |
| Zone blending | 637-648 |
| Character definitions (all NPC archetypes) | 649-942 |
| Day/night system | 943-994 |
| Keyboard input | 995-1035 |
| Mobile touch input | 1036-1160 |
| Mobile sidebars render | 1161-1224 |
| Particles / popups / shake / camera | 1225-1327 |
| Platform + bus stop generation | 1328-1504 |
| City/building/prop generation + draw | 1505-1937 |
| Cars | 1938-2048 |
| Character renderer | 2052-2506 |
| Character gallery mode | 2507-2613 |
| Player model | 2614-2627 |
| NPC model + spawning | 2628-2702 |
| Score + KO tracking | 2703-2722 |
| Global game state | 2723-2730 |
| Update pipeline (menu/pause/gameplay/world) | 2731-3351 |
| Render pipeline (front screens + world layers + HUD) | 3352-3780 |
| Parallax silhouettes | 3781-3877 |
| Clouds / birds | 3878-3926 |
| Title / mode / zone picker / pause menus | 3927-4228 |
| Main loop + boot | 4229-4251 |

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2724`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`2805`) | `drawTitleScreen` (`3928`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`2815-2823`) | `drawModeSelect` (`4015`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`2836-2845`) | `drawZonePicker` (`4051`) |
| `playing` | `startGame` (`2732`, `2767`) or pause resume | ESC/P/pause touch -> `paused` (`3335-3338`) | gameplay renderer via `render()` (`3747`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`2884-2889`) | `drawPauseMenu` (`4122`) overlay |

Note: `galleryMode` (`2508`) is orthogonal to `gameState`; `Tab` toggles preview rendering through `renderFrontScreen` (`3353`).

## Update/Render Dispatch Helpers

- `updateTitleMenuState(dt)` at `teabag-simulator.html:2803`
- `updateModeSelectState()` at `teabag-simulator.html:2808`
- `updateZonePickerState()` at `teabag-simulator.html:2827`
- `updateMenuState(dt)` at `teabag-simulator.html:2849`
- `updatePauseNavigation()` at `teabag-simulator.html:2868`
- `updatePauseSelectionAction()` at `teabag-simulator.html:2879`
- `updatePauseAdjustments()` at `teabag-simulator.html:2893`
- `updatePauseState()` at `teabag-simulator.html:2907`
- `updatePlayerMovementAndJump(dt, p, onNPC)` at `teabag-simulator.html:2916`
- `updateMountedCombatState(p)` at `teabag-simulator.html:3044`
- `updatePlayerTimersAndFX(dt, p, onNPC)` at `teabag-simulator.html:3142`
- `updatePlayerState(dt)` at `teabag-simulator.html:3170`
- `updateNPCFSM(dt, p)` at `teabag-simulator.html:3184`
- `updateNPCSpawning(p)` at `teabag-simulator.html:3245`
- `updateBusStopAmbient(dt, p)` at `teabag-simulator.html:3267`
- `updateNPCState(dt, p)` at `teabag-simulator.html:3283`
- `updateWorldState(dt, p)` at `teabag-simulator.html:3289`
- `updatePlayingState(dt)` at `teabag-simulator.html:3334`
- `update(dt)` dispatcher at `teabag-simulator.html:3346`
- `renderFrontScreen()` at `teabag-simulator.html:3353`
- `renderWorldLayer(sky)` at `teabag-simulator.html:3385`
- `renderEntityLayer()` at `teabag-simulator.html:3473`
- `renderPostFX(sky)` at `teabag-simulator.html:3554`
- `renderHUDLayer()` at `teabag-simulator.html:3600`
- `renderOverlayLayer(sky)` at `teabag-simulator.html:3742`
- `render(dt)` dispatcher at `teabag-simulator.html:3747`

## Tuning Surface (Gameplay + HUD)

Central tuning object: `TUNING` at `teabag-simulator.html:370`

| Group | Canonical fields | Main consumers |
| --- | --- | --- |
| `movement` | air control/jump multipliers, drop-through, landing, walk/breath/blink, sprint trail | `updatePlayerMovementAndJump` (`2916`), `updatePlayerTimersAndFX` (`3142`) |
| `combat` | combo damage curve, chain window, dismount velocity, KO shake, aerial bonus | `updateMountedCombatState` (`3044`), `renderHUDLayer` (`3600`) |
| `spawn` | NPC pacing, panic/flee cadence, spawn margins, sprint-ahead pressure | `updateNPCFSM` (`3184`), `updateNPCSpawning` (`3245`), `updateBusStopAmbient` (`3267`) |
| `world` | camera lead/follow, campaign soft wall, generation margin | `updateWorldState` (`3289`) |
| `uiTiming` | postFX intensity, chain HUD timing, combo label, KO/zone transition animation curves | `renderPostFX` (`3554`), `renderHUDLayer` (`3600`), zone transition setup (`3310`) |

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Movement tuning | physics constants + `TUNING.movement` (`351-473`) | movement/jump resolver (`2916-3042`) | player pose in `drawCharacter` (`2053`) via `renderEntityLayer` (`3473`) |
| Sprint behavior | double-tap input (`999-1034`, `1129-1142`) + speed constants (`355`, `374`, `437-440`) | sprint state + air carry (`2918-2925`) | sprint particles (`3164-3166`) |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`356-358`) + movement tuning (`373-385`) | jump gate + execution (`2964-2991`) | airborne pose flags (`3545-3546`) |
| Drop-through platforms | player flags (`2623`) + movement tuning (`380`, `384`) | trigger/clear (`2948-2953`, `3028-3030`) | one-way platform collision (`3004-3025`) |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`362-363`) + `TUNING.combat` (`396-415`) | teabag loop (`3062-3134`) | hit popups/announcements (`3073-3074`, `3644-3666`) |
| KO + chain scoring | character KO metadata in `CHARACTER_DEFS` (`651+`) | KO branch + chain timers (`3077-3098`, `3125`, `3147`) | chain HUD + center KO (`3621-3639`, `3644-3666`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`651-942`) | spawn composition (`2640-2702`) | `drawCharacter` (`2053-2506`) + tracker (`2710-2719`, `3671+`) |
| NPC density / pacing | global caps (`365-367`) + `TUNING.spawn` (`416-443`) | spawn/despawn loops (`3238-3265`) | world pressure in same frame |
| Zone progression / prestige | `ZONES` (`475-568`), `zoneLayout` (`571+`) | zone tracking + prestige (`3304-3316`, `2770-2801`) | zone pill + transition banner (`3704-3740`) |
| Procedural world gen | generation funcs (`1396`, `1603`) + `TUNING.world.generationMargin` (`448`) | called in startup/prestige/per-frame (`2757-2758`, `2794-2795`, `3324-3325`) | rendered in layer order (`3385-3744`) |
| Persistence | save keys `teabag_save`/`teabag_sfx` (`293`, `585`) | `saveProgress` (`592`) + `saveSFXSettings` (`297`) | loaded at boot (`293`, `585`) |

## Render Order (Authoritative)

Within `render(dt)` (`3747`), draw order is:

1. Sky gradient fill (`3758-3762`)
2. Stars + silhouettes + clouds + birds (`3387-3400`)
3. BG buildings (0.3), FG buildings (0.7), cars (`3402-3409`)
4. Platforms and bus stop structures (`3412-3417`)
5. Sidewalk + ground pattern blend (`3420-3470`)
6. Bus stop NPCs, props, NPCs, player (`3478-3548`)
7. Particles/popups (`3550-3551`)
8. PostFX + HUD (`3742-3744`, internals `3554-3740`)
9. Pause overlay when paused (`3771-3774`)
10. Sidebars (`3777`)

## Update Order (Authoritative)

Within `update(dt)` (`3346`), dispatch flow is:

1. Menu dispatcher (`3347` -> `2849-2864`)
2. Pause dispatcher (`3348` -> `2907-2913`)
3. Playing pause gate (`3334-3338`)
4. Player movement/jump systems (`2916-3042`)
5. Mounted combat + head-mount checks (`3044-3140`)
6. Player timers/animation/fx (`3142-3167`)
7. NPC FSM + despawn (`3184-3243`)
8. NPC spawn pressure (`3245-3265`)
9. Bus-stop ambient updates (`3267-3280`)
10. Camera + zone/progression + generation + world systems (`3289-3332`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `351-367`, `370-397`, `2916-2991` |
| Change teabag damage curve | `362-363`, `399-404`, `3066-3070` |
| Change chain window length | `405`, `3087`, `3125`, `3638` |
| Add new NPC type | `651-941` (definition), zone `npcPool` in `475-568` |
| Add new zone | `475-568`, blend assumptions `637-648`, render pattern branch `3427+`, silhouettes `3781+` |
| Change spawn pressure | `365-367`, `416-443`, `3245-3265` |
| Change prestige behavior | `2770-2801`, `3304-3316`, postFX `3575-3595` |
| Change pause menu controls | paused helpers `2868-2913`, renderer `4122-4228` |
| Change touch controls | touch model `1038`, mapping `1122-1150`, sidebar UI `1162-1223` |
| Change scoring formula | KO scoring block `3093-3095`, trackers `2703-2722` |

## Search Cheatsheet

Use these from repo root:

- `rg -n "const TUNING|movement: Object.freeze|combat: Object.freeze|spawn: Object.freeze|world: Object.freeze|uiTiming: Object.freeze" teabag-simulator.html`
- `rg -n "function updateTitleMenuState|function updateModeSelectState|function updateZonePickerState|function updateMenuState|function updatePauseNavigation|function updatePauseSelectionAction|function updatePauseAdjustments|function updatePauseState|function updatePlayerMovementAndJump|function updateMountedCombatState|function updatePlayerTimersAndFX|function updatePlayerState|function updateNPCFSM|function updateNPCSpawning|function updateBusStopAmbient|function updateNPCState|function updateWorldState|function updatePlayingState|function update\(" teabag-simulator.html`
- `rg -n "function renderFrontScreen|function renderWorldLayer|function renderEntityLayer|function renderPostFX|function renderHUDLayer|function renderOverlayLayer|function render\(" teabag-simulator.html`
- `rg -n "TEABAG_DAMAGE|TEABAG_WINDOW|chainWindowSeconds|comboDamageStep" teabag-simulator.html`
- `rg -n "gameState ===|gameState =" teabag-simulator.html`
- `rg -n "const ZONES =|npcPool|triggerPrestige" teabag-simulator.html`
- `rg -n "MIN_NPCS_ON_SCREEN|MAX_NPCS|NPC_DESPAWN_DIST|visibleNPCs|sprintAheadDistance" teabag-simulator.html`
- `rg -n "localStorage|teabag_save|teabag_sfx" teabag-simulator.html`

## Coupling Notes (Avoid Regressions)

- Combo decay intentionally pauses while airborne; it ticks only when `onRealGround` is true (`3144-3145`).
- Chain combo decays only when not mounted (`3147`) and refreshes on remount (`3125`).
- Teabag uses crouch release timing (`3062-3066`), not crouch press.
- Zone unlocks happen both on crossing into a zone (`3312-3314`) and on prestige (`2773-2776`).
- `drawCharacter` is shared by player, NPCs, bus-stop NPCs, title screen, and gallery (`2053`, `3473`, `3928`, `2507`).
- Startup/prestige world warmup still uses `±500` bounds (`2757-2758`, `2794-2795`) while per-frame streaming uses `TUNING.world.generationMargin` (`448`, `3324-3325`); keep those aligned when retuning world density.
