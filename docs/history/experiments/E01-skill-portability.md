# E01 — Skill portability evidence

Updated 2026-11-25. E01 is **partially validated, not passed**. The accepted architecture in ADR-001 does not establish runtime compatibility. No video production was attempted.

## Distinct evidence gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Official standard research | Complete for P002 scope | [Standard research](../../research/agent-skill-standard.md) cites official specification and host sources; research dated 2026-11-24 |
| Static Skill validation | Manual structural pass; official validator blocked | `experiments/E01/portability-probe/SKILL.md` has matching lowercase directory/name, required nonempty description, YAML fences, Markdown body, and existing relative reference. `quick_validate.py` could not import `yaml` because PyYAML is absent; no dependency installed. |
| Skill discovery | Observed in Codex CLI 0.171.0 | Original [invocation log](E01-codex-invocation.jsonl) and retry sanitized log (`E01-retry-sanitized.log`, local only, never committed): agent identified the explicitly invoked probe |
| Skill activation | Observed only to instruction-following level | Agent attempted reference access after `$portability-probe` invocation; no successful tool work follows |
| Supporting reference access | **Blocked** | Original run: app runtime provisioning service unavailable for both shell and Node. Final retry: shell reads rejected as blocked by policy. The fresh marker was not read through the Skill. |
| Artifact creation | **Blocked** | Fresh retry output absent before and after invocation; no artifact was produced |
| Independent artifact verification | **Failed because artifact absent** | Post-run `Test-Path` returned false. Exact marker equality and creation time cannot be verified. |

## Basic environment checks, separate from Skill invocation

In this Codex desktop chat, an isolated temporary text file was written and read successfully; a relative path resolved to the same file; `cmd.exe /c echo terminal-ok` returned `terminal-ok`; the repository probe directory was accessible; installed `codex.cmd --version` reported `codex-cli 0.171.0`. These establish capabilities of **this chat's** execution surface only. They do not prove the child Codex CLI's sandbox capabilities or Skill execution.

## Runtime diagnosis and bounded retry

The original CLI run identified the probe, then its shell process failed with `app runtime provisioning service is unavailable; refusing helper fallback`; the Node REPL kernel reported the same provisioning failure. The original log also contains an unrelated MCP OAuth startup warning and an analytics HTTP 400 event-schema warning. Neither warning is shown to cause the shell/Node provisioning failure. The exact underlying service cause is unknown.

For P002.1, the probe was copied into an isolated temporary workspace at `.agents/skills/portability-probe/`. A cryptographically random 32-character hex marker was generated and stored only in its supporting reference before invocation; the invocation prompt did not contain it. The output was confirmed absent. The first retry rejected a temporary `SKILL.md` with a UTF-8 BOM as missing YAML frontmatter. After writing it without a BOM and generating a **new** marker, a final `codex exec -C <isolated-workspace> --skip-git-repo-check --ephemeral --ignore-user-config -s workspace-write --json '$portability-probe ...'` invocation recognized the Skill but rejected PowerShell and Command Prompt reads as `blocked by policy`. No marker or artifact was returned. The sanitized final log (`E01-retry-sanitized.log`, local only) retains the relevant events; raw retry logs and the test marker remain only in the temporary workspace. No security setting or global configuration was changed. Further retries in this CLI environment stopped.

The final retry's policy rejection is observable; whether it stems from sandbox policy, project trust, CLI/app interaction, or another configuration layer is unresolved. The original provisioning error did not recur in the final log, so a temporary service failure is possible but unproven. The fresh reference path was never successfully read, so path resolution through the Skill remains unverified. The CLI process exit code was 0 for the final turn despite the task's failed outcome; process exit alone is not a test pass.

## P003 gate

P003 hardware assessment **can begin after owner review** using this chat's independently verified local file and terminal capabilities, while the Codex CLI Skill-runtime issue is tracked separately. E01 cannot be declared passed, and production through the Skill remains blocked until a supported host completes reference read, artifact write, and independent exact-marker verification. E02/P003 was not started here.
