# Narration and timing

The front end, `scripts/narration/narrate.py`, is provider-independent and runs on system Python. Each **provider** synthesizes one segment and returns its own timing. Providers are listed in `scripts/narration/providers/registry.json` with their locales, voices, timing method and status.

## Narration stage (script → narration, recorded in the project ledger)

```
python scripts/narration/stage.py validate <project> [--script script/script.json]
python scripts/narration/stage.py run <project> --runtime <provider>=<runtime.json> [--script script/script.json]
       [--tolerance 0.10] [--max-attempts 3] [--gap-ms 200] [--accept-deviation "<reason>"]
```

**Script artifact** (`video-creator.script` v1, the output of the ledger's `script` stage):

```json
{"schema": "video-creator.script", "version": 1, "locale": "hi-IN",
 "segments": [{"id": "s1", "role": "hook", "text": "...", "claims": ["c1"]}]}
```

- **Segments:** IDs are stable and unique. `role` is one of hook, context, mechanism, contrast, example, transition or resolution. `claims` must exist in the research stage's claims file.
- **Provider limits:** segment-length limits come from the chosen provider's registry entry (`segment_limits`, for example Kokoro's 300 characters per segment). They are not universal rules.

**What `run` does:**

1. **Checks before synthesis.** It requires the script to be a verified output of the completed script stage. Locale, provider, voice and target duration come from the project configuration; `auto` provider or voice fails with `decision-required`, so the agent chooses one and reconfigures. The script is validated.
2. **Builds the narration.** Each segment is synthesized through the provider interface. Segments are named `<id>-<content hash>`, so unchanged, still-valid segments are reused. A corrupted segment is moved aside as `*.corrupt-<time>` (never deleted) and synthesized again. The segments are then combined.
3. **Measures and records.** It measures the duration against `duration_seconds`, writes `narration/narration-evidence.json` and `duration-history.json`, and updates the ledger: `complete` when in tolerance with every word mapped, otherwise `fail` with a reason.
4. **Off target.** The stage fails with `revision_hints` naming the segments to shorten or expand. The agent revises the script and re-completes the script stage. Voice speed is never changed. After `--max-attempts` the reason becomes `unresolved-duration-deviation`; only an explicit `--accept-deviation "<reason>"` completes the stage anyway, and that is recorded.
5. **Single runner.** `narration/.runner.lock` records the runner and its active synthesis process. A resume refuses (`synthesis-active`) while either is alive, and a stale lock is recovered.

Changing `duration_seconds` invalidates the script stage as well as narration, because scripts are written to a duration. Re-confirm the script, then run again.

## Commands

```
python scripts/narration/narrate.py providers
python scripts/narration/narrate.py synth --project <dir> --provider <name> --locale <bcp47> --voice <id> \
    --runtime <runtime.json> --text-file <utf8.txt> --id <segment> --out-dir narration/segments
python scripts/narration/narrate.py combine --project <dir> --id <name> --gap-ms 200 \
    --out-wav narration/narration.wav --out-timeline narration/narration.timeline.json A=narration/segments/A.timeline.json ...
python scripts/narration/narrate.py validate --project <dir> <timeline.json> ...
```

- **Runtime JSON:** lives **outside** the Skill package: `{"python": "<provider environment interpreter>", "model": "<path>", "voices": "<path>"}`.
  - **Discovery (P026.3):** `--runtime <provider>=<file>` wins. Otherwise `doctor.py` and `stage.py` check exactly one file, `<runtime dir>/<provider>.json`, where the runtime directory is `$VC_RUNTIMES` or `<APPDATA | XDG_CONFIG_HOME | ~/.config>/video-creator/runtimes`. Nothing is scanned.
  - A missing file is reported with the exact path expected.
  - Paths inside the package are rejected, and nothing is downloaded.
  - Tested versions are in [tested configurations](tested-configurations.md).
- **Explicit failures:** `unsupported-provider`, `provider-not-packaged`, `unsupported-locale`, `unsupported-voice`, `script-mismatch`, `invalid-text`, `missing-runtime` or `provider-failed`. Nothing falls back to another provider, voice or language.
- **Text:** UTF-8, read with whitespace collapsed and otherwise unchanged. No Unicode normalization, so the author's exact characters and pronunciation boundaries are kept.
- **No overwriting:** an existing segment WAV is never overwritten. Timings always belong to the exact WAV that the same run produced.

## Provider contract

**Input** (one segment): text, locale, voice, segment ID, project-relative output folder, runtime paths.

