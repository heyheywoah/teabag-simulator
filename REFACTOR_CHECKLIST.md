# NPC Designer Refactor Checklist (Constraint UX + Runtime Parity)

## Phase 1 Gate (Read-Only First)

- [x] Read `SCHEMATICS.md` before planning/editing.
- [x] Created `NPC_DESIGNER_CONSTRAINTS_READONLY.md` with anchors and contract.
- [x] Updated `REFACTOR_SLICES.md` with ordered mechanical slices.
- [x] Updated `REFACTOR_CHECKLIST.md` with acceptance gates.
- [x] No implementation edits performed before these artifacts.

## Scope and Invariant Gate

- [x] Diff scope limited to expected files.
- [x] No gameplay constants/tuning values changed.
- [x] No spawn/combat/zone rebalance.
- [x] Existing designer core capabilities preserved.

## Preserved Existing Designer Capabilities (Must Stay PASS)

- [x] Tools still available: select/move/rect/ellipse/line/curve/polygon/color/gradient/eyedropper/hand/zoom controls.
- [x] Layer workflow still available: reorder/lock/hide/multi-select/group transforms.
- [x] Pose workflow still available: normal/panic/ko with pose isolation.
- [x] Existing JSON round-trip behavior still operational.
- [x] Height reference workflow still operational.

## Constraint UX Gate

- [x] Shared constraints source used by inline validation + readiness + export-readiness.
- [x] Hard Safety rules non-bypassable and export-blocking.
- [x] Visual rules separated from hard rules.
- [x] Strict Visual Rules toggle defaults ON.
- [x] Auto-fix Visual Issues toggle defaults ON when strict is ON.
- [x] Strict OFF keeps visual issues as warnings only.
- [x] Design Readiness panel always visible.
- [x] Constraint Reference panel always visible.
- [x] Inline errors provide jump-to-target behavior.

## Runtime-Parity Preview Gate

- [x] Runtime preview uses shared game render logic (not a parallel renderer).
- [x] Preview controls include pose/facing/scale/animation tick.
- [x] World-context preview includes ground line and reference silhouettes.
- [x] Non-designer NPC runtime render parity unchanged.

## Import/Export/Converter Gate

- [x] Compact/runtime export blocked only by hard failures.
- [x] Visual warnings do not block export when strict OFF.
- [x] Export metadata includes validation summary + override status.
- [x] Import validation explicit and non-destructive where possible.
- [x] Converter script added and executable.
- [x] Fixture payloads added: strict-valid / visual-override / hard-fail.

## Documentation Gate

- [x] `README.md` updated for user-facing enhancement.
- [x] `SCHEMATICS.md` updated when game file changed.

## Validation Gate

- [x] Syntax checks passed for changed JS files.
- [x] Converter runs reported (strict-valid + visual-override + hard-fail).
- [x] Non-designer render parity check passed.
- [x] Runtime validation status reported (executed or exact skip reason).
- [x] Sound-path validation reported not required unless changed.

## Final PASS/FAIL Gate

- [x] Pre-commit scope check PASS.
- [x] Planned edits from `NPC_DESIGNER_CONSTRAINTS_READONLY.md` present PASS.
- [x] Invariants PASS.
- [x] Validation reporting PASS.
- [x] Mechanics change log included PASS.
