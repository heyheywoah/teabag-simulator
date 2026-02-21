# GameContext Refactor Slices (Read-Only Pass)

Purpose: define exact scope, boundaries, and mechanical slices for introducing a `GameContext` without behavior changes.

Status of this pass:
- Read-only analysis only (no `teabag-simulator.html` edits).
- Baseline branch: `refactor/update-render-split` (ahead by 2 commits).

## Refactor Goal

Introduce a single `GameContext` boundary for update/render orchestration so game logic can be reused for other game styles with lower coupling to globals.

Primary constraints:
- Preserve gameplay and mobile/browser behavior.
- Avoid changing persistence shape.
- Keep audio/runtime paths unchanged.

## Current Architecture Findings

## Mutable State Surface

Global mutable state is concentrated in these groups:

1. Audio/SFX state
- `sfxAC`, `sfxVolume`, `sfxMuted`, `sfxNoiseBuffers` (`teabag-simulator.html:24-27`)

2. World/progression state
- `zoneLayout`, `currentZoneIndex`, `currentZone`, `gameMode`, `endlessZoneId`, `prestigeLevel`, `zoneTransitionAnim`, `unlockedZones`, `bestPrestige`, `allTimeKOs`, `bestChainCombo` (`teabag-simulator.html:587-597`)
- persistence load/save at `teabag-simulator.html:600-612`

3. Input/UI state
- `keys`, `justPressed`, `doubleTap`, `sprintLocked` (`teabag-simulator.html:1012-1016`)
- `touch` + `touchIds` + touch dtap (`teabag-simulator.html:1054-1055`, `teabag-simulator.html:1138`)
- `showTouch` (`teabag-simulator.html:1053`)

4. Simulation collections and generators
- `particles`, `popups`, `platforms`, `buildings`, `bgBuildings`, `props`, `cars`, `npcs` (`teabag-simulator.html:1242`, `teabag-simulator.html:1324`, `teabag-simulator.html:1345`, `teabag-simulator.html:1522-1524`, `teabag-simulator.html:1956`, `teabag-simulator.html:2645`)
- generation cursors: `platGen*`, `cityGen*`, `bgGen*` (`teabag-simulator.html:1346-1347`, `teabag-simulator.html:1525-1528`)

5. Core actor/camera state
- `player` (`teabag-simulator.html:2631`)
- `cam` (`teabag-simulator.html:1342`)

6. HUD/game flow state
- `score`, `totalKOs`, `koTracker`, `centerKO` (`teabag-simulator.html:2720-2736`)
- `gameState`, `titleBlink`, `lastTime`, `menuSelection`, `pauseSelection`, `zonePickerIndex` (`teabag-simulator.html:2740-2745`)
- `galleryMode` and gallery controls (`teabag-simulator.html:2524-2526`)

7. Config/data surface
- `TUNING` (`teabag-simulator.html:370`)
- zone/NPC content defs (`teabag-simulator.html:491+`, `teabag-simulator.html:667+`)

## Runtime Entry Points

1. Input event listeners
- keyboard: `keydown` / `keyup` (`teabag-simulator.html:1017-1039`)
- touch: start/move/end/cancel (`teabag-simulator.html:1105-1170`)
- key toggle for touch HUD (`teabag-simulator.html:1173-1175`)

2. Frame loop
- `loop(timestamp)` (`teabag-simulator.html:4258-4267`)
- boot RAF call (`teabag-simulator.html:4272`)

3. Mode/progression transitions
- `startGame()` (`teabag-simulator.html:2748`)
- `triggerPrestige()` (`teabag-simulator.html:2797`)

## Runtime Exit/Side-Effect Points

1. Canvas rendering
- `render(dt)` and draw subtrees (`teabag-simulator.html:3775+`)

2. Audio
- `playSFX(id)` (`teabag-simulator.html:87`)

3. Persistence
- `saveProgress()` (`teabag-simulator.html:608`)
- `saveSFXSettings()` (`teabag-simulator.html:297`)

4. Browser integration
- service worker registration (`teabag-simulator.html:4274-4275`)

## Coupling and Risk Findings

1. Primitive aliasing risk
- Many critical fields are primitives (`gameState`, `score`, `prestigeLevel`, etc.).
- A naive `ctx.state = { gameState }` would copy values and desync.

2. Event-listener closure coupling
- Input handlers directly mutate globals and gate behavior on `gameState` (`teabag-simulator.html:1161-1164`).
- Context migration must preserve this exact ordering/condition.

3. Frame-end cleanup ordering is brittle
- `justPressed` clearing and `touch.*Just` resets happen after `render` (`teabag-simulator.html:4263-4265`).
- Changing this order can alter menu/input feel.

4. Cross-system writes are widespread
- Combat updates score, tracker, persistence, particles, and center announcements in one flow (`teabag-simulator.html:3094-3134`).

