# P013.6 Full HD export (private prototype) — owner-run commands

The script is [`export-fullhd.ps1`](export-fullhd.ps1). It renders the existing eight-scene flight video at 1080×1920 and 30 fps with the checkpointed P013.1 renderer, attaches the corrected `audio/flights-mix.wav` (H.264 stream copy, AAC stereo at 192 kb/s and 48 kHz), then validates the result. It writes only to `experiments/E10/p013-flights/fullhd/`. The narration, artwork, audio mix and both previews are read, never written.

## Commands (PowerShell)

Run all three steps (expect about 30–35 min of rendering on this machine; the 540×960 preview took 16 min):

```powershell
powershell -ExecutionPolicy Bypass -File D:\video-creator-skill\experiments\E10\p013-flights\export-fullhd.ps1 -Step All
```

Or run them one at a time. Render can be re-run to resume: verified frames in `fullhd\frames\` are reused.

```powershell
powershell -ExecutionPolicy Bypass -File D:\video-creator-skill\experiments\E10\p013-flights\export-fullhd.ps1 -Step Render
```
```powershell
powershell -ExecutionPolicy Bypass -File D:\video-creator-skill\experiments\E10\p013-flights\export-fullhd.ps1 -Step Mux
```
```powershell
powershell -ExecutionPolicy Bypass -File D:\video-creator-skill\experiments\E10\p013-flights\export-fullhd.ps1 -Step Validate
```

- **Single writer:** Render takes an exclusive `fullhd\render.lock` and refuses to start if another render holds it. If a render was killed abruptly, delete the stale lock first.
- **Recovery:** frames are never deleted (no `--clean-frames`). After an interruption, run `-Step Render` again.
- **Mux safety:** Mux refuses to overwrite an existing final file.
- **Outputs:**
  - `fullhd\flights-1080x1920-narration.mp4`: renderer output with the narration only, validated by the renderer.
  - `fullhd\flights-1080x1920-mixed.mp4`: **final file**.
  - `fullhd\export-validation.json`.
  - `fullhd\frames\`: 2,064 JPEGs, about 0.5–1 GB.

## What Validate checks (fails on any)

- **Video:** H.264, 1080×1920, `yuv420p`, 30/1 fps, exactly 2,064 decoded frames.
- **Audio:** AAC, stereo, 48 kHz.
- **Duration:** video, audio and container each 68.8 s ±0.04 s.
- **Video unchanged by mux:** stream MD5 of the final file equals the renderer output.
- **Decoding:** a full decode with no errors.
- **Loudness:** integrated −16 LUFS ±1, true peak ≤ −1.0 dBTP, measured on the delivered AAC.
- **Narration sync:** the delivered audio is decoded and checked with the P013.5.1 bed-subtracted cross-correlation (lag ≤ 2 ms, correlation ≥ 0.95).

The renderer itself also checks every frame: safe areas, labels, text, plate coverage, all 45 cues, keyframes and repeatability. It also checks the speech onset of its narration-only encode.

**Dry-run evidence:** Mux and Validate were run against the existing 540×960 preview in a scratch folder. All checks executed, and only the expected resolution check failed. The results were: 2,064 frames; 68.8 s video and audio; −16.0 LUFS; −1.5 dBTP; sync lag 0 ms with correlation 0.99979 after AAC. The dry run found and fixed one script bug: in PowerShell 5.1, FFmpeg's stderr was treated as an error.

## Outstanding gates before any non-private use

- **Human review:** full-motion viewing of pacing, transitions and composition. Known notes are in the scene reports and [`creative-decisions.md`](creative-decisions.md).
- **Hindi:** native listening review of the Kokoro `hf_alpha` narration (E03), and native-reader review of all captions and on-screen labels.
- **Caption break:** the «अलग-अलग» break across the hyphen in Scene 07 is still unresolved (engine caption layout).
- **Timing:** human verification of the provisional phrase and word timings (E04). All timelines remain `unreviewed`.
- **Facts:** sources F01–F05 are owner-supplied and unverified ([`research.md`](research.md)). The prices ₹3,000, ₹6,000 and ₹9,000 are illustrative examples.
- **Audio:** a human intelligibility listening check (requirement F10). The music is a basic procedural pad.
- **Length:** the narration runs 68.8 s against the target of about 60 s.
- **Licensing:**
  - The frames rasterise the installed Microsoft Nirmala UI and Segoe UI fonts, so redistribution terms for rendered output need review.
  - Kokoro model and voice terms follow the E03 records.
  - All artwork and audio are original and generated in this repository (see `audio/assets/assets-manifest.json`).
