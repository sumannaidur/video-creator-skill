# E19 (P022.1): Blender cinematic hero shot, E18 night-desk "send" beat

**Scope:**
- An isolated experiment, with no production integration.
- The released v0.1.0-beta Skill is untouched.
- Nothing was installed or downloaded: it uses the existing Blender 5.2.2 LTS (EEVEE on the Iris Xe), Chromium and ffmpeg.
- All artwork is procedural and original.
- The Telugu text in the textures and captions is shaped by Chromium.

**Status:**
- Technically complete.
- Artistic assessment below is the agent's own. **Owner review is pending**; professional quality is not claimed.

## Deliverables

- **Matched E18 vs Blender keyframes:**
  - `out/matched-hook-t1.2.png`
  - `out/matched-send-t3.0.png`
- **Full HD keyframes (captioned):** `out/keys-comp/c-0036.png`, `c-0090.png`, `c-0144.png`; sheet `out/keyframes-sheet.png`.
- **Preview:** `out/E19-hero-preview-540x960.mp4`
  - 540×960, 30 fps, 135 frames, 4.5 s, H.264 + AAC with the E18 narration window 0.9–5.4 s;
  - ffprobe verified; 0 black segments;
  - captions c1–c5 and the hook are composited.
- **Motion strip:** `out/motion-strip.png`.
- **Superseded first pass, kept for evidence:** `out/v1-*`, `out/preview`, `out/keys`.

## Pipeline (all in `experiments/E19`)

| Step | File | Notes |
|---|---|---|
| UI textures | `textures/make-textures.mjs` | Generic chat UI and message card rendered by the Skill's headless Chromium driver. No logo or trade dress |
| 3D scene and motion | `blender/scene.py` | Headless `bpy`. Geometry, materials, lights, camera and per-frame motion are pure functions of narration time (frame f = t × 30) |
| Measured runner | `blender/run.py` | Wall time and peak working set (Windows process counters) |
| Captions and hook | `compose/compose.mjs` | The Skill's own Tech Explainer host page and stylesheet, `shared/presentation.js` and `lib/captions.mjs`, used read-only, with E18's validated caption contract |
| Encode and comparison sheets | `compose/finalize.sh` | ffmpeg |

## Performance (measured on the i5-1145G7, Iris Xe, 16 GiB)

All renders use EEVEE, 32 samples, ray tracing, volumetrics, motion blur, depth of field and compositor bloom.

| Measure | 540×960 | 1080×1920 |
|---|---|---|
| Launch → scene built (Blender start + Python build) | 1.8 s build; about 4 s before the first frame starts | about 4.5 s |
| First frame (includes shader compilation) | 6.2–6.7 s | 16.5 s |
| Steady state per frame | **5.0–5.4 s** isolated: 8-frame benchmark ×2 runs at 5.2–5.4 s; corrected 96-frame preview pass at 4.95 s mean (3.9–5.3). The first 135-frame pass, which overlapped other agent work, averaged 6.3 s (max 11.7) | **about 17.6 s** (16.5–19.5, 4 frames) |
| Peak RAM (Blender working set) | 1.84–1.88 GiB | 2.17–2.38 GiB |
| Repeatability, two separate runs, same frames | SSIM 0.999998–0.999999, PSNR about 85 dB, frame-time spread ±3% | not repeated (one Full HD render per frame) |

- Shared iGPU memory used by the driver is not included in the RAM figures.
- Repeatability is visual, not byte-identical: the PNG bytes differ, but the pixels are practically identical.

## Production cost estimate (derived from the measurements above, not benchmarked end to end)