5. Coordinator split exists, deep systems still global
- Top-level update/render decomposition is good (`teabag-simulator.html:2877-3377`, `teabag-simulator.html:3381-3773`),
  but lower-level systems still read globals directly.

## In Scope (Phase A: Coordinator GameContext)

1. Add a `GAME_CTX` scaffold that is a thin boundary over existing globals.
2. Thread `ctx` through orchestration layers:
- update dispatcher and its immediate helpers
- render dispatcher and immediate front/overlay helpers
- `startGame` and `triggerPrestige`
- frame loop and end-of-frame input reset
3. Keep deep systems behavior-preserving even if still global internally.
4. Update schematics/docs to reflect new function signatures and entry points.

## Out of Scope (Phase A)

1. Rewriting SFX engine internals (`teabag-simulator.html:23-299`).
2. Rewriting procedural generation/render internals (`generateCity`, `generatePlatforms`, building/prop draw paths).
3. Replacing all globals with a single state object in one pass.
4. Save schema/version changes.
5. Content/data model changes (`ZONES`, `CHARACTER_DEFS`, sound defs).

## Proposed Context Shape (Bridge, Not Big-Bang)

Use a bridge context to avoid desync:

1. Object/array refs directly:
- `ctx.refs.player = player`, `ctx.refs.npcs = npcs`, `ctx.refs.cam = cam`, etc.

2. Primitive accessors (getter/setter wrappers):
- `ctx.state.gameState`, `ctx.state.score`, `ctx.state.prestigeLevel`, etc.
- Accessors read/write existing globals.

3. Service facade:
- `ctx.services.playSFX`, `ctx.services.saveProgress`, `ctx.services.saveSFXSettings`, `ctx.services.now`

4. Input facade:
- `ctx.input.keys`, `ctx.input.justPressed`, `ctx.input.touch`

5. Config facade:
- `ctx.config.tuning = TUNING`

## Mechanical Slice Plan

Each slice is designed to be behavior-preserving and independently verifiable.

### Slice A0: Context scaffold only
- Add `createGameContext()` and `const GAME_CTX = createGameContext()` near game state section.
- No call-site changes yet.
- Risk: low.

### Slice A1: Loop boundary threading
- Change `loop` to call `update(GAME_CTX, dt)` and `render(GAME_CTX, dt)`.
- Extract frame-end input reset into `endFrameInputReset(ctx)` with same order as today.
- Risk: medium (input timing).

### Slice A2: Update dispatcher threading
- Change signatures:
  - `update(ctx, dt)`
  - `updateMenuState(ctx, dt)`
  - `updatePauseState(ctx)`
  - `updatePlayingState(ctx, dt)`
- Keep internal deep systems unchanged where possible.
- Risk: medium.

### Slice A3: Menu/pause/startup/progression threading
- Update signatures:
  - `startGame(ctx)`
  - `triggerPrestige(ctx)`
  - menu/pause helper signatures to accept `ctx`
- Keep behavior identical (same branches/ordering).
- Risk: medium.

### Slice A4: Render dispatcher threading
- Change signatures:
  - `render(ctx, dt)`
  - `renderFrontScreen(ctx)`
  - `renderOverlayLayer(ctx, sky)`
  - optional: `renderHUDLayer(ctx)`
- Keep world/entity/postfx draw internals unchanged unless needed.
- Risk: medium.

### Slice A5: Coordinator internals to ctx reads/writes
- Replace direct coordinator-level global reads (`gameState`, `menuSelection`, etc.) with `ctx.state.*`.
- Avoid deep algorithm rewrites in this phase.
- Risk: medium/high.

### Slice A6: Optional Phase B (deeper systems)
- Thread ctx into `updatePlayerMovementAndJump`, `updateMountedCombatState`, `updateNPCFSM`, etc.
- This is the higher-risk expansion and can be deferred.
- Risk: high.

## Validation Gates Per Slice

1. Syntax: `node --check` on extracted inline JS.
2. Quick gameplay flow sanity path (when runtime validation is available):
- title -> mode select -> gameplay -> pause -> zone transition -> prestige
3. Touch flow sanity:
- menu navigation on mobile controls
- crouch/jump/pause behavior unchanged in `playing`
4. Verify end-of-frame input reset order unchanged.

## Explicit Entry/Exit Matrix for Context Boundary

Entry points to accept `ctx` first:
- `startGame` (`teabag-simulator.html:2748`)
- `triggerPrestige` (`teabag-simulator.html:2797`)
- `update` (`teabag-simulator.html:3374`)
- `render` (`teabag-simulator.html:3775`)
- `loop` (`teabag-simulator.html:4258`)

Exit points to keep as services:
- `playSFX` (`teabag-simulator.html:87`)
- `saveProgress` (`teabag-simulator.html:608`)
- `saveSFXSettings` (`teabag-simulator.html:297`)

## Recommendation

Proceed with Phase A only first (A0-A5), then ship/verify.
Defer deep system threading (A6) until after stability confirmation.
