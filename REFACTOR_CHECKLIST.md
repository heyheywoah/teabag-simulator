# NPC Payload Runtime Reintegration Checklist

## Phase 1 Gate (Read-Only First)

- [x] Read `SCHEMATICS.md` before planning/editing.
- [x] Created `NPC_JSON_REINTEGRATION_READONLY.md` with anchors/call-map/invariants/risks.
- [x] Updated `REFACTOR_SLICES.md` with ordered mechanical slices.
- [x] Updated `REFACTOR_CHECKLIST.md` with task gates.
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
