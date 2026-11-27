# E19 creative direction: the "send" beat as a lit product shot

**Beat:** E18 narration 0.9–5.4 s, covering the hook headline and the cues "సెండ్ నొక్కుతారు" and "క్షణాల్లోనే…".

**Story change from E18:** in E18, the message was a flat bubble on a flat phone. Here the typed "హాయ్" is lifted out of the screen as a physical glass capsule: it is pressed in, launched, overshoots and settles. The next E18 beat (the padlock on the capsule) can then pick it up.

## Decisions

- **Camera:**
  - 48 mm, about 0.35 m from the phone, eye slightly above the desk, 3/4 view of the phone (17° yaw, 13° lean on its stand).
  - Slow dolly-in with a small, settling Dutch drift (−1.2° → +0.4°).
  - The aim tilts up to follow the capsule after launch.
  - Deterministic breathing (sub-millimetre sine drift), never random.
- **Focal hierarchy:**
  - The screen is in focus until the send cue.
  - Then a rack focus (0.7 s) moves to the capsule.
  - f/4 keeps the phone readable while the city falls into bokeh.
  - The capsule rests in the upper-centre third. Captions keep the lower band, and the hook keeps the top until 2.2 s.
- **Lighting (night motivation):**
  - Warm desk lamp off-frame left: a spot with a volumetric beam and dust motes.
  - Cool moonlight rim from the window, right-rear.
  - Green screen spill that pulses at "send".
  - Emissive city lights 2.5–6 m behind the window become bokeh.
  - AgX view transform, with gentle compositor bloom.
- **Materials (all procedural):**
  - Graphite-titanium frame (anisotropic metal) and black coated cover glass.
  - Screen: emission through rounded-corner alpha, with a coat layer for reflections.
  - Walnut desk: wave plus noise grain, varying roughness, micro-bump.
  - Glazed terracotta mug, anodised stand, low-IOR glass capsule with a Fresnel edge glow.
- **Motion (animation principles):**
  - The capsule appears with ease-out-back.
  - Anticipation: it squashes 12–25% into the glass for 0.2 s.
  - Launch at the send cue: ease-out-quart along a curved path, stretched along travel, with a roll arc.
  - It overshoots the rest point by 22 mm, then settles on a damped spring (follow-through on position, tilt and squash).
  - Idle float: bob and slow yaw that catch reflections.
  - A comet trail draws on and retracts.
- **Text:**
  - All Telugu UI text is shaped by Chromium into textures; Blender text objects are not used for Indic script.
  - Captions and the hook are composited over the plate by the Skill's own `presentation.js` and caption contract.
- **Guardrails kept:** generic chat UI, no WhatsApp logo or trade dress, original procedural artwork only, no downloaded assets.

## Corrections made (evidence: `out/test/sheet1..4.png`)

1. **Haze, glow and wood:**
   - Volume haze washed out the frame, so density went from 1.1 to 0.22.
   - Send-pulse glow and rim reduced.
   - Wood grain re-scaled.
   - Camera moved closer.
2. **Lens inversion:** the thick glass refracted like a lens and inverted the card text, so the glass IOR went from 1.45 to 1.12.
3. **Trail:** the trail stayed as a dark stick, so it now retracts.
4. **White blowout in flight and at rest:**
   - **Root cause:** the rim and spill area lights were transmitted through the glass to the lens.
   - **Fix:** `transmission_factor = 0` on those lights; the card is emission-only.
