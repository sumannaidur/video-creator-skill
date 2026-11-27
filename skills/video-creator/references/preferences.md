# Preferences and configuration

`scripts/preferences.py` stores the user's defaults **outside** the Skill package and resolves the effective configuration for each video. The store location is `--store <file>`, else `$VC_PREFERENCES`, else the per-user config folder (`%APPDATA%\video-creator\preferences.json`, or `$XDG_CONFIG_HOME` / `~/.config`).

## Commands

```
python scripts/preferences.py show
python scripts/preferences.py init  key=value ...          # first-use setup; refuses if a store exists
python scripts/preferences.py set   key=value ...          # partial update, validated, atomic
python scripts/preferences.py unset key ...                # back to the documented default
python scripts/preferences.py reset --confirm              # backs up the store, then clears it
python scripts/preferences.py resolve [key=value ...] [--check] [--runtime provider=<runtime.json>] [--json <file>]
```

- **Values:** a value is parsed as JSON when possible (`fps=25`, `music.enabled=false`, `locale=null`), otherwise as text.
- **Precedence:** **request** (`key=value` on `resolve`) > **saved** > **default**. Request values are never written to the store. `resolve` reports where each value came from.
- **Exit codes:** `0` ok, `1` invalid or unsupported (the store is never changed on failure), `2` usage.

## Configuration contract (schema `video-creator.preferences`, version 1)

| Key | Allowed values | Default |
|---|---|---|
| `locale` | a planned target locale: kn-IN, hi-IN, te-IN, ta-IN, en-IN | `null` (must be chosen) |
| `narration.provider` | `auto` or a registered provider | `auto` |
| `narration.voice` | `auto` or a voice ID | `auto` |
| `narration.accent`, `narration.tone` | free text, up to 64 characters | `null`, `conversational` |
| `style` | `auto` or a planned style ID (see `scripts/styles/registry.json`) | `auto` |
| `duration_seconds` | 10–600 | 60 |
| `orientation` | `vertical`, `horizontal` | `vertical` |
| `resolution` | short side in pixels: 540, 720, 1080 | 1080 |
| `fps` | 24, 25, 30, 60 | 30 |
| `captions.enabled`, `captions.burn_in` | true / false | true, true |
| `captions.subtitle_files` | subset of `["srt", "vtt"]` | `["srt", "vtt"]` |
| `music.enabled`, `music.level` | true / false; `subtle`, `moderate` | true, `subtle` |
| `sfx.enabled`, `sfx.density` | true / false; `sparse`, `moderate` | true, `sparse` |
| `review_mode` | `guided`, `checkpoint`, `autonomous` | `guided` |
| `output_dir` | a path outside the Skill package | `null` |
| `cost_policy` | `local-only`, `local-plus-free-network` (paid services are never an option) | `local-only` |
| `presentation` | `auto` (the topic decides; framed unless the topic authors full-bleed), `framed` (each style's stage and caption panel), `full-bleed` (artwork fills the frame, short word captions, optional hook; see [rendering](rendering.md#presentation-modes-topicpresentation)) | `auto` |

A style must list the chosen `presentation` in `scripts/styles/registry.json` (`presentations`). `resolve --check` reports `presentation-unsupported` otherwise, and the renderer refuses the same combination. All nine styles support both modes since P018.6.

There is deliberately no default language, provider, voice or style. Hindi, Kokoro and Paper Explainer are only the first implementations.

- **Unsupported versions:** a store with another schema or version, or invalid JSON, is refused and left untouched.
- **Atomic writes:** a temporary file in the same folder, then a replace.

## Preferences versus capabilities

The two checks are separate:

- **Preferences** are validated against the *planned* registries. Kannada or Whiteboard can be saved as preferences.
- **Capabilities** are checked with `resolve --check`, which runs `doctor.py` on the effective configuration.

An unavailable locale, style, provider or voice fails with its doctor code (`unsupported-locale`, `unsupported-style`, `unsupported-provider`, `unsupported-voice`, `narration-unavailable`), as does an unset language (`locale-unset`). Nothing is substituted.

`auto` values are **creative decisions left to the agent**, not capabilities. `resolve --check` lists the styles and narration routes actually available, so the agent can choose among them and record why.
