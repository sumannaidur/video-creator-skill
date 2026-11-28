# Contributing

Thank you for helping improve Video Creator. It is a beta; please keep changes small and well evidenced.

## Licence of contributions

The project is licensed under the [Apache License 2.0](LICENSE). Under its section 5, any contribution you intentionally submit is licensed under the same terms, unless you state otherwise.

Only submit work you have the right to license. Don't add third-party code, models, fonts, artwork, audio or text unless:
- its licence is compatible;
- its provenance is recorded;
- the change is discussed first.

Update [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), and its copy in `skills/video-creator/`, whenever third-party material changes.

## Before you start

- **Read [`AGENTS.md`](AGENTS.md).** It contains the engineering rules shared by human and AI contributors: small atomic tasks, evidence over claims, honest quality gates, and no new dependencies without discussion.
- **Open an issue for anything non-trivial.** Describe the problem, the evidence and the smallest proposed change.
- **Security problems:** use [`SECURITY.md`](SECURITY.md), not a public issue.

## Making changes

- The installable Skill is `skills/video-creator/`. Keep it self-contained: no references to `experiments/` or machine-specific paths.
- Follow the existing patterns:
  - explicit error codes;
  - nothing substituted silently (language, voice, style);
  - no downloads in packaged tools;
  - documentation that matches what is implemented.
- **Never commit** secrets, credentials, runtime files, model files, generated media or downloaded assets. Check `.gitignore`.
- Don't claim artistic quality, native-language quality or publication readiness. Those stay human review gates.

## Testing

Run the unified runner (see `skills/video-creator/scripts/tests/README.md`):

```bash
python skills/video-creator/scripts/tests/run_all.py
python tools/check_repository.py
```

- Some suites need Chromium, FFmpeg or a local narration runtime; the runner reports those as skipped, never passed. Say in your pull request which suites you ran and which were skipped.
- **CI** (`.github/workflows/ci.yml`) runs on every push to `main` and every pull request:
  - repository checks;
  - deterministic packaging;
  - the core, Node, browser and FFmpeg suites, both from the source tree and from an extracted release package.

  Narration runtime suites can't run in CI (no models).

## Pull requests

- One focused change per pull request, with a clear description and the test evidence.
- Update the documentation and the release notes (`skills/video-creator/RELEASE-NOTES.md`) when behaviour changes.
- Be respectful. This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
