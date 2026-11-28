# Experiment index (E01–E42, P024)

The development experiments were removed from the active source tree in P026.6C to keep the repository focused on the installable Skill. They remain fully recoverable from three places.

## Where the experiments are kept

1. **Git history:** commit `f097174`, and everything before it, contains every committed experiment file. Recover with `git checkout f097174 -- experiments/E13`.
2. **Local archive (maintainer machine, git-ignored):** `archive/experiments-2026-11-28.tar.gz`.
   - SHA-256 `c462dc1f770960dc7c3cfbacc1aadad3a4e4bf84da20744689c71a8ad083cfda`.
   - 1,740 files, 82.9 MB uncompressed.
   - Contents: the working-tree state, including the P026.2 privacy-sanitised versions and 233 files that were never committed. A per-file SHA-256 manifest sits beside it.
3. **Generated media** (frames, audio, video, about 11 GB): never in Git; local only.

Representative review sheets are kept in [docs/media](../media/README.md). Older write-ups live in `docs/history/experiments/`.

**Status key:** *study* = development keyframes or windows only; *production* = complete video. No experiment has passed human artistic, native-language or publication review.

## Foundations

| ID | Purpose | Outcome |
|---|---|---|
| E01 | Agent Skill portability probe (Claude Code and Codex discovery) | Skill format confirmed portable; see `docs/history/experiments/E01-*` |
| E02 | Hardware assessment of the CPU-first reference laptop | Write-up only (`docs/history/experiments/E02-*`) |
| E03 | Narration candidates: Kokoro Hindi evaluation, Mithi in WSL2, listening scorecards | Kokoro hi-IN and Mithi chosen; hashed Kokoro dependency set recorded |
| E04 | Speech alignment prototype and native model timing | Native token-duration timing adopted instead of forced alignment |
| E05 | Indic caption shaping proof | Browser text shaping validated for Indic captions |
| E06 | Paper Explainer prototype | First cut-paper shot engine |
| E07 | P010 renderer start-up study | Renderer foundations |

## First productions (P011–P016)

| ID | Purpose | Outcome |
|---|---|---|
| E10 | P011–P013 Paper "flights" production, audio mix, Full HD export | Accepted P013 reference keyframes and mix (local regression fixtures) |
| E11 | First packaged-Skill production (`vc-20261126-ddf90e5d`) | Paper production |
| E12 | Mithi Telugu synthesis and timing (P015.2A/B) | te-IN route validated technically |
| E13 | Packaged Paper production (`vc-20261126-f077e7f2`) | Production |
| E14 | Mithi kn/ta/en/hi routes (P016) | Four locales validated technically |
| E15 | Style fixtures P017.1–P017.8 (Tech, Whiteboard, Flat Science, Data, Kinetic, X-Ray, Documentary, 3D) | All nine styles implemented and fixture-validated |
| E16 | Premium full-bleed presentation and richness (P018.x) | Full-bleed mode and richness helpers |
| E17 | Paper production, full-bleed, Telugu: how the heart pumps blood | Production ([sheet](../media/e17-paper-production-contact.png)) |
| E18 | Production on the packaged Skill (`vc-20261127-8467b203`) | Production; basis for the E19 hero shot |

## Quality research and style studies (P022–P023)

| ID | Purpose | Outcome |
|---|---|---|
| E19 | Blender cinematic hero shot (P022.1) | Blender layers feasible ([sheet](../media/e19-blender-hero-keyframes.png)) |
| E20 | Motion and composition primitives on Paper and Data Storytelling (P022.2) | `shared/motion.js` ([before/after](../media/e20-motion-composition-before-after.png)) |
| E21–E29 | Premium style studies, unseen topics: Paper (bees), Whiteboard (heat), Flat Science (star birth), Data (Everest), Kinetic (moon phases), Tech (hard drive), X-Ray (bicycle gears), Documentary (first flight, LoC photo), 3D (ball bearing) | Craft helpers for every style |

## Autonomous validation (P024)

| ID | Topic and style | Outcome |
|---|---|---|
| E30 | Car differential: 3D, en-IN | Mechanism check passed; mid quality |
| E31 | Pin-tumbler lock: X-Ray, kn-IN | Accurate mechanism; weak composition |
| E32 | Apollo 11: Documentary, en-IN | Authentic NASA media ([sheet](../media/e32-documentary-apollo-keyframes.png)) |
| E33–E38 | Sleep and memory; autumn leaves; QR codes; compound interest; vaccines; India's literacy (Codex runs) | Development keyframes |
| E39 | Seed gravitropism: Paper, te-IN | First 540×960 preview window |
| E40 | Touchscreen: Tech, en-IN | Window; strongest Tech opening ([sheet](../media/e40-tech-touchscreen-keyframes.png)) |
| E41 | Lighthouse lens: 3D, en-IN; CC0 Poly Haven hero still | Lens strong; payoff not ready |
| E42 | Induction stove: Tech, te-IN, Blender material layers | **Full HD production passed delivery QA** ([sheet](../media/e42-tech-induction-fullhd-keyframes.png)) |
| P024 | Validation harnesses and a dev-install helper | `install_dev.sh` and `duration_fit.py` moved to `tools/`; the harnesses are superseded by packaged tests |
