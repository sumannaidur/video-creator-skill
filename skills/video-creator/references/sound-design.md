# Sound design and mixing

**Narration comes first.** Music and effects support comprehension and never compete with speech.

## Decisions (yours)

- **Music:** choose whether to use it, its mood and its level. Prefer a quiet bed that is ducked under speech. If no licensed or original music is available, leave it out and say so.
- **Effects:** use them sparingly, tied to visual events that already exist (transitions, reveals, the resolution). Keep short taps 20 dB or more below speech. Avoid effects on stressed words.
- **Shape:** fade the bed in at the opening, fade it out at the end, and keep an optional subtle resolve cue.

## Assets and provenance

Use only assets with known rights: original procedural audio generated with FFmpeg, or licensed files whose license and source appear in the asset manifest. The mixer refuses any file whose hash is not in the manifest.

## Tools (packaged)

Every path in a spec is relative to the spec file. Outputs and generated assets must live in the project, **outside** the Skill package. Existing outputs are kept unless you pass `--overwrite`.

```
python scripts/audio/make_procedural_assets.py <project>/audio/assets [--music-seconds 70] [--overwrite]
python scripts/audio/mix_audio.py <project>/audio/mix-spec.json [--overwrite]
python scripts/audio/mix_audio.py --check-sync <narration.wav> <mix.wav> [<bed.wav>]
```

## Mix spec

```json
{
  "narration": "../narration/narration.wav",
  "manifest": "assets/assets-manifest.json",
  "music": {"file": "assets/music-pad.wav", "gain_db": 2, "fade_in": 1.5, "fade_out": 2.5,
            "duck": {"threshold": 0.03, "ratio": 8, "attack_ms": 30, "release_ms": 600}},
  "sfx": [{"file": "assets/pop.wav", "at": 4.375, "gain_db": -22, "why": "reveal"}],
  "loudness": {"integrated_lufs": -16, "true_peak_db": -1.5},
  "intelligibility_min_lu": 12,
  "output": "mix.wav",
  "video": {"input": "../renders/preview/video.mp4", "output": "../renders/preview/video-mixed.mp4"}
}
```

- **Optional sections:** `music`, `sfx` and `video` are optional. Leave out `music` and `sfx` for a narration-only mix; it is still loudness-normalized, peak-limited and sync-checked.
- **Narration:** never altered, only mixed.
- **Provenance:** every music or effects file must match a manifest entry by SHA-256, and that entry must carry a license. Otherwise the mix is refused.
- **Outputs:** `<output>` (48 kHz stereo PCM16), `<output>.bed.wav` (music and effects only, used for validation), `<output>.evidence.json`, and the muxed MP4 when `video` is set. The video stream is copied, never re-encoded or truncated. If the render ends up to a frame after the narration, the audio tail is padded with silence.

## Checks (thresholds unchanged from P013)

The mixer refuses to report success unless all of these hold:

- Integrated loudness is within 1 LU of the target (default −16 LUFS).
- True peak is at or below the limit (default −1.5 dBTP).
- Speech is at least the minimum separation above the bed (default 12 LU).
- Narration sync, measured by subtracting the bed stem and cross-correlating the envelope with the narration: lag ≤ 2 ms and correlation ≥ 0.95.
- Duration equals the narration's.
- When muxing, the video stream is unchanged and the file fully decodes.

The limiter has latency compensation on (`latency=1`); without it P013 measured a 5 ms shift. The mix is measurement-equivalent across runs but **not bit-identical**, because the FFmpeg graph isn't bit-reproducible.

These are technical measurements. They do not establish human intelligibility or musical quality; a human listening check is still required.
