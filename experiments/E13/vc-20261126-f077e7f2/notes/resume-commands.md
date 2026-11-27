# Resumable commands (run from D:\video-creator-skill\experiments\E13\vc-20261126-f077e7f2)

The renders are checkpointed. Re-running the same command reuses verified frames and renders only missing or corrupt ones. A live `render.lock` refuses a second writer.

Preview (540x960):

```powershell
node ..\..\..\skills\video-creator\scripts\render.mjs --project . --topic visual/topic-trains.js --timeline narration/narration-1d6e722da7.timeline.json --plan plan/resolved-plan.json --captions captions/captions.json --preflight qa/preflight/preflight.json --locale te-IN --fps 30 --scale 0.5 --name preview-540x960.mp4 --out render/preview
```

Full HD (1080x1920):

```powershell
node ..\..\..\skills\video-creator\scripts\render.mjs --project . --topic visual/topic-trains.js --timeline narration/narration-1d6e722da7.timeline.json --plan plan/resolved-plan.json --captions captions/captions.json --preflight qa/preflight/preflight.json --locale te-IN --fps 30 --name video-1080x1920.mp4 --out render/fullhd
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
