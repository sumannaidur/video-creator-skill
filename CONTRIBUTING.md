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

The self-contained tests live in `skills/video-creator/scripts/tests/`; see their `README.md`. Run the suites that cover your change, for example:

```bash
python skills/video-creator/scripts/tests/test_plan.py
node skills/video-creator/scripts/tests/test-prerender.mjs
```

- Some suites need Chromium, FFmpeg or a local narration runtime. Say in your pull request which suites you ran and which you couldn't run.
- There is no CI yet.

## Pull requests

- One focused change per pull request, with a clear description and the test evidence.
- Update the documentation and the release notes (`skills/video-creator/RELEASE-NOTES.md`) when behaviour changes.
- Be respectful. This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
