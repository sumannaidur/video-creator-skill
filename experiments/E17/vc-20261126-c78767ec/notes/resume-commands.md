# Resumable commands (run from D:\video-creator-skill\experiments\E17\vc-20261126-c78767ec)

Renders are checkpointed; re-running a command reuses verified frames.

Preview (540x960):

```powershell
node ..\..\..\skills\video-creator\scripts\render.mjs --project . --topic visual/topic-heart.js --timeline narration/narration-7480761c4b.timeline.json --plan plan/resolved-plan.json --captions captions/captions.json --preflight qa/preflight/preflight.json --locale te-IN --fps 30 --scale 0.5 --name preview-540x960.mp4 --out render/preview
```

Full HD (1080x1920):

```powershell
node ..\..\..\skills\video-creator\scripts\render.mjs --project . --topic visual/topic-heart.js --timeline narration/narration-7480761c4b.timeline.json --plan plan/resolved-plan.json --captions captions/captions.json --preflight qa/preflight/preflight.json --locale te-IN --fps 30 --name video-1080x1920.mp4 --out render/fullhd
```

Mix:

```powershell
python -I audio/make-spec.py ../render/fullhd/video-1080x1920.mp4
```

```powershell
python -I ..\..\..\skills\video-creator\scripts\audio\mix_audio.py audio/mix-spec.json --overwrite
```

Unified QA:

```powershell
python -I ..\..\..\skills\video-creator\scripts\qa.py report . --video audio/final-1080x1920.mp4 --render-evidence render/fullhd/video-1080x1920-evidence.json --preflight qa/preflight/preflight.json --mix-evidence audio/mix.evidence.json --complete
```
