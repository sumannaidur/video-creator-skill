# Shared source assets (P032.1)

The experimental registry stores original editable JS source and compact metadata outside the installed Skill. It does not execute, import, render, or approve code. Existing projects retain their own source; automatic reuse and renderer integration are later work.

Default location: the same per-user configuration base as preferences, under video-creator/source-assets. Both native hosts can use it, or set VC_ASSETS to the same external directory. Use an explicit shared path when hosts have different environment roots. Do not use an installed Skill directory or repository.

Metadata example:

```json
{"id":"object.wheel","version":"1.0.0","category":"object","description":"Wooden wheel construction","tags":["mill"],"capabilities":["rotate"],"parameters":["radius"],"dependencies":[],"origin":"original"}
```

Source must be UTF-8 JS or MJS, at most 256 KiB. No external media or generated raster/audio/video artifacts. Embedded common media data URIs are rejected; this is not a comprehensive code or rights audit. Dependencies pin id, version and record sha256; add dependencies first. Source is stored verbatim as a JSON string and retrieved as editable JS text. Keep project-local source until the project is validated.

```
python scripts/asset_registry.py add metadata.json wheel.js
python scripts/asset_registry.py search "wheel rotate" --include-candidates
python scripts/asset_registry.py show object.wheel 1.0.0
python scripts/asset_registry.py promote object.wheel 1.0.0 --reviewer owner --evidence "Actual review reference and limitations" --confirm-reviewed
python scripts/asset_registry.py search wheel
python scripts/asset_registry.py source object.wheel 1.0.0 --sha256 <record-sha256>
```

Search defaults to reviewed assets; candidate search is explicit. Promote only after actual appropriate review and rights/code checks, record evidence and reviewer honestly. The command records the caller's assertion, not authenticated approval or automated verification. Candidate dependencies prevent promotion. New versions never overwrite existing records, and pinned hashes must be checked before reuse. No automatic promotion of existing benchmarks.

Records and review attestations are separate immutable JSON files. Cooperative writes use an exclusive lock and same-directory atomic replacement; interrupted writes can leave a lock or temporary file. Verify no process is active before manually removing stale lock/temporary files. Do not edit registry records directly. This is a trusted single-user local directory, not a security sandbox or tamper-proof store. Search scans bounded records locally and returns limited metadata, not all source; an index is deferred until measured need. No automatic cleanup or deletion in this slice.

Before using source, inspect it as executable code, verify the pinned record and dependencies, check compatibility and rights, and preserve the exact project source. Do not treat review status as production or publication acceptance.
