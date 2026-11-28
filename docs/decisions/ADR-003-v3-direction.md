# ADR-003: V3 creative intelligence on existing local tools

Status: owner-approved direction; implementation and artistic validation pending.

Context: v0.2.1-beta and P028 cinematic planning established technical primitives but did not demonstrate publication quality. The owner explicitly chose original procedural construction, reusable editable source, continuous learning, 8 GB target and minimal media retention. E43.1 tested optional local image generation; success does not establish controllability or low-resource suitability.

Decision: use existing SVG/JS, Chromium, WebGL, Python, narration and procedural audio/FFmpeg. Improve the agent's creative reasoning and world design first, then extract reviewed versioned assets and contextual lessons. No Blender or OpenVINO in the V3 production path; preserve prior research and stable compatibility. No mandatory new software, models or paid APIs. Shared data is outside host installs; core changes require approval. User-authorized original media may be used with rights evidence.

Alternatives: external image/video generation, Blender-heavy workflow, fixed templates and large prebuilt asset packs. Rejected for current scope because they add resource/dependency costs or undermine originality and editable reuse. No claim that procedural work matches photorealistic generation.

Consequences: agent effort and stylized art direction matter; alternate views and interactions must be constructed; realistic sound and voice availability have limits. Validate actual output and 8 GB operation before claiming support. Executable generated code must respect existing security boundaries. Existing licences and rights gates remain; no new licence or dependency commitment.

Evidence: owner-approved 42 decisions, [P028.2 benchmark](P028.2-visual-benchmark.md), [E43.1 experiment](E43.1-openvino-feasibility.md). See [V3 requirements](../v3/requirements.md), [architecture](../v3/architecture.md), [roadmap](../v3/roadmap.md), [acceptance](../v3/acceptance.md).
