# Third-party notices

This file separates what the project licenses from material it does not own.

**Review status:**
- **Reviewed:** 2026-11-27.
- **"Verified"** means the licence was read from the authoritative source named in that row on that date: the project's own licence file, Hugging Face model metadata, a GitHub repository licence, or PyPI package metadata.
- **"Unresolved"** means the rights have not been established; do not assume them.
- **Not legal advice.**

## 1. This project

The original code and documentation in this repository and in the `video-creator` Skill package are licensed under the **Apache License 2.0** (see `LICENSE`).

That licence covers **only** original work of this project. It grants **no rights** over anything listed below, over material users supply, or over the videos users generate.

Releases `v0.1.0-beta` and `v0.2.0-beta` were published with the metadata "Proprietary (project-internal)", before the licence was chosen. The Apache-2.0 licence applies from the commit that added `LICENSE`.

## 2. Tools you install yourself (not bundled)

| Tool | Licence | Status |
|---|---|---|
| Node.js | MIT | Not re-verified in this review |
| Python | PSF License | Not re-verified in this review |
| FFmpeg / FFprobe | LGPL-2.1+ or GPL, depending on how your build was configured | Check your build (`ffmpeg -L`) |
| Chromium, or Google Chrome / Microsoft Edge | Chromium: BSD-3-Clause plus bundled components. Chrome and Edge: their vendors' terms | Not re-verified in this review |
| Blender (optional) | GPL-2.0-or-later | Not re-verified in this review. The Skill runs Blender as a separate program and does not link to it |
| WSL2 / Ubuntu (Mithi route) | Microsoft and Canonical terms | Not re-verified in this review |

## 3. Narration runtime packages (installed by you, run as separate processes)

| Package | Licence | Source | Status |
|---|---|---|---|
| torch | Apache-2.0 and others (BSD-2/3-Clause, MIT, BSL-1.0, ISC, Zlib, LLVM exception) | PyPI metadata | Verified |
| numpy | BSD-3-Clause and others (0BSD, MIT, Zlib, CC0-1.0) | PyPI metadata | Verified |
| soundfile | BSD-3-Clause | PyPI metadata | Verified |
| onnxruntime | MIT | PyPI metadata | Verified |
| kokoro-onnx (0.6.1 pinned) | MIT | GitHub `thewh1teagle/kokoro-onnx` | Verified |
| phonemizer | **GPL-3.0-or-later** | PyPI and GitHub `bootphon/phonemizer` | Verified |
| eSpeak NG | **GPL-3.0** | GitHub `espeak-ng/espeak-ng` | Verified |

The project does not distribute, vendor or link any of these; the Kokoro route calls them inside your own Python environment. If you redistribute such an environment, the GPL-licensed components bring their own obligations.

## 4. Narration models and voices (downloaded by you, never bundled)

| Model | Licence | Status |
|---|---|---|
| **Mithi v2 Flash** (`Oomni/mithi-v2-flash`, revision `1fc0dd68496a2483508ec764d310146c41ff90be`), including the voices `ahana`, `vaidehi`, `malini`, `anirban` and `charvi` in `voices.safetensors` | **Apache-2.0** | Verified from the Hugging Face model metadata and from the `LICENSE` file in the pinned revision (SHA-256 `c71d239d…`, the hash recorded in the packaged manifest) |
| **Kokoro-82M** (`hexgrad/Kokoro-82M`), used through the ONNX files `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the kokoro-onnx `model-files-v1.1` release, voice `hf_alpha` | **Apache-2.0** | Verified from the Hugging Face model metadata |

**Unresolved for both models:**
- the provenance and speaker consent of the underlying voice recordings;
- any personality or likeness rights;
- dataset terms.

None of these are documented in the files reviewed. Review them before commercial or public use of the narration.

## 5. Fonts

The renderer uses **system fonts**, Nirmala UI and Segoe UI (Microsoft, supplied with Windows). Captions and labels rasterise them into the video frames. No font file is bundled.

- **Unresolved:** Microsoft's font licence terms for embedding these fonts in published or commercial video have not been reviewed.
- Using openly licensed fonts (for example SIL OFL fonts) would need a project decision.

## 6. External artwork and photographs

The **Skill package contains no third-party artwork.** By default, styles draw original procedural artwork.

Development experiments in this repository used external assets with owner approval. **The asset files themselves are not tracked;** some review contact sheets that show them are.

| Experiment | Asset | Status |
|---|---|---|
| E41 | Poly Haven `the_sky_is_on_fire`, `coastal_cliff_01`, `ship_pinnace` | **CC0 1.0**, verified on each asset's page. Provenance and hashes in `experiments/E41/assets/provenance.json` |
| E32 | NASA Apollo 11 photographs (GPN-2000-000630, the Eagle in lunar orbit, AS11-40-5903, AS11-40-5877) | Public domain as recorded on their Wikimedia Commons file pages, sourced from NASA. NASA insignia and logo restrictions are separate and not reviewed |
| E28 | Wright brothers' first flight, 1903 (Library of Congress ppprs.00626) | Public domain, "no known restrictions", as recorded on the Commons and Library of Congress listing |

## 7. Generated media

Videos you produce contain:
- narration from the models in section 4;
- rasterised fonts from section 5;
- any assets you choose to include;
- original procedural artwork and audio generated by the packaged scripts.

The project claims no rights over your generated videos and grants none over the third-party material in them. **Publication rights remain your responsibility**, and the Skill keeps human licensing and publication review as open gates.

## 8. Trademarks

Claude, Claude Code, Codex, Antigravity, GitHub, Hugging Face, NASA, Poly Haven and other names belong to their respective owners. Their mention does not imply endorsement.
