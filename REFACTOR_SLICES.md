# NPC Designer Refactor Slices (Constraint UX + Runtime Parity + Visual Override)

Purpose: additive enhancement of the existing full-featured NPC designer.

## Hard Invariants

- No gameplay constants/tuning value changes.
- No spawn/combat/zone rebalance.
- Existing non-designer NPC render output unchanged.
- Update/render/frame-reset ordering unchanged.
- Existing designer feature surface remains intact.

## Scope

In scope:
- `npc-designer.html`
- `npc-designer.css`
- `npc-designer.js`
- `npc-designer-constraints.js` (new)
- `runtime/npc-render-shared.js` (new)
- `teabag-simulator.html` parity wiring only
- `scripts/convert-npc-designer-json.js` (new)
- `data/npc_payloads/*.json` + `data/npc_payloads/index.json` (new)
- docs/planning updates: `README.md`, `SCHEMATICS.md`, `REFACTOR_SLICES.md`, `REFACTOR_CHECKLIST.md`, `NPC_DESIGNER_CONSTRAINTS_READONLY.md`

Out of scope:
- Gameplay tuning/behavior modifications.
- Runtime spawn/combat/zone balancing.
- Sound asset/runtime path changes.
- Replacing existing layer-based designer systems.

## Slice Plan

### Slice R1: Read-Only/Planning Artifacts (Required First)

Targets:
- `NPC_DESIGNER_CONSTRAINTS_READONLY.md`
- `REFACTOR_SLICES.md`
- `REFACTOR_CHECKLIST.md`

Deliverables:
- Exact anchors, in/out scope, hard/visual contract, caller/callee map, risks, validation plan.

### Slice R2: Shared Runtime Renderer Integration

Targets:
- `runtime/npc-render-shared.js` (new)
- `teabag-simulator.html`

Actions:
- Extract `drawCharacter` implementation into shared runtime module.
- Keep runtime `drawCharacter(...)` call signature and call sites unchanged.
- Wire game runtime through shared renderer wrapper.

### Slice R3: Constraint UX Additions (Additive)

Targets:
- `npc-designer.html`
- `npc-designer.css`
- `npc-designer.js`
- `npc-designer-constraints.js` (new)

Actions:
- Add always-visible Design Readiness panel and Constraint Reference panel.
- Add Strict Visual Rules toggle (default ON).
- Add Auto-fix Visual Issues toggle (default ON when strict ON).
- Add shared validation source powering:
  - inline field/layer/pose issues
  - readiness panel
  - export readiness gate
- Keep existing tools/layers/poses workflows intact.

### Slice R4: Runtime-Parity Preview Additions (Additive)

Targets:
- `npc-designer.html`
- `npc-designer.css`
- `npc-designer.js`
- `runtime/npc-render-shared.js`

Actions:
- Add runtime-parity preview canvas using shared runtime renderer.
- Add preview controls: pose, facing, scale, animation tick.
- Add world-context mode with ground line + reference silhouettes.
- Keep existing pose preview canvases and editing workflow intact.

### Slice R5: Import/Export/Converter + Fixtures

Targets:
- `npc-designer.js`
- `npc-designer-constraints.js`
- `scripts/convert-npc-designer-json.js`
- `data/npc_payloads/*.json`
- `data/npc_payloads/index.json`

Actions:
- Block compact/runtime export only on Hard Safety failures.
- Keep visual warnings non-blocking when strict OFF.
- Persist validation summary + override status in export metadata.
- Keep import validation explicit, non-destructive where possible.
- Add converter + strict-valid / visual-override / hard-fail fixtures.

### Slice R6: Docs + Validation + Finalization

Targets:
- `README.md`
- `SCHEMATICS.md`

Actions:
- Document new constraint UX and runtime-parity preview additions.
- Update schematics for shared runtime renderer wiring.
- Run full validation and parity gates.

## Slice Status (In-Task Update)

- [x] R1 Read-only/Planning artifacts
- [x] R2 Shared runtime renderer integration
- [x] R3 Constraint UX additions
- [x] R4 Runtime-parity preview additions
- [x] R5 Import/export/converter + fixtures
- [x] R6 Docs + validation + finalization