| Approach | 60 s Full HD film (1,800 frames) | One revision of a 4.5 s shot |
|---|---|---|
| **Animated 3D** (everything in EEVEE) | about 1,800 × 17.6 s ≈ **8.8 h** of rendering, plus 540×960 previews (≈ 2.7 h for 60 s) | about 12–14 min preview |
| **Pre-rendered layered artwork** (Blender stills as 2–4 depth plates per shot, animated 2.5D in the existing engine at about 0.22 s per Full HD frame, estimated from E18 frame timestamps) | about 8 shots × 3 plates ≈ 24 stills ≈ 7 min, plus ≈ 7 min engine render ≈ **15–25 min** | about 1 min per re-lit plate |
| **Hybrid** (EEVEE only for 1–3 hero moments, 3–8 s in total; plates elsewhere) | ≈ 90–240 hero frames ≈ 26–70 min, plus plates ≈ **45–95 min** | per hero shot as above |

**Layered plates lose:**
- moving reflections and correct perspective under camera motion;
- live rack focus;
- refraction that changes as objects move.

So the hero motion shown here (the capsule lifting out of the glass) needs the animated path. Static environments do not.

## Artistic assessment (agent self-review; evidence in `out/matched-*.png`, `out/keyframes-sheet.png` and the preview)

**Clearly better than E18 SVG:**
- Real perspective.
- Bevelled metal edges that catch the light.
- Glossy cover glass with reflections.
- Wood grain under a warm practical lamp, with a cool window rim.
- Volumetric haze and bokeh city lights giving depth.
- A focal hierarchy driven by rack focus.
- The message capsule has anticipation (pressed into the glass), a launch with stretch, an overshoot and a damped settle. E18 used straight polylines.

**Weaker than or equal to E18:**
- The phone is smaller in the hook frame, and its UI is less legible at phone size (perspective and depth of field).
- The mid-flight frame is intentionally motion-blurred, but only the green card is readable.
- At rest the phone is defocused almost beyond recognition.
- Set dressing is generic: mug and desk only, no characters.
- During the overshoot (about 2.8–3.1 s; key 90 and `out/motion-strip.png`) the capsule leaves the top-right of the frame. This is a composition defect. It is not corrected: tightening the overshoot or rest point is a parameter change for the next iteration.
- The capsule's green reads as a glossy toy rather than the "sealed glass" of E18's metaphor; it needs material and colour iteration.

**Identity:** the result stays within the Tech Explainer DNA: dark product studio, glass, light beams, green accent, one hero object. It moves the style from illustrated toward product cinematography. Diagrammatic scenes (the E18 city network and server hall) were **not** tested and would cost far more to model in 3D than the desk.

**Defect found and corrected (one attempt):** at Full HD the capsule's rounded ends broke into star-shaped shards.
- **Cause:** a subdivision modifier on the bevelled box's n-gon caps.
- **Fix:** removed the subdivision and added an 8-segment edge bevel (`out/test/capsule-fix-crop.png`, before and after).
- Only frames where the capsule is visible were re-rendered (66–161 and key 90). Frames 27–65 were reused, because the capsule has zero scale before 2.2 s.
- **Reuse check:** SSIM 0.999996 between the original and corrected frame 66 at the seam.

**Earlier look-development corrections** are in `notes/creative-direction.md`.

## Verdict for the owner

- **Does Blender substantially improve Tech Explainer quality?**
  - **For hero product moments, yes.** On light, materials, depth and the physicality of motion, the gain is the largest of any experiment so far, and these are exactly the gaps P022 attributed to technology.
  - **It does not by itself fix** composition, legibility or storytelling. Those stay creative decisions, and one gap (UI legibility) got worse.
- **Recommendation (no integration yet):** use Blender as an optional, explicitly declared renderer for **selected Tech and 3D Explainer hero shots**, with layered plates for static environments and SVG for diagrams and UI. Owner review of the preview should decide whether the gain justifies about 10–40× the per-frame cost on hero shots.

**Open items:**
- Owner artistic review.
- Native Telugu review of the UI strings ("ఫ్రెండ్", "ఆన్‌లైన్", "ఈరోజు", "గుడ్ నైట్").
- Font licensing for the textures: Nirmala UI is a Windows system font; verify, or switch to Noto Sans Telugu (OFL).
- Empty folders `C:\out\test` (left by an early relative-path bug, now fixed) need manual deletion; the safety check blocked removing them.
