# NPC Payload Runtime Reintegration Checklist

## Phase 1 Gate (Read-Only First)

- [x] Read `SCHEMATICS.md` before planning/editing.
- [x] Created `docs/history/read-only/NPC_JSON_REINTEGRATION_READONLY.md` with anchors/call-map/invariants/risks.
- [x] Updated `docs/planning/REFACTOR_SLICES.md` with ordered mechanical slices.
- [x] Updated `docs/planning/REFACTOR_CHECKLIST.md` with task gates.
- [x] No implementation edits performed before these artifacts.

## Scope Gate

- [x] `git diff --name-only` limited to expected file scope for this task.
- [x] `git diff --name-only | rg '^scripts/convert-npc-designer-json.js$'` is empty.
- [x] Out-of-scope files untouched (`npc-designer*.{html,css,js}` and constraints script).

## Invariant Gate

- [x] No gameplay constants/tuning value changes.
- [x] No spawn/combat/zone rebalance.
- [x] No spawn selection/pool edits (`npcPool`, `spawnNPC(`, `updateNPCSpawning(`, `ZONES =` diffs for spawn logic).
- [x] Update/render/frame-end reset ordering unchanged.
- [x] Non-designer NPC rendering parity unchanged.

## Runtime Registry Gate

- [x] Runtime loads `data/npc_payloads/index.json` without exception.
- [x] Normalized map keyed by payload id is populated on success.
- [x] Registry failure path is non-fatal and falls back to legacy rendering.
- [x] Unknown/missing `designerPayloadId` falls back safely.

## Pose + Render Path Gate

- [x] Pose mapping implemented (`ko` -> `ko`, panic/flee -> `panic`, else `normal`).
- [x] Shared renderer supports `rect|ellipse|line|curve|polygon`.
- [x] Layer order, visibility, style, and opacity honored.
- [x] Legacy non-designer renderer path preserved as fallback/default.

## Sample Rollout Gate

- [x] Sample designer NPC route is gallery-only or debug-gated.
- [x] No spawn pool edits for sample rollout.

## Docs Gate

- [x] `README.md` updated (feature-level change).
- [x] `SCHEMATICS.md` updated because game file(s) changed.

## Validation Gate

- [x] Syntax check passed for changed JS.
- [x] Converter strict-valid fixture returns `rc=0`.
- [x] Converter visual-override deterministic run (`--strict-visual off --auto-fix off`) returns `rc=0`.
- [x] Converter hard-fail fixture returns `rc=2`.
- [x] Positional output form works.
- [x] `--out` output form works.
- [x] Precedence check passes (`--out` path created, positional output path absent).
- [x] Mechanical guard check for forbidden spawn edits returns empty output.
- [x] Baseline parity reference extracted from `656b34a` and compared for non-designer rendering behavior.
- [x] Runtime validation status reported (executed or explicit skip reason).
- [x] Sound-path validation reported as not required unless touched.

## Final PASS/FAIL

- [x] All Phase 2 items implemented.
- [x] Failure-path fallback verified.
- [x] Invariants hold.
- [x] Validation evidence collected.
- [x] Mechanics change log prepared for handoff.

---

# 2026-02-22 NPC Designer Interaction UX Checklist

## Phase 1 Gate (Read-Only First)

- [x] Read `SCHEMATICS.md` before planning/editing.
- [x] Updated `docs/planning/REFACTOR_SLICES.md` with in/out scope and ordered slices.
- [x] Updated `docs/planning/REFACTOR_CHECKLIST.md` with this task gate list before implementation edits.

## Scope Gate

- [x] `git diff --name-only` limited to expected files (`npc-designer.html`, `npc-designer.css`, `npc-designer.js`, `README.md`, planning docs).
- [x] No edits to `scripts/convert-npc-designer-json.js`.
- [x] No edits to `data/npc_payloads/*`.
- [x] No edits to gameplay files (`teabag-simulator.html`, `sound-designer.html`, `index.html`, `sw.js`, `manifest.json`).

## Rotate Tool Gate

- [x] Rotate tool appears in tool surface and activates via toolbar selection.
- [x] Selected-layer rotation works with pointer drag.
- [x] Shift-modified snapping works during rotate drag.
- [x] Existing move/resize/reshape tools still work (no codepath removal; interactions preserved).

## Undo/Redo Gate

- [x] Undo/redo buttons are present and enabled/disabled correctly.
- [x] `Cmd/Ctrl+Z` undo works (shortcut wiring added).
- [x] `Shift+Cmd/Ctrl+Z` and/or `Ctrl+Y` redo works (both wired).
- [x] Undo/redo restores layer geometry and selection without crashing (snapshot restore path implemented).

## Accordion Gate

- [x] All left sidebar `.panel-block` containers are collapsible.
- [x] All right sidebar `.panel-block` containers are collapsible.
- [x] Controls within collapsed sections remain functional when re-opened (DOM nodes are moved, not recreated).

## Docs + Validation Gate

- [x] `README.md` updated for new designer features.
- [x] `node --check npc-designer.js` passes.
- [x] Runtime validation status reported (browser interaction skipped in terminal-only run).
- [x] Sound-path validation reported (not required unless sound scope changed).

## Final PASS/FAIL

- [x] All requested features implemented without unrelated regressions.
- [x] Mechanics change log prepared for handoff.
