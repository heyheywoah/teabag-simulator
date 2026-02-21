# GameContext Refactor Checklist

Execution checklist derived from `REFACTOR_SLICES.md`.

## Preconditions

- [ ] Confirm working tree is clean or intentionally staged.
- [ ] Re-read `REFACTOR_SLICES.md` scope and out-of-scope boundaries.
- [ ] Confirm this run is Phase A (coordinator context), not deep system rewrite.

## Slice A0: Context Scaffold

- [ ] Add `createGameContext()` near game state section.
- [ ] Add `const GAME_CTX = createGameContext()`.
- [ ] Include facades: `config`, `input`, `services`, `state` (with primitive accessors), `refs`.
- [ ] No behavior logic changes in this slice.
- [ ] Run syntax check.

## Slice A1: Loop Boundary

- [ ] Change `update(dt)` -> `update(ctx, dt)` and `render(dt)` -> `render(ctx, dt)` call sites in `loop`.
- [ ] Extract `endFrameInputReset(ctx)` with same ordering as current clear logic.
- [ ] Ensure `requestAnimationFrame(loop)` behavior unchanged.
- [ ] Run syntax check.

## Slice A2: Update Dispatcher

- [ ] Thread `ctx` through update dispatcher helpers.
- [ ] Keep deep update internals unchanged where possible.
- [ ] Verify pause gate still short-circuits correctly.
- [ ] Run syntax check.

## Slice A3: Startup/Progression/Menu/Pause

- [ ] Thread `ctx` into `startGame`, `triggerPrestige`, menu, pause helpers.
- [ ] Preserve menu transitions and mode/zone selection behavior.
- [ ] Preserve SFX pause-row behavior (`mute`/`volume`).
- [ ] Run syntax check.

## Slice A4: Render Dispatcher

- [ ] Thread `ctx` into render dispatcher/front/overlay helpers.
- [ ] Keep draw order identical.
- [ ] Preserve pause overlay draw position and sidebar behavior.
- [ ] Run syntax check.

## Slice A5: Coordinator State Access

- [ ] Move coordinator-level direct global reads/writes to `ctx.state` accessors.
- [ ] Keep low-level systems unchanged unless required for compile.
- [ ] Re-run syntax check.

## Validation

- [ ] Gameplay flow sanity path reported when runtime validation is available: title -> mode select -> gameplay -> pause -> zone transition -> prestige.
- [ ] Touch sanity: menu nav + jump/bag/pause unchanged on mobile.
- [ ] Verify frame-end input reset semantics are unchanged.

## Documentation

- [ ] Update `SCHEMATICS.md` for all line/signature shifts after each game-file edit task.
- [ ] Add brief mechanics change log to final report (impact + risks).

---

## NPC Designer Feature Checklist (2026-02-21)

### Preconditions

- [ ] Confirm branch is based on `refactor/update-render-split`.
- [ ] Confirm `NPC_DESIGNER_READONLY.md` exists and is complete.
- [ ] Confirm implementation edits are limited to tooling/docs scope.

### Slice N1: Scaffold

- [ ] Add `npc-designer.html`, `npc-designer.css`, `npc-designer.js`.
- [ ] Wire responsive desktop/mobile-safe layout and core toolbar.

### Slice N2: Document/Pose Model

- [ ] Implement editable document schema and state container.
- [ ] Implement `male_base` and `female_base` templates.
- [ ] Implement independent pose workspaces (`normal`, `panic`, `ko`).
- [ ] Implement copy-pose and reset-to-template actions.

### Slice N3: Tooling Surface

- [ ] Implement select, move, resize handles, rect, ellipse, line, curve, polygon.
- [ ] Implement color select tool, gradient workflow, eyedropper tool.
- [ ] Implement hand pan tool and zoom controls.
- [ ] Implement Shift aspect-ratio locking for rect/ellipse resize.

### Slice N4: Layer System

- [ ] Layer list UI with rename/reorder/hide/lock/duplicate/delete.
- [ ] Multi-select layer controls (Shift/Cmd/Ctrl).
- [ ] Group move/resize for multi-selection.

### Slice N5: Preview + Height References

- [ ] Render live preview for all three poses.
- [ ] Add facing-direction toggle.
- [ ] Add height reference lines/labels using existing game character dimensions.
- [ ] Add optional silhouette overlay toggle.

### Slice N6: JSON + Docs

- [ ] Implement editable JSON export/import round-trip.
- [ ] Implement copy-to-clipboard and download export actions.
- [ ] Implement compact integration payload export.
- [ ] Update `README.md` with tool usage/workflow.

### Final Validation

- [ ] Syntax check passes for changed JS files.
- [ ] Runtime validation status reported (executed or explicit skip reason).
- [ ] Sound-path validation status reported (executed or explicit skip reason).
- [ ] `SCHEMATICS.md` updated only if any game file changed.
- [ ] Final handoff includes mechanics change log (surface, impact, risks).
