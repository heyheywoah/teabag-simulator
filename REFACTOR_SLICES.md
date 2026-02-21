# NPC Payload Runtime Reintegration Slices

Purpose: reintegrate designer JSON payloads into runtime rendering with strict fallback safety and no gameplay rebalance.

## Hard Invariants

- No gameplay constants/tuning changes.
- No spawn/combat/zone rebalance.
- No `npcPool` / spawn-selection edits.
- Update/render/frame-reset ordering unchanged.
- Non-designer NPC render parity unchanged.

## Scope

In scope:
- `teabag-simulator.html`
- `runtime/npc-render-shared.js`
- `data/npc_payloads/index.json`
- `data/npc_payloads/*.json` only if required for runtime sample wiring
- `README.md`
- `SCHEMATICS.md`
- `REFACTOR_SLICES.md`
- `REFACTOR_CHECKLIST.md`
- `NPC_JSON_REINTEGRATION_READONLY.md`

Out of scope:
- `npc-designer.html`
- `npc-designer.css`
- `npc-designer.js`
- `npc-designer-constraints.js`
- `scripts/convert-npc-designer-json.js`

## Mechanical Slice Order

### Slice J1: Read-Only Artifacts (Required First)

Targets:
- `NPC_JSON_REINTEGRATION_READONLY.md`
- `REFACTOR_SLICES.md`
- `REFACTOR_CHECKLIST.md`

Actions:
- Lock exact anchors and call graph.
- Define in/out scope and invariants.
- Define explicit failure-path fallback plan.

### Slice J2: Runtime Payload Registry Load + Normalize

Targets:
- `teabag-simulator.html`
- `data/npc_payloads/index.json` (if schema extension needed)

Actions:
- Add async loader for `data/npc_payloads/index.json`.
- Normalize payloads into in-memory map keyed by payload `id`.
- Keep loader failure non-fatal with warning-only behavior.

### Slice J3: Optional Payload Lookup + Pose Resolution Bridge

Targets:
- `teabag-simulator.html`

Actions:
- Add optional `designerPayloadId` handling in runtime character path.
- Resolve pose mapping:
  - `ko` -> `ko`
  - panic/flee -> `panic`
  - otherwise -> `normal`
- Keep unknown/missing id as legacy fallback.

### Slice J4: Shared Renderer Designer-Payload Draw Path

Targets:
- `runtime/npc-render-shared.js`

Actions:
- Add designer-layer draw branch for `rect|ellipse|line|curve|polygon`.
- Respect layer order, visibility, style, opacity.
- Preserve existing legacy draw body as default/fallback path.

### Slice J5: Gallery/Debug Sample Wiring (No Spawn Impact)

Targets:
- `teabag-simulator.html`
- `data/npc_payloads/*.json` only if needed

Actions:
- Wire one sample designer payload path as gallery-only or debug-gated.
- No spawn pool edits and no runtime gameplay routing changes.

### Slice J6: Docs + Validation + Finalization

Targets:
- `README.md`
- `SCHEMATICS.md`

Actions:
- Document runtime payload registry + fallback behavior.
- Update schematics anchors for new loader/lookup/render bridge.
- Run required checks, converter compatibility, parity guard, and mechanical guard diff.

## Slice Status

- [x] J1 Read-only artifacts
- [x] J2 Runtime payload registry load + normalize
- [x] J3 Optional payload lookup + pose resolution bridge
- [x] J4 Shared renderer designer-payload draw path
- [x] J5 Gallery/debug sample wiring
- [x] J6 Docs + validation + finalization
