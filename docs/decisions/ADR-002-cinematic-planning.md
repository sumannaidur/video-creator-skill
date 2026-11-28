# ADR-002: Cinematic planning before rendering

Status: proposed implementation on dev; local validation pending.

Context: v0.2.1-beta has sample-exact speech anchors and nine style engines, but the owner rejected the long-form artistic result. The current plan validates shot timing, not production intent.

Decision: extend v1 with optional cinematic opt-in and per-shot direction metadata. New productions opt in; legacy plans remain accepted. Keep seven ledger stages, existing asset IDs and speech anchors. Review the complete sequence before costly export.

Alternatives: a separate storyboard schema would duplicate timing and IDs; replacing renderers would cost development effort without proving artistic improvement. Detailed SVG, layered raster and selective existing Blender layers are candidate techniques, not new dependencies.

Cost and licensing: stdlib-only validation; no additional software or assets. Existing provenance and human gates remain. Direction does not implement mixed styles, new cameras, rigs or sound tracks.

Evidence: source inspection of plan.py and production references; focused synthetic timeline tests added. Actual tests and artistic improvement must be independently verified before acceptance.
