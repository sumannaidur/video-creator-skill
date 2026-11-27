# P022 Advanced creative technology research

**Status:** research and recommendation only.
- Nothing was installed or downloaded.
- The released v0.1.0-beta Skill is untouched.
- **Owner approval is needed before any implementation.**

**Date:** 2026-11-27.
**Host:** i5-1145G7 (4 cores, 8 threads), 16 GiB RAM (about 2.5 GiB free at the E02 snapshot), Intel Iris Xe iGPU, Windows 11 with WSL2.

## 1. New evidence measured on this host

The installed **Blender 5.2.2 LTS** (`C:\Program Files\Blender Foundation\Blender 5.2`, not on PATH) was run headless, once, with a factory default scene at 1080×1920 and no new software:

| Engine | Result | Notes |
|---|---|---|
| EEVEE | **13.1 s** for the first frame, Iris Xe iGPU | Includes shader compilation; steady-state cost per frame is **unmeasured** |
| Cycles, CPU | 21.5 s per frame (32 samples, denoised, trivial scene) | Too slow for 1,800-frame videos with real scenes |
| Cycles, GPU | No device (oneAPI, HIP, CUDA, OptiX all empty) | Cycles GPU on Intel needs Arc ([Blender 5.0 requirements](https://developer.blender.org/docs/release_notes/5.0/eevee/)) |

Blender 5.0+ needs OpenGL 4.3 / Vulkan 1.3 and an Intel GPU of Kaby Lake or newer. Iris Xe meets that floor ([Blender Intel troubleshooting](https://docs.blender.org/manual/en/4.4/troubleshooting/gpu/windows/intel.html)), and EEVEE rendered headless here without problems.

## 2. Where the "animated infographic" look comes from

| Limitation seen in E17/E18 | Main cause | Why |
|---|---|---|
| Flat, geometric objects; no real materials, light, shadow or depth of field | **Technology** | SVG/DOM has no light transport. We fake lighting with gradients. Blur filters are costly per frame, so there is no depth of field or motion blur |
| Stiff or absent characters | **Technology and creative** | The shot engine has no parent/child rig, so limbs can't follow the body. The agent also avoided characters because authoring them as SVG code is hard |
| Iso blocks and flat side elevations; centred, diagram-like staging | **Creative** | The agent picks diagram views: isometric, cross-section, centred. A film would use perspective, low or high angles, foreground framing and shot-size variety |
| Simple tweens; no anticipation, overshoot, follow-through or secondary motion | **Creative** (tooling helps) | The animation principles aren't encoded in the kits or the plan. Nothing technical prevents them |
| No colour script or lighting arc across the film | **Creative** | Each shot is lit on its own. E18 began to do this (night to dawn) |
| Slow, limited WebGL (3D Explainer) | **Technology** | The CPU SwiftShader path was chosen for determinism, at 0.64 s per frame with primitive meshes only |

**Conclusion:** both technology and creative decisions matter.
- The **material, light and depth** gap is mostly technological. SVG can't reach film lighting at an acceptable cost.
- The **staging, acting and motion** gap is mostly creative, and fixable without new technology.

## 3. Options evaluated

| Option | Quality ceiling | Agent control | Cost on this host | Licensing | Verdict |
|---|---|---|---|---|---|
| Procedural SVG (current) | Good for typography, UI, diagrams, flat illustration; poor for light, materials, depth | Excellent (code) | Cheap | Clean (all original) | **Keep**, for overlays, typography, UI, diagrams, captions and Indic text |
| Advanced Canvas/WebGL (three.js etc.) | Higher; still limited by the CPU SwiftShader path | Good | GPU Chrome is fast but less deterministic; SwiftShader is slow | MIT | Superseded by Blender for heavy 3D |
| **Blender (EEVEE) via Python (`bpy`)** | **Film-grade** real lights, materials, DOF, motion blur, volumetrics, rigs, Grease Pencil 2D | **Good**: full headless Python API, scriptable from the resolved plan | **Measured:** EEVEE runs on the iGPU here. Per-frame cost for real scenes still to measure. Cycles is too slow | Blender is GPL; outputs are unrestricted | **Strongest candidate** |
| Layered raster + vector compositing | High; this is how most explainer studios get depth | Good | Cheap: our engine already composites image plates | Depends on the sources | **Adopt**, using Blender layers as plates |
| Open-licence assets: [Poly Haven](https://www.github.com/madjin/awesome-cc0) HDRIs, textures, models (CC0); Quaternius characters; Kenney (CC0); [Blender Studio](https://studio.blender.org/remixing/) (CC-BY, checked per asset) | High for environments, lighting and materials | Medium: the agent selects, owner approves downloads | Small downloads | CC0/CC-BY; verify each asset ([caveats](https://app.cinevva.com/guides/game-asset-licenses)) | **Adopt selectively**, HDRIs and textures first, with owner approval per download |
| Local AI image generation (SD 1.5/SDXL via OpenVINO) | Attractive stills, but weak consistency across shots, not riggable, no Indic text | Medium | **Unmeasured on Iris Xe**; published OpenVINO figures are for Arc and Xeon ([OpenVINO](https://medium.com/openvino-toolkit/how-to-run-stable-diffusion-on-intel-gpus-with-openvino-840714f122b4), [HF Intel](https://huggingface.co/blog/stable-diffusion-inference-intel)); multi-GB downloads; ~2.5 GiB free RAM | Licences vary by model (e.g. SDXL Turbo is reportedly non-commercial; **unverified**) | **Defer**; revisit only for static matte backgrounds after a bounded test |
| 2D skeletal tools (Rive, Lottie) | Good character animation | **Poor**: authoring needs their editors; Rive runtimes are MIT but the editor is a hosted product ([Rive runtimes](https://rive.app/docs/runtimes)) | Cheap playback | Mixed | **Not suitable** for autonomous authoring |
| Blender Grease Pencil (2D inside Blender) | High stylised 2D with real light and camera | Medium: scriptable, though headless rendering has had OpenGL issues ([report](https://devtalk.blender.org/t/rendering-grease-pencil-objects-on-headless-no-gpu-render-farm-machines-in-blender-2-8/10194)) | Needs the iGPU | GPL tool | Later, for Paper and Whiteboard |

**Professional precedents beyond Viral Styles:**
- **Kurzgesagt.** Its process is script → illustration → narration → animation → sound, at up to about 1,200 hours per video ([Kurzgesagt process](https://kurzgesagt.org/youtube/), [Kottke summary](https://also.kottke.org/20/02/how-to-make-a-kurzgesagt-video-in-just-1200-hours)). The quality comes from art direction and acting more than from any one tool.
- **Primer.** It made explainers with code-driven Blender, Python and manim ([primerpython, archived](https://github.com/Helpsypoo/primerpython)) and has since moved to Unity ([PrimerUnity](https://github.com/Helpsypoo/PrimerUnity)). This is precedent that a **programmatic 3D pipeline** can reach broadcast-quality explainers.
- **Blender Studio open movies.** They show that open tools reach film quality, and they publish CC-BY assets ([Blender Studio](https://studio.blender.org/films/)).

## 4. Recommended architecture (for approval)

A **hybrid pipeline: Blender renders the picture, and the existing Chromium shot engine composites the words.**

1. **Agent authoring:** the agent writes a `bpy` scene script per shot from the resolved plan. The script covers geometry, materials, lights, camera rig and armature rigs, with keyframes placed at the plan's cue seconds.
2. **Blender rendering:** EEVEE on the iGPU renders a layered image sequence per shot (background, subject, FX), checkpointed like today's frames.
3. **Shot engine compositing:** layered plates with parallax, plus full-bleed captions with word emphasis, Indic labels and hooks, preflight, cue checks, the audio mix and QA. All existing components are reused.
4. **Styles become art-direction presets** rather than separate renderers:
   - Tech, 3D and X-Ray: EEVEE product-studio kits.
   - Paper: paper-cut materials under real light.
   - Documentary: CC0 HDRIs and approved photo plates.
   - Data and Kinetic: stay SVG.
5. **Creative-direction upgrade** (no new technology):
   - a storyboard and colour-script step;
   - cinematography rules: shot sizes, angles, foreground framing, perspective over isometric;
   - animation principles encoded in motion helpers: anticipation, overshoot, follow-through, secondary motion.

**Risks to measure before committing:**
- EEVEE per-frame time on real scenes, and RAM (Blender plus Chrome on about 2.5 GiB free).
- Determinism across runs on the GPU.
- iGPU driver stability on long renders.
- Portability: Blender is a large optional dependency, and Linux/macOS are untested.
- **Blender must stay optional:** a style must fall back explicitly, never silently, when Blender is absent.

## 5. Three small experiments (ranked by expected artistic improvement)

| Rank | Experiment | What it shows | Budget |
|---|---|---|---|
| 1 | **Blender hero shot.** Restage the E18 night-desk shot entirely from an agent-written `bpy` script: perspective camera dolly, area lights, emissive screen, volumetric lamp beam, DOF, bloom, procedural materials. Composite captions over it with our engine. | Side-by-side with the E18 keyframe; **measured** per-frame EEVEE time, peak RAM, and determinism (render twice, then SSIM/hash) | One 4–5 s shot at 540×960 (about 150 frames) plus 3 Full HD keyframes. No downloads |
| 2 | **Character acting beat.** A stylised character from primitives, with an armature, shape-key expressions, blinks and amplitude-driven mouth motion, performing a 4 s beat with anticipation, overshoot and follow-through in EEVEE. | Whether expressive characters are autonomously achievable; compared with the P018.4 paper rig | One 4 s shot at 540×960. Optional: one approved CC0 rig (owner approval per download) |
| 3 | **Creative-direction pass, current engine.** Re-direct two E18 shots with a storyboard, colour script, low/high angles, foreground framing and new easing curves (anticipation, overshoot) in the existing SVG engine. | How much of the gap is creative rather than technological, at zero technology cost | 2 shots, keyframes plus one short 540×960 preview |

**Not recommended now:** local AI image generation (unmeasured on this iGPU, large downloads, licence variance, poor animatability) and Rive/Lottie (editor-bound).

**Evidence limits:**
- The Blender figures are one default-scene probe each.
- Kurzgesagt's exact tools are not confirmed by a primary source.
- The asset-library licences above come partly from secondary sources and must be verified per asset before any use.
