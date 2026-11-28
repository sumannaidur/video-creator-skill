# Platform compatibility, 2026-11-24

Legend: **DS** documented supported in the cited host surface; **DR** documented restricted or conditional; **EV** experimentally verified in this workspace; **U** documented unsupported; **?** unknown or untested. DS is **not** a runtime compatibility claim. A cell can be `DS/EV` when both apply. Sources: [O: OpenAI Skills](https://learn.chatgpt.com/docs/build-skills), [OA: OpenAI API Skills](https://developers.openai.com/api/docs/guides/tools-skills), [C: Claude Code](https://code.claude.com/docs/en/skills), [CA: Claude.ai](https://support.claude.com/en/articles/12512180-use-skills-in-claude), [CW: Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork), [G: Google Antigravity](https://codelabs.developers.google.com/getting-started-with-antigravity-skills). See [E01 evidence](../history/experiments/E01-skill-portability.md) for the narrow local test.

| Capability | Codex local CLI | Codex desktop/IDE | Codex cloud | Claude Code local | Claude.ai | Cowork | Antigravity | ChatGPT skill-capable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Skill format / SKILL.md | DS O | DS O | DS O | DS C | DS CA | DS CA/CW | DS G | DS O |
| Discovery | DS/EV O | DS O | ? | DS C | DS CA | DS CA | DS G | DS O |
| Explicit invocation | DS/EV O | DS O | ? | DS C | ? | ? | ? | DS O |
| Automatic invocation | DS O | DS O | ? | DS C | DS CA | DS CA | DS G | DS O |
| Local user filesystem | DS O | DS/EV O | DR OA | DS C | DR CA | DR CW | DS G | DR O/OA |
| Terminal / subprocess | DS O | EV | ? | DS C | DR CA | DR CW | DS G | ? |
| Python execution | ? | ? | ? | ? | DR CA | ? | DS G | ? |
| Node.js execution | ? | ? | ? | ? | ? | ? | DS G | ? |
| External executable | DR | EV (Git) | ? | DR C | ? | ? | DR G | ? |
| Persistent files | DS O | EV | ? | DS C | DR CA | DR CW | DS G | DR |
| Network access | DR | EV (GitHub) | ? | DR C | DR CA | DR CW | ? | DR |
| Dependency installation | ? | ? | ? | DR C | ? | ? | ? | ? |
| Local model execution | ? | ? | ? | ? | ? | ? | ? | ? |
| Video rendering | ? | ? | ? | ? | ? | ? | ? | ? |
| Output artifact delivery | DS O | EV (local files) | ? | DS C | DS CA | DS CW | DS G | DS O |
| Permission restrictions | DR O | DR O | DR OA | DR C | DR CA | DR CW | DR G | DR O |
| Packaging | DS (folder) O | DS (folder/plugin) O | ? | DS (folder/plugin) C | DS (ZIP) CA | DS (shared skills) CW | DS (folder) G | DS (standalone/plugin by surface) O |

`DR` for local filesystem on remote surfaces means documented isolation or mode-dependent access, never direct access to this Windows workspace by default. `EV` on Codex CLI discovery means only that the isolated CLI identified the explicitly named probe; its original runtime failed before reading/writing, and its final P002.1 retry was blocked by policy. Thus CLI file execution is **not experimentally verified**. `EV` on Codex desktop refers only to this chat's filesystem/terminal tools and Git commands, not Skill auto-discovery. Python, Node, media tools, and local models are not verified by these checks. Host documentation gives general script capability, not a guarantee that a particular runtime or dependency is present. The matrix deliberately leaves many cells `?`.
