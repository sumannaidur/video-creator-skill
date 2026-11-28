# Release process (P026.3)

## Build (deterministic)

```bash
python tools/build_release.py --source skills/video-creator --date <YYYY-MM-DD> --out release
```

- **Output:** writes `release/video-creator-v<version>.zip` and its `.sha256`. The version is taken from SKILL.md `metadata.version`.
- **Deterministic:** the archive depends only on file content. Entries use a canonical order, fixed timestamps (`--date`) and fixed permissions; text line endings are normalised to LF; caches and test results are excluded.
- **Safe:** existing archives are never overwritten.
- **Line endings:** `.gitattributes` stores and checks out text as LF on every platform.

## Verify or reproduce

```bash
git archive v<version> skills/video-creator | tar -x -C <staging>
python tools/build_release.py --source <staging>/skills/video-creator --date <release date> --check release/video-creator-v<version>.zip
```

**Verified in P026.3:** two clean staging directories built the identical archive (SHA-256 `2375b359…`), even though one had CRLF on all 152 text files and the other had LF with scrambled timestamps. Line endings and timestamps no longer affect the build.

## Historical archives (v0.1.0-beta, v0.2.0-beta)

**The published archives can't be byte-reproduced from their tags.** They were built from a Windows working tree under `core.autocrlf=true` before `.gitattributes` existed, so they contain **mixed** line endings:

| Archive | CRLF members |
|---|---|
| v0.2.0-beta | 39 of 152 |
| v0.1.0-beta | 19 of 142 |

Their **content is identical to the tagged sources once line endings are normalised**: P026 found 0 differing members for v0.2.0-beta. Their published checksums remain valid for download integrity. Releases built from now on are reproducible.

## Checklist

1. Update `metadata.version` in SKILL.md and the release notes.
2. Run the focused tests that cover your changes; see `skills/video-creator/scripts/tests/README.md`.
3. Build, then run `--check` from a fresh `git archive` staging folder.
4. Tag (annotated), push, and attach the zip and `.sha256` to the GitHub release. All of this needs owner authorisation.
