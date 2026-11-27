# P015.2A Mithi provider integration evidence (2026-11-26)

## Runtime

- **WSL2 environment:** `Ubuntu-24.04`, reused unchanged: Python 3.12.3, torch 2.9.1+cpu, soundfile 0.14.0.
- **Model folder:** `D:/video-creator-skill-experiments/E03/mithi/models`, at the pinned revision `1fc0dd68496a2483508ec764d310146c41ff90be`. All 10 files were SHA-256-verified by the provider before each run.
- Nothing was downloaded or installed. The runtime configuration is `setup/mithi-runtime.json`.

## Sample for human listening

- **File:** `project/narration/te-IN-ahana-sample.wav`. The text, written by the agent and needing native review, is in `project/inputs/te-sample.txt`.
- **Format:** PCM16 mono at 24 kHz; 240,600 samples (10.025 s). It decodes cleanly in FFmpeg.
- **Levels:** peak −10.9 dBFS (peak sample 9360), mean −25.8 dB, 0 full-scale samples.
- **Speed:** model load 7.07 s, synthesis 7.69 s (real-time factor 0.767).
- **Memory:** peak RSS 1,283.5 MiB. Guest RAM available was 7.03 GiB before and 6.02 GiB after.
- **Provenance:** recorded in `te-IN-ahana-sample.raw-duration.json`.
- **Repeat run:** `te-IN-ahana-repeat.wav` is byte-identical audio with identical durations (seed 0). Its synthesis took 8.66 s (real-time factor 0.864), with peak RSS 1,283.7 MiB.

## Timing finding

The pinned `run.py` decides an integer duration for every decoded phoneme token. It builds a hard monotonic alignment from those durations, so they are the model's own timing for the generated audio, not an estimate.

- **Sample-exact edges:** in the sample, the 175 durations sum to 401 units, and 401 × 600 = 240,600 samples, exactly the length of the WAV.
- **Breath tokens:** the writer can insert breath tokens. The provider maps each one back to its encoder token, and none occurred here.
- **Word split:** the model's own word split (`words_of`) and its token-to-word map (`token_words`) gave 19 words and 19 token groups. Those words are identical to the 19 whitespace words of the input text.

The timeline records these durations as `native_model` phoneme records. Word and phrase records stay `null`.

## Smallest remaining step to Telugu video production

Map words from `token_words` and the recorded durations, so each word spans its tokens' sample range.
- Accept a mapping only when the model's word split matches the text words.
- Decide how to attribute the space token between words.
- Run a native-speaker spot check of word boundaries.
- Mark the provider `word_timing: true` only after that validation.

This is a mapping of data that already exists, not a new aligner.

## Package immutability

`package-before-synthesis.json` and `package-after-synthesis.json` are SHA-256 snapshots taken around two synthesis runs. They are identical, and the package contains no `__pycache__` folder.
