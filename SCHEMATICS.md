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
| Global game state | 2739-2746 |
| Update pipeline (menu/pause/gameplay/world) | 2747-3379 |
| Render pipeline (front screens + world layers + HUD) | 3380-3808 |
| Parallax silhouettes | 3809-3905 |
| Clouds / birds | 3906-3954 |
| Title / mode / zone picker / pause menus | 3955-4256 |
| Main loop + boot | 4257-4279 |

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2740`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`2833`) | `drawTitleScreen` (`3956`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`2843-2850`) | `drawModeSelect` (`4043`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`2864-2873`) | `drawZonePicker` (`4079`) |
| `playing` | `startGame` (`2748`, `2794`) or pause resume | ESC/P/pause touch -> `paused` (`3364-3365`) | gameplay renderer via `render()` (`3775`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`2912-2917`) | `drawPauseMenu` (`4150`) overlay |

Note: `galleryMode` (`2524`) is orthogonal to `gameState`; `Tab` toggles preview rendering through `renderFrontScreen` (`3381`).

## Update/Render Dispatch Helpers

- `updateTitleMenuState(dt)` at `teabag-simulator.html:2831`
- `updateModeSelectState()` at `teabag-simulator.html:2836`
- `updateZonePickerState()` at `teabag-simulator.html:2855`
- `updateMenuState(dt)` at `teabag-simulator.html:2877`
- `updatePauseNavigation()` at `teabag-simulator.html:2896`
- `updatePauseSelectionAction()` at `teabag-simulator.html:2907`
- `updatePauseAdjustments()` at `teabag-simulator.html:2921`
- `updatePauseState()` at `teabag-simulator.html:2935`
- `updatePlayerMovementAndJump(dt, p, onNPC)` at `teabag-simulator.html:2944`
- `updateMountedCombatState(p)` at `teabag-simulator.html:3072`
- `updatePlayerTimersAndFX(dt, p, onNPC)` at `teabag-simulator.html:3170`
- `updatePlayerState(dt)` at `teabag-simulator.html:3198`
- `updateNPCFSM(dt, p)` at `teabag-simulator.html:3212`
- `updateNPCSpawning(p)` at `teabag-simulator.html:3273`
- `updateBusStopAmbient(dt, p)` at `teabag-simulator.html:3295`
- `updateNPCState(dt, p)` at `teabag-simulator.html:3311`
- `updateWorldState(dt, p)` at `teabag-simulator.html:3317`
- `updatePlayingState(dt)` at `teabag-simulator.html:3362`
- `update(dt)` dispatcher at `teabag-simulator.html:3374`
- `renderFrontScreen()` at `teabag-simulator.html:3381`
- `renderWorldLayer(sky)` at `teabag-simulator.html:3413`
- `renderEntityLayer()` at `teabag-simulator.html:3501`
- `renderPostFX(sky)` at `teabag-simulator.html:3582`
- `renderHUDLayer()` at `teabag-simulator.html:3628`
- `renderOverlayLayer(sky)` at `teabag-simulator.html:3770`
- `render(dt)` dispatcher at `teabag-simulator.html:3775`

## Tuning Surface (Gameplay + HUD)

Central tuning object: `TUNING` at `teabag-simulator.html:370`

| Group | Canonical fields | Main consumers |
| --- | --- | --- |
| `movement` | air control/jump multipliers, drop-through, landing, walk/breath/blink, sprint trail | `updatePlayerMovementAndJump` (`2944`), `updatePlayerTimersAndFX` (`3170`) |
| `combat` | combo damage curve, chain window, dismount velocity, KO shake, aerial bonus | `updateMountedCombatState` (`3072`), `renderHUDLayer` (`3628`) |
| `spawn` | NPC pacing, panic/flee cadence, spawn margins, sprint-ahead pressure | `updateNPCFSM` (`3212`), `updateNPCSpawning` (`3273`), `updateBusStopAmbient` (`3295`) |
| `world` | camera lead/follow, campaign soft wall, bootstrap world warmup/spawn burst, generation margin | `startGame` (`2748`), `triggerPrestige` (`2797`), `updateWorldState` (`3317`) |
| `uiTiming` | postFX intensity, chain HUD timing, combo label, KO/zone transition animation curves | `renderPostFX` (`3582`), `renderHUDLayer` (`3628`), zone transition setup (`3338`) |

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Movement tuning | physics constants + `TUNING.movement` (`351-489`) | movement/jump resolver (`2944-3070`) | player pose in `drawCharacter` (`2069`) via `renderEntityLayer` (`3501`) |
| Sprint behavior | double-tap input (`1015-1050`, `1145-1156`) + speed constants (`355`, `374`, `437-440`) | sprint state + air carry (`2946-2953`) | sprint particles (`3192-3194`) |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`356-358`) + movement tuning (`373-385`) | jump gate + execution (`2992-3019`) | airborne pose flags (`3573-3574`) |
| Drop-through platforms | player flags (`2639`) + movement tuning (`380`, `384`) | trigger/clear (`2976-2981`, `3056-3058`) | one-way platform collision (`3032-3053`) |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`362-363`) + `TUNING.combat` (`396-415`) | teabag loop (`3091-3162`) | hit popups/announcements (`3101-3102`, `3674-3696`) |
| KO + chain scoring | character KO metadata in `CHARACTER_DEFS` (`667+`) | KO branch + chain timers (`3105-3126`, `3153`, `3175`) | chain HUD + center KO (`3652-3670`, `3680-3696`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`667-958`) | spawn composition (`2656-2718`) | `drawCharacter` (`2069-2522`) + tracker (`2726-2735`, `3698+`) |
| NPC density / pacing | global caps (`365-367`) + `TUNING.spawn` (`416-443`) | spawn/despawn loops (`3266-3293`) | world pressure in same frame |
| Zone progression / prestige | `ZONES` (`491-584`), `zoneLayout` (`587+`) | zone tracking + prestige (`3332-3342`, `2797-2829`) | zone pill + transition banner (`3731-3767`) |
| Procedural world gen | generation funcs (`1412`, `1619`) + `TUNING.world` margins (`448`, `452`) | startup/prestige/per-frame generation (`2776-2777`, `2822-2823`, `3352-3353`) | rendered in layer order (`3413-3773`) |
| Persistence | save keys `teabag_save`/`teabag_sfx` (`293`, `601`) | `saveProgress` (`608`) + `saveSFXSettings` (`297`) | loaded at boot (`293`, `601`) |

## Render Order (Authoritative)

Within `render(dt)` (`3775`), draw order is:

1. Sky gradient fill (`3785-3790`)
2. Stars + silhouettes + clouds + birds (`3414-3428`)
3. BG buildings (0.3), FG buildings (0.7), cars (`3430-3436`)
4. Platforms and bus stop structures (`3438-3445`)
5. Sidewalk + ground pattern blend (`3447-3498`)
6. Bus stop NPCs, props, NPCs, player (`3505-3576`)
7. Particles/popups (`3578-3579`)
8. PostFX + HUD (`3770-3773`, internals `3582-3768`)
9. Pause overlay when paused (`3798-3803`)
10. Sidebars (`3805`)

## Update Order (Authoritative)

Within `update(dt)` (`3374`), dispatch flow is:

1. Menu dispatcher (`3375` -> `2877-2893`)
2. Pause dispatcher (`3376` -> `2935-2942`)
3. Playing pause gate (`3364-3366`)
4. Player movement/jump systems (`2944-3070`)
5. Mounted combat + head-mount checks (`3072-3168`)
6. Player timers/animation/fx (`3170-3195`)
7. NPC FSM + despawn (`3212-3271`)
8. NPC spawn pressure (`3273-3293`)
9. Bus-stop ambient updates (`3295-3308`)
10. Camera + zone/progression + generation + world systems (`3317-3360`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `351-367`, `370-395`, `2944-3019` |
| Change teabag damage curve | `362-363`, `398-405`, `3094-3097` |
| Change chain window length | `405`, `3115`, `3153`, `3666` |
| Add new NPC type | `667-957` (definition), zone `npcPool` in `491-584` |
| Add new zone | `491-584`, blend assumptions `653-664`, render pattern branch `3453+`, silhouettes `3809+` |
| Change spawn pressure | `365-367`, `416-443`, `3273-3293` |
| Change prestige behavior | `2797-2829`, `3332-3342`, postFX `3602-3625` |
| Change pause menu controls | paused helpers `2896-2942`, renderer `4150-4256` |
| Change touch controls | touch model `1054`, mapping `1132-1166`, sidebar UI `1178-1240` |
| Change scoring formula | KO scoring block `3121-3123`, trackers `2719-2738` |

## Search Cheatsheet

Use these from repo root:

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

- Combo decay intentionally pauses while airborne; it ticks only when `onRealGround` is true (`3172-3173`).
- Chain combo decays only when not mounted (`3175`) and refreshes on remount (`3153`).
- Teabag uses crouch release timing (`3091-3094`), not crouch press.
- Zone unlocks happen both on crossing into a zone (`3340-3342`) and on prestige (`2801-2804`).
- `drawCharacter` is shared by player, NPCs, bus-stop NPCs, title screen, and gallery (`2069`, `3501`, `3956`, `2523`).
- Bootstrap world warmup and spawn burst values are now centralized in `TUNING.world` (`444-465`); keep bootstrap (`452+`) and streaming (`448`, `3352-3353`) margins intentionally aligned for pacing.
