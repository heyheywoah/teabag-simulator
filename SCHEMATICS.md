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
| Main gameplay update loop | 2626-3170 |
| Main render pipeline | 3171-3574 |
| Parallax silhouettes | 3575-3671 |
| Clouds / birds | 3672-3720 |
| Title / mode / zone picker / pause menus | 3721-4022 |
| Main loop + boot | 4023-4045 |

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2619`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`2701`) | `drawTitleScreen` (`3722`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`2719`) | `drawModeSelect` (`3809`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`2743`) | `drawZonePicker` (`3845`) |
| `playing` | `startGame` (`2662`) or pause resume | esc/pause -> `paused` (`2784`) | world renderer (`3172`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`2766`) | `drawPauseMenu` (`3916`) overlay |

Note: `galleryMode` (`2403`) is orthogonal to `gameState`; `Tab` toggles a debug/preview renderer early in `render` (`3176-3181`).

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Movement tuning | constants `GROUND_Y..AIR_ACCEL` (`352-362`) | velocity + accel logic (`2795-2822`, `2875-2916`) | player draw pose (`3368-3375`) |
| Sprint behavior | double-tap capture (`896-911`, `1018-1041`) + `SPRINT_MULT` (`355`) | sprint state calc (`2795-2801`) | sprint particles (`3030-3033`) |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`356-359`) | jump gate + execution (`2841-2870`) | airborne pose flags (`3372-3373`) |
| Drop-through platforms | crouch + platform flags (`2518`) | trigger + clear (`2824-2829`, `2904-2906`) | platform collision (`2881-2901`) |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`362-363`) | teabag loop (`2931-2979`) | damage/combo popups (`2947-2948`, `3466-3469`) |
| KO + chain scoring | character ko metadata in `CHARACTER_DEFS` (`546+`) | KO branch (`2949-2979`), chain timer (`3017`) | center KO text + chain HUD (`3471-3487`, `3443-3458`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`546-836`) | spawn composition (`2532-2596`) | `drawCharacter` (`1947-2401`) + tracker (`2605-2612`) |
| NPC density / pacing | `MIN_NPCS_ON_SCREEN`, `MAX_NPCS`, `NPC_DESPAWN_DIST` (`365-367`) | spawn/despawn loop (`3099-3113`, `3093`) | visible pressure in world (same frame) |
| Zone progression / prestige | `ZONES` (`370-461`), `zoneLayout` (`466+`) | zone tracking + prestige trigger (`3141-3151`, `2665-2696`) | zone pill + transition banner (`3523-3558`) |
| Procedural world gen | gen funcs (`1291`, `1498`, `1866`) | called in startup/reset + per-frame update (`2652-2653`, `3161-3168`) | rendered in layer order (`3228-3378`) |
| Persistence | `teabag_save` + `teabag_sfx` keys (`293`, `298`, `480`, `489`) | `saveProgress` (`487`) + `saveSFXSettings` (`297`) | loaded at boot (`293`, `480`) |

## Render Order (Authoritative)

Within `render(dt)` (`3172`), world draw order is:

1. Sky gradient + stars (`3215-3226`)
2. Silhouettes, clouds, birds (`3228-3230`)
3. BG buildings (0.3 parallax), FG buildings (0.7), cars (`3233-3238`)
4. Platforms/bus stops (`3242-3248`)
5. Sidewalk + ground pattern blend (`3251-3304`)
6. Bus stop NPCs, props, NPCs, player (`3306-3375`)
7. Particles/popups (`3377-3378`)
8. Night + zone tint + prestige postFX (`3381-3421`)
9. HUD + announcements (`3424-3558`)
10. Pause overlay + mobile sidebars (`3565-3572`)

## Update Order (Authoritative)

Within `update(dt)` (`2698`):

1. Menu-state handling (`2699-2780`)
2. Pause gate (`2783-2786`)
3. Player input + movement + jump + collisions (`2788-2917`)
4. Mounted/teabag/combo logic + head landing (`2920-3013`)
5. Combo timers + animation timers (`3015-3027`)
6. NPC FSM + despawn (`3035-3094`)
7. NPC spawn pressure logic (`3098-3114`)
8. Bus-stop idle NPC panic reaction (`3116-3122`)
9. Camera + campaign boundary (`3124-3137`)
10. Zone transition/prestige/unlock checks (`3140-3157`)
11. Generation + world systems (`3161-3168`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `352-362`, `2795-2872` |
| Change teabag damage curve | `362-363`, `2940-2943` |
| Change chain window length | `2960`, `2998`, `3017`, HUD bar `3458` |
| Add new NPC type | `546-834` (definition), zone `npcPool` in `370-461` |
| Add new zone | `370-461`, zone blend assumptions `532-543`, render pattern branch `3259+`, silhouettes `3578+` |
| Change spawn pressure | `365-367`, `3099-3113` |
| Change prestige behavior | `2665-2696`, `3141-3151`, postFX `3400-3421` |
| Change pause menu controls | update paused block `2748-2778`, renderer `3916-4020` |
| Change touch controls | touch model `933`, mapping `1018-1043`, sidebar UI `1057-1117` |
| Change scoring formula | KO scoring block `2966-2968`, trackers `2598-2612` |

## Search Cheatsheet

Use these from repo root:

- `rg -n "function update\(|function render\(" teabag-simulator.html`
- `rg -n "// Teabag mechanic|TEABAG_DAMAGE|TEABAG_WINDOW" teabag-simulator.html`
- `rg -n "gameState ===|gameState =" teabag-simulator.html`
- `rg -n "const ZONES =|npcPool|triggerPrestige" teabag-simulator.html`
- `rg -n "visibleNPCs|MIN_NPCS_ON_SCREEN|MAX_NPCS|NPC_DESPAWN_DIST" teabag-simulator.html`
- `rg -n "localStorage|teabag_save|teabag_sfx" teabag-simulator.html`

## Coupling Notes (Avoid Regressions)

- Combo decay is intentionally paused while airborne; it only ticks when `onRealGround` is true (`3015`).
- Chain combo decays only when not mounted (`3017`), and is refreshed on remount (`2998`).
- Teabag uses crouch release timing (`2936-2940`), not crouch press, so input changes can alter DPS unexpectedly.
- Zone unlocks happen both on crossing into a zone (`3149-3151`) and on prestige (`2668-2671`).
- `drawCharacter` is shared by player, NPCs, bus-stop NPCs, title screen, and gallery; style edits have global blast radius.
