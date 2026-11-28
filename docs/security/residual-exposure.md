# Residual historical exposure (P026.2)

**Date:** 2026-11-27.

## Corrected in the current tree

33 tracked files in `experiments/` and `docs/` contained:
- the Windows account name, inside home and temporary paths;
- the repository's absolute drive path.

283 occurrences were replaced with placeholders, `<user>` and `<repo>`, keeping each file's separator style and encoding (two PowerShell-written JSON files keep their UTF-8 BOM). JSON validity was re-checked.
- No hostnames, secrets or other identifiers were found.
- No tracked images needed changes: they are render sheets, not screenshots.

## Still present in Git history (not rewritten, by owner instruction)

- **Commit `d97ad8e`** (v0.1.0-beta) introduced those paths. Later commits (`9bc33f0`, `56bcb1f`, `f097174`) carry the same unchanged files, until the sanitizing commit.
- **Tags `v0.1.0-beta` and `v0.2.0-beta`** point to trees that still contain them.
- **The released archives do not.** The Skill package never contained machine paths, as verified by the P025.2 scan.
- **Commit author metadata** of all commits includes a personal email address. That is public GitHub metadata and can't be changed without rewriting history.

**Exposure level:** low. A local username and folder layout only; no credentials or tokens (P026 scans of all history found none).

**To remove it entirely:** this would need a history rewrite (for example `git filter-repo`), a force-push, re-created tags and releases, and contributors re-cloning. That is an owner decision with release-integrity costs.

## Evidence binding affected

`experiments/E17/vc-20261126-c78767ec/project.json` records SHA-256 `0eec2057c26a14d43c72a1895869182bc70e523afdd16e22bd6e306481d53efd` for `render/fullhd/video-1080x1920-evidence.json`. That file was sanitized, so the recorded hash now refers to the original version. The original is preserved byte-for-byte in commit `d97ad8e`, and nothing in the package depends on it.
