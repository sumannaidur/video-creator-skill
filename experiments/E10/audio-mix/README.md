# P013.5 audio mixing workflow (FFmpeg only)

- [`make_procedural_assets.py`](make_procedural_assets.py) synthesizes original music and SFX with FFmpeg lavfi. It writes `assets-manifest.json`, which records each asset's exact command, SHA-256 and license statement. No third-party samples are used.
- [`mix_audio.py`](mix_audio.py) mixes from a JSON spec. The spec format is documented in the file.
  - **Narration:** never altered, only mixed.
  - **Music:** optional, with gain, fades and sidechain ducking keyed by the narration.
  - **SFX:** optional, timestamped, with gain per effect.
  - **Loudness:** two-pass `loudnorm` (linear) to the target integrated LUFS, followed by a true-peak limiter.
  - **Provenance:** every music or SFX file must match a manifest entry with a license by SHA-256, or the mix is refused.
  - **Video:** optionally muxes the mix onto an existing MP4 with `-c:v copy`, so frames are not rendered or encoded again.
  - Writes `<output>.evidence.json`. Exits 1 if any check fails.

```powershell
python -I experiments/E10/audio-mix/make_procedural_assets.py experiments/E10/p013-flights/audio/assets
```
```powershell
python -I experiments/E10/audio-mix/mix_audio.py experiments/E10/p013-flights/audio/mix-spec.json
```

## Flight preview mix (P013.5)

- **Output:** [`flights-preview-540x960-mixed.mp4`](../p013-flights/audio/flights-preview-540x960-mixed.mp4). Mix WAV: [`flights-mix.wav`](../p013-flights/audio/flights-mix.wav). Evidence: [`flights-mix.evidence.json`](../p013-flights/audio/flights-mix.evidence.json).
- **Unchanged originals:** `narration-DK.wav` and `preview/flights-preview-540x960.mp4` kept their SHA-256 values.

### Sound design decisions

- **Narration first:** every other element is subordinate to it.
- **Music bed:** a soft original four-chord pad (Cmaj7–Am7–Fmaj7–G6, 4 s per chord, low-passed, light echo). It is ducked by about 8:1 under speech, fades in over 1.5 s and out over 2.5 s.
- **SFX are sparse and tied to existing visual events:**
  - Quiet pink-noise whooshes on all 7 shot transitions.
  - Soft 660 Hz paper taps on ticket and price reveals, bookings and the four answer tags.
  - A low brown-noise rumble for the opening take-off and the closing fly-by.
  - A C-major chime on the resolution (67.85 s).

  Tap levels are −22 to −24 dB, so they never compete with speech.

### Results

| Check | Result |
|---|---|
| Duration | 68.800 s, same as narration |
| Integrated loudness | −16.0 LUFS (target −16) |
| True peak | −1.5 dBTP (limit −1.5) |
| Speech over music+SFX bed | 16.1 LU (minimum 12). Narration is about −15.7 LUFS in the mix; the bed stem is −31.8 LUFS |
| Video stream | Copied unchanged (identical stream MD5), 2,064 frames; AAC 48 kHz stereo, 192 kb/s |
| Full decode | No errors |
| Narration sync (P013.5.2) | **0 ms lag, correlation 0.99981.** This is after adding `alimiter …:latency=1`; see [`flights-mix.sync.json`](../p013-flights/audio/flights-mix.sync.json). The earlier mix lagged 5 ms because of the limiter look-ahead. It is kept in [`previous-5ms-lag/`](../p013-flights/audio/previous-5ms-lag/) |

### Limitations

- **Sync check (P013.5.1):** this replaces silence detection.
  - **Method:** the bed stem (rendered through the same graph and limiter, with the narration muted) is subtracted from the mix. The amplitude envelope of what remains is cross-correlated with the source narration: 10 ms frames over ±500 ms, then 1 ms frames over ±20 ms.
  - **Pass criteria:** |lag| ≤ 2 ms and correlation ≥ 0.95.
  - **Standalone use:** `mix_audio.py --check-sync <narration> <mix> [<bed>]` validates an existing mix and writes nothing.
  - **Tests:** [`test_sync.py`](test_sync.py) has 8/8 behaving as expected ([`test-sync-results.json`](test-sync-results.json)). Positive cases (gain, loudnorm, mix with the bed subtracted) measure 0 ms. Negative cases (delays of 40 ms and 5 ms, alone and in a mix) are measured exactly and rejected. Diagnostics: `alimiter` at its defaults adds 5 ms; `latency=1` adds 0 ms.
- **5 ms lag (fixed in P013.5.2):** `latency=1` was added to the limiter and the mix was regenerated. The video stream is unchanged (identical stream MD5), and loudness and true peak are still −16.0 LUFS / −1.5 dBTP.
- **No licensed music:** none was available locally. The music is a simple procedural pad, functional but not production-grade. No external music was searched for or added.
- **Not listened to:** loudness and separation are measured, but no one has listened yet. Requirement F10 requires a human intelligibility listening check.
- **Hindi audio only:** all of the above applies only to the Hindi narration. Other locales are untested.
