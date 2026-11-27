# Projects and the stage ledger

`scripts/project.py` creates video projects **outside** the Skill package and tracks the production stages from `SKILL.md`. The ledger records facts: fingerprints, artifacts, hashes, evidence, states and approvals. It never records or makes creative decisions, and it doesn't depend on language, provider, style or backend.

## Commands

```
python scripts/project.py init --root <projects folder> (--topic "<text>" | --topic-file <file>) \
       --config <resolve.json> [--capabilities <doctor-or-resolve.json>] [--id <id>]
python scripts/project.py show <project>
python scripts/project.py next <project>
python scripts/project.py start <project> <stage> [--input <file> ...]
python scripts/project.py complete <project> <stage> --output <artifact> [...] --evidence <evidence.json>
python scripts/project.py fail  <project> <stage> --reason "<text>" [--evidence <file>]
python scripts/project.py block <project> <stage> --reason "<text>"
python scripts/project.py reconfigure <project> --config <resolve.json> [--capabilities <json>]
python scripts/project.py verify <project>
python scripts/project.py approve <project> human-review|publication --by "<name>" [--notes "<text>"] [--reject]
```

- **`--config`:** the JSON written by `preferences.py resolve --json`. It holds the effective values and where each came from.
- **Exit codes:** `0` ok, `1` refused or invalid, `2` usage.

## Manifest (`project.json`, schema `video-creator.project`, version 1)

- **Identity:** a unique `id` (`vc-<date>-<random>`), creation time, and the original topic (`inputs/topic.txt` plus its hash).
- **Configuration:** `config.effective`, `config.source` and the config file's hash. `capabilities` holds the doctor or resolver report.
- **Stages:** `stages.<name>` records:
  - `state`, `depends_on`, `inputs_fingerprint`.
  - `outputs` (project-relative path, SHA-256, bytes), and `validation` (evidence path and hash).
  - `attempts`, `started`, `finished`, `failure` (reason and evidence), `invalidated` (reason).
- **Approvals and history:** `approvals.human_review` and `approvals.publication`, plus an append-only `history`.

## Stages and dependencies

| Stage | Depends on | Configuration it depends on |
|---|---|---|
| research | — | locale, cost_policy |
| script | research | locale, duration_seconds, narration.tone, narration.accent |
| narration | script | locale, narration.*, duration_seconds |
| creative-plan | script, narration | style, orientation, duration_seconds |
| visual-production | creative-plan, narration | style, orientation, resolution, fps, captions.* |
| sound | narration, visual-production | music.*, sfx.* |
| review-delivery | visual-production, sound | review_mode, captions.*, output_dir |

The review-delivery stage is completed (or failed) by `qa.py report --complete`; see [quality review](quality-review.md).

## Rules

**States:** a stage is `pending`, `running`, `completed`, `failed`, `blocked` or `invalidated`.
- `start` refuses a stage whose dependencies aren't all completed.
- `start` also refuses an already completed stage, so verified work is never repeated.

**Completion:** a stage is `completed` only when all of these hold:
- At least one output artifact exists inside the project.
- An evidence JSON records a pass (`passed: true`, `failures: []` or `ready: true`).
- The stage's inputs haven't changed since it started.

**Inputs fingerprint:** the hash of the topic, the stage's own configuration keys, and the verified outputs of the stages it depends on. Changing a voice therefore invalidates narration onward, but not research or script.

**Reconciliation** runs on every command. It invalidates a completed stage, and everything downstream of it, when any of these happen:
- An artifact goes missing or its hash changes.
- An upstream stage stops being completed.
- The stage's fingerprint no longer matches.

The artifacts themselves are never deleted. `next` resumes at the earliest unfinished stage and lists the verified stages it reuses. A `running` stage is reported as resumable, since the ledger can't tell interrupted work from work in progress.

**Approvals are separate from technical completion:**
- `approve human-review` requires every stage to be technically completed.
- `approve publication` requires an approved human review.
- Any later invalidation revokes both approvals.

**Safety:**
- Every write is atomic: a temporary file, then a replace.
- A per-project `project.lock` holding the owner's process ID refuses a second writer. A stale lock is recovered.
- Paths must stay inside the project, and projects must stay outside the package.
- An unsupported or corrupt manifest is refused and left untouched.
