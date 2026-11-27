# Security policy

## Supported versions

| Version | Supported |
|---|---|
| `main` and the latest beta (`v0.2.0-beta`) | Yes, with best-effort fixes |
| Older betas | No |

This is a beta, maintained on a best-effort basis. There is no response-time guarantee.

## Reporting a vulnerability

**Do not open a public issue for security problems.** Report privately through GitHub's **"Report a vulnerability"** button on this repository's **Security** tab (private vulnerability reporting). Include:

- the affected file, version or commit;
- steps to reproduce;
- the impact you expect.

**Never include real secrets, tokens or personal data.**

If that button isn't available, open a minimal public issue that asks for a private contact and contains **no** vulnerability details.

## Trust boundaries (read before running the Skill)

The Skill runs locally with your user permissions. Treat these as **executable code**:

- **Topic modules** (`visual/*.js`): JavaScript authored by the agent and run inside headless Chromium (sandbox enabled). Rendered pages are **not** currently blocked from network access. Review topics you didn't write yourself.
- **Blender scene scripts** (optional): Python run inside Blender by `scripts/blender_layers.py`.
- **Narration models:** the Mithi provider imports the model folder's own `run.py`. The whole folder is checked against the SHA-256 values in `scripts/narration/providers/mithi-v2-flash.manifest.json`, and a non-matching revision is refused.
- **Runtime files:** they name interpreters the tools will execute. Keep them outside the Skill folder, and only point them at environments you trust.

The packaged tools:
- download nothing;
- never run commands through a shell;
- refuse runtime paths inside the package;
- check asset hashes and licences for documentary media.

## Scope

**In scope:** the Skill package (`skills/video-creator/`) and the repository's own scripts and workflows.

**Out of scope:**
- vulnerabilities in third-party tools, models or packages (report those upstream; see `THIRD_PARTY_NOTICES.md`);
- issues that need an attacker to already control your topic files, runtime files or installed environments.