**Output**, all inside the project:
- `<id>.wav`: mono PCM16.
- `<id>.timeline.json`: version 1, `unit: sample`.

The timeline has the following fields; `scripts/narration/timeline.py` enforces them.
- `run_id`, and `validation: unreviewed`.
- `timing: {method, provider}`. The method is, for example, `native_durations` or `forced_alignment`.
- `audio: {path, sha256, sample_rate, sample_count}`.
- `text: {display, speech}`.
- **Word** and **phrase** records, each with integer sample `start` and `end`, a `source` and a Unicode `text_ref`. A word that can't be mapped keeps `start`/`end` set to `null` with `source: null`. Never estimate it silently.
- Optional `pause` records.

**Provider-specific evidence** goes in sidecar files and is **not** part of the contract. Kokoro, for example, writes phoneme durations (`<id>.raw-duration.json`, `<id>.native.timeline.json`) and mapping diagnostics (`<id>.mapping.json`). Other providers never have to produce Kokoro's phoneme or duration formats.

**Downstream tools** consume only the contract fields: the segment combiner, the renderer and the caption tools. Combining keeps each segment's ID, run ID, source hashes and review status, and offsets every record by whole samples.

## Providers

| Provider | Locales | Timing | Status |
|---|---|---|---|
| `kokoro-onnx` (`hf_alpha`) | hi-IN | Native phoneme durations from the same inference call, mapped to words and phrases with full-context eSpeak separators | Experimentally validated. Timings are model-predicted, **not** acoustically verified. Native listening and human timing review pending |
| `mithi` (te-IN `ahana`, kn-IN `vaidehi`, ta-IN `malini`, en-IN `anirban`, hi-IN `charvi`) | te-IN, kn-IN, ta-IN, en-IN, hi-IN | Native token durations from the same inference (exact sample edges; 600 samples per duration unit at 24 kHz), mapped to words through the model's own token-to-word ownership, then joined into phrases (`providers/mithi_mapping.py`) | Synthesis and word/phrase timing technically validated per locale (te-IN P015.2B; kn-IN, ta-IN, en-IN and hi-IN on one sample each in P016). English apostrophe contractions use group reconciliation (see [en-IN](locales/en-IN.md)). Timings are model-predicted, **not** acoustically verified. Native listening and word-boundary review pending |

### Provider runtimes

The runtime JSON lives outside the package. Its `kind` must match the registry entry's `runtime`, or the request fails with `invalid-runtime`:

- **Kokoro (`python-environment`):** `{"python": <interpreter>, "model": <file>, "voices": <file>}`.
- **Mithi (`wsl-python-environment`):** `{"kind": "wsl", "distro": "Ubuntu-24.04", "python": <Linux interpreter inside the distribution>, "model": <Windows path to the pinned model folder>}`.

Mithi runs on CPU inside WSL2 because Windows Application Control blocks a native dependency on this host (see `docs/history/experiments/E03-P005.2-mithi.md` in the source repository; not part of the installed package).
- The model folder is hash-checked against `providers/mithi-v2-flash.manifest.json` before every synthesis.
- Synthesis is refused below 1 GiB of available memory.
- Text must fit in one model piece (at most 400 phonemes); longer text is rejected rather than split.
- The provider writes `<id>.raw-duration.json` with the model revision and file hashes, voice, seed, runtime versions, phonemes, token IDs, durations, the model's own word split, load and synthesis seconds, peak RSS, peak sample and full-scale sample count.
- With the pinned seed, synthesis is deterministic: a repeated run gave identical audio and durations.
- **Word timing policy:**
  - A word spans its first to last phoneme token.
  - Space, punctuation, breath and BOS/EOS tokens are never word time; they become `pause` records.
  - A text word must equal one or more consecutive model words, compared on letters, marks and digits only. A hyphenated word may span several model words.
  - Any mismatch is rejected (codes such as `word-mismatch`, `non-contiguous-word`, `orphan-phoneme`, `duration-sample-mismatch`), and the reason goes to `<id>.mapping.json`. The words then stay `null`, so the narration stage refuses the segment. Nothing is estimated.

## Adding a locale or provider

1. Add a registry entry declaring the locales, voices, script ranges, timing method and status.
2. Add an implementation that reads the JSON request on stdin and writes the contract outputs.
3. Add a locale reference file covering writing, pronunciation, alignment, typography and captions.

Don't edit the workflow or the downstream tools. Record a provider's status as experimental until listening and timing evidence exist.
