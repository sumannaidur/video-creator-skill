# P019 Native Agent Skill installation and validation (Claude Code)

**Date:** 2026-11-26.
**Host:** Claude Code 2.1.330. It runs inside the Claude desktop app (Code tab) on Windows 11 Pro. The CLI binary is at `%LOCALAPPDATA%\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\2.1.330\9424831ad51c\claude.exe` and is not on PATH.

**Status:** passed for Claude Code, with one blocker on the independent headless run.
- **Verified:** native discovery (by two host instances), native invocation (through the host's Skill tool), tool execution from the installed location, and a production checkpoint.
- **Blocked:** the independent headless `claude -p` run could not invoke the skill because that CLI is not signed in.

## Skill requirements check

| Requirement | Result |
|---|---|
| Layout | One folder named after the skill, with `SKILL.md` at its root |
| `name` | `video-creator`: lowercase, hyphens, 64 characters or fewer, matches the folder name |
| `description` | 339 characters, within the 1024 limit |
| Other frontmatter keys | `license`, `compatibility` and `metadata` are optional fields of the Agent Skills format |
| Body | 65 lines, using progressive disclosure: references are loaded per stage through relative links |

**Fix made:** the description still said "(Paper Explainer style)". It now says "(nine visual styles, framed or full-bleed)", so discovery describes the shipped capability.

The requirements were checked against the format the host accepted (see discovery below). The official validator script was not run; it needs PyYAML, which is not installed.

## Installation (personal skill; a copy, not a link, so it does not depend on the repository)

```powershell
python -I -c "import shutil, pathlib; shutil.copytree(r'D:\video-creator-skill\skills\video-creator', pathlib.Path.home() / '.claude/skills/video-creator', ignore=shutil.ignore_patterns('__pycache__', 'test-*results.json'))"
```

- **Result:** `%USERPROFILE%\.claude\skills\video-creator`, 141 files, 1.5 MB. It is identical to the repository package apart from the excluded caches and test results.
- **Updating:** delete that folder and run the copy again.
- **Project-level alternative** (not exercised): `.claude/skills/video-creator` inside a project.

## Evidence

1. **Discovery by a fresh headless host.** The command below ran in an empty folder (`%TEMP%\vc-p019\invoke`) with no repository:

   ```powershell
   & "$env:LOCALAPPDATA\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\2.1.330\9424831ad51c\claude.exe" -p "Make a short 20-second Telugu explainer video about why the sky is blue. ..." --output-format stream-json --verbose --max-turns 30 --allowedTools Skill Read Glob Grep Write Edit Bash
   ```

   Its `system/init` event listed `skills: [..., "video-creator", ...]`. The run then ended with "Not logged in · Please run /login", so no turn executed. **Blocker:** the owner must sign in that CLI with `claude /login` before an independent end-to-end headless run.

2. **Discovery and invocation in this desktop session.**
   - After installation, the host's skill list showed `video-creator` with the updated description.
   - The Skill tool was invoked with a plain topic request, without listing any stages: "Make a short 20-second Telugu explainer video about why the sky is blue …".
   - The host returned "Launching skill: video-creator" and injected the SKILL.md body with `Base directory for this skill: %USERPROFILE%\.claude\skills\video-creator`. That is the host's skill mechanism, not an ordinary file read.

3. **Reference loading.** The stage references resolve relative to the installed base directory; `references/research.md` was read from there. The host loads them on demand, so this step is the agent following the skill's links.

4. **Packaged tools from the installed location**, run with the working directory set to the installed skill and all outputs under `%TEMP%\vc-p019`:
   - `doctor.py --runtime kokoro-onnx=<json> --runtime mithi=<json>`:
     - all nine styles are available;
     - te, kn, ta and en-IN have Mithi routes available;
     - hi-IN has Kokoro and Mithi routes available.
   - `preferences.py resolve --check`: every combination of the five locales with `presentation=full-bleed` and `presentation=framed` returned 0, and `ready` was true. An unknown style (`claymation`) was refused with the list of valid styles.
   - **Lightweight production checkpoint**, following the injected skill instructions:
     - `doctor.py` for te-IN: READY;
     - `preferences.py resolve … --check`: ready, nine styles available for `auto`, `presentation=auto`;
     - `project.py init --capabilities …` created `%TEMP%\vc-p019\native\projects\vc-20261126-ba9ba91f`;
     - `project.py next` returned the research stage. Production stopped there, as the smoke test scope required.

5. **Nothing inside the package.**
   - The preference store defaults to `%APPDATA%\video-creator\preferences.json`; the test runs used an explicit store under `%TEMP%`, and nothing was saved.
   - The runtime configurations stay outside the package: `experiments/E17/setup/mithi-runtime.json` and a scratch `kokoro-runtime.json`.
   - The project, capability and config files were all written under `%TEMP%`.
   - The installed package is byte-identical to the source after the tool runs, and no `__pycache__` was written.

## Remaining portability limitations

- **Independent headless run:** blocked until the CLI is signed in.
- **Other hosts:** Codex, Antigravity and ChatGPT were not validated here, and no compatibility is claimed. E01 covers Codex discovery only.
- **Platform:** exercised only on Windows 11. Linux and macOS installs are untested, and so are the WSL-launched Mithi route from a Linux host and Chromium discovery there.
- **External requirements:** Node 22+, Python 3, FFmpeg/FFprobe, local Chromium, and the narration runtimes (Kokoro venv and models; Mithi in WSL2). The runtime JSON paths are machine-specific and must be supplied by the user.
- **Not checked:** the `quick_validate.py` structural validator (needs PyYAML) and plugin/marketplace packaging.
