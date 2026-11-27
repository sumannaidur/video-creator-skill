# Agent Skills standard research

Researched **2026-11-24**. Facts below are from official sources; host behavior remains untested except where the E01 log says otherwise. No specification version number was published on the cited specification page at inspection time.

## Common format

The [Agent Skills specification](https://agentskills.io/specification) requires a directory containing `SKILL.md`. That file has YAML frontmatter followed by Markdown instructions. Required fields are `name` (1–64 lowercase ASCII letters, digits, hyphens; no leading/trailing or consecutive hyphens; matches directory name) and nonempty `description` (up to 1,024 characters; describes purpose and trigger). Optional standard fields include `license`, `compatibility`, string-valued `metadata`, and experimental `allowed-tools`. `scripts/`, `references/`, and `assets/` are optional; other files are allowed. Refer to supporting files by paths relative to the Skill directory; absolute installation paths cannot travel with the package. The agent first receives name/description, loads the body when selected, and reads supporting files as needed ([specification](https://agentskills.io/specification), [OpenAI build skills](https://learn.chatgpt.com/docs/build-skills), [Claude Code skills](https://code.claude.com/docs/en/skills)).

The specification defines **format**, not a universal launcher, command syntax, sandbox, local filesystem, terminal, network, model installation, persistence, background process, or artifact-delivery API. Those belong to the host. Experimental `allowed-tools` is not a portable permission grant. This distinction is an inference from the specification's scope and the different host documentation, not a runtime test.

## Host discovery and packaging facts

| Host | Officially documented discovery / invocation / distribution |
| --- | --- |
| Codex CLI, IDE, desktop | Repository `.agents/skills/<name>`, user `~/.agents/skills/<name>` and other scoped locations; metadata matching or `$name` (CLI/IDE), skill picker; standalone local skills or plugin distribution ([OpenAI](https://learn.chatgpt.com/docs/build-skills)). |
| Claude Code | Project `.claude/skills/<name>`, user `~/.claude/skills/<name>`, managed/plugin paths; automatic matching or `/name` ([Anthropic](https://code.claude.com/docs/en/skills)). |
| Claude.ai | Enable code execution and Skills; upload a ZIP of the Skill folder; automatic use when relevant; organization provisioning may apply ([Anthropic](https://support.claude.com/en/articles/12512180-use-skills-in-claude)). |
| Claude Cowork | Skills may be shared with chat; execution location and local access differ by desktop/cloud mode ([Anthropic skills](https://support.claude.com/en/articles/12512180-use-skills-in-claude), [Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork)). |
| Google Antigravity | Google describes `SKILL.md` plus optional scripts/references/assets and on-demand activation; its codelab shows project skill locations. Runtime constraints need a device test ([Google codelab](https://codelabs.developers.google.com/getting-started-with-antigravity-skills)). |
| ChatGPT skill-capable surfaces | Standalone skills are documented for desktop; plugin-bundled skills can appear in Chat and Work across web, desktop, mobile. Hosted execution does not imply access to a user's computer ([OpenAI](https://learn.chatgpt.com/docs/build-skills), [OpenAI API Skills](https://developers.openai.com/api/docs/guides/tools-skills)). |

## Execution boundaries

OpenAI documents local and hosted shell as separate execution modes for API Skills; hosted containers and uploaded bundles do not prove access to local models or files ([OpenAI API Skills](https://developers.openai.com/api/docs/guides/tools-skills)). Claude Code's tool and Skill use are governed by permission rules, with cloud sessions on different machines ([Claude Code skills](https://code.claude.com/docs/en/skills), [settings](https://code.claude.com/docs/en/settings)). Claude.ai requires code execution enabled for Skills. Google describes executable scripts in its local Antigravity codelab, but no media-specific guarantees. None of these sources establishes that Python, Node, FFmpeg, model downloads, long processes, or HD rendering are available on every target surface.

## Research status

Official sources inspected: [specification](https://agentskills.io/specification), [source repository](https://github.com/agentskills/agentskills), [OpenAI build skills](https://learn.chatgpt.com/docs/build-skills), [OpenAI API Skills](https://developers.openai.com/api/docs/guides/tools-skills), [Claude Code skills](https://code.claude.com/docs/en/skills), [Claude.ai Skills](https://support.claude.com/en/articles/12512180-use-skills-in-claude), [Claude Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork), and [Google Antigravity codelab](https://codelabs.developers.google.com/getting-started-with-antigravity-skills). Current URLs were accessible on the research date. Product versions and many execution limits were not stated consistently; mark those unknown rather than infer support.
