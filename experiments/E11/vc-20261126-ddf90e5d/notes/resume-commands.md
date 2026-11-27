# Resumable commands (run from D:\video-creator-skill\experiments\E11\vc-20261126-ddf90e5d)

The Full HD render is checkpointed. Re-running the same command reuses verified frames and renders only missing or corrupt ones. A live `render.lock` refuses a second writer.

```powershell
node ..\..\..\skills\video-creator\scripts\render.mjs --project . --topic visual/topic-sky.js --timeline narration/narration-bc46667d38.timeline.json --plan plan/resolved-plan.json --captions captions/captions.json --preflight qa/preflight/preflight.json --fps 30 --name video-1080x1920.mp4 --out render/fullhd
```

Then mix, recording the visual-production and sound stages in the ledger:

```powershell
python -I audio/make-spec.py ../render/fullhd/video-1080x1920.mp4
```

```powershell
python -I ..\..\..\skills\video-creator\scripts\audio\mix_audio.py audio/mix-spec.json --overwrite
```

Then QA:

```powershell
python -I ..\..\..\skills\video-creator\scripts\qa.py report . --video audio/final-1080x1920.mp4 --render-evidence render/fullhd/video-1080x1920-evidence.json --preflight qa/preflight/preflight.json --mix-evidence audio/mix.evidence.json --complete
```
