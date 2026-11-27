"""P014.3C focused audio tests (system Python + FFmpeg). Uses repository P013 audio as fixtures.

python -I skills/video-creator/scripts/tests/test_audio.py [--repo <root>] [--work <scratch>]
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

PKG = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--repo", default=str(PKG.parents[1]))
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-p014c-tests"))
a = ap.parse_args()
repo, work = Path(a.repo).resolve(), Path(a.work).resolve()
shutil.rmtree(work, ignore_errors=True); work.mkdir(parents=True)
results = []
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()


def check(name, ok, **detail):
    results.append(dict(name=name, ok=bool(ok), **detail))
    print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(detail, ensure_ascii=False)[:400])


# 1. No experiments/ references (provenance lines excluded); run everything from an installed copy outside the repo.
refs = [f"{f.name}:{n}" for f in (PKG / "scripts" / "audio").glob("*.py")
        for n, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1) if "experiments" in line and "Packaged from" not in line]
check("no experiments/ references in packaged audio code", not refs, refs=refs)
installed = work / "installed" / "video-creator"
shutil.copytree(PKG, installed)
audio = installed / "scripts" / "audio"
py = lambda *args: subprocess.run([sys.executable, "-I", *map(str, args)], capture_output=True, text=True, encoding="utf-8")

# 2. Thresholds unchanged from P013.5.2.
src = (audio / "mix_audio.py").read_text(encoding="utf-8")
check("sync thresholds and limiter latency preserved", "SYNC_MAX_LAG_MS = 2" in src and "SYNC_MIN_CORR = 0.95" in src and "latency=1" in src)

# 3. Assets: generated outside the package, refused inside it, never silently overwritten.
project = work / "project"; assets = project / "audio" / "assets"
r = py(audio / "make_procedural_assets.py", assets, "--music-seconds", "12")
r2 = py(audio / "make_procedural_assets.py", assets, "--music-seconds", "12")
r3 = py(audio / "make_procedural_assets.py", installed / "assets-here")
check("asset generator: manifest written, overwrite refused, package path refused",
      r.returncode == 0 and (assets / "assets-manifest.json").exists() and r2.returncode != 0 and "--overwrite" in r2.stderr and r3.returncode != 0,
      first=r.returncode, second=r2.stderr.strip()[-120:], inside=r3.stderr.strip()[-80:])

# 4. The eight P013.5.1 synchronization tests, from the installed copy.
r = py(installed / "scripts" / "tests" / "test_sync.py", repo / "experiments/E10/p013-flights/narration-DK.wav", assets / "music-pad.wav")
check("eight synchronization regression tests", r.returncode == 0 and r.stdout.count("PASS") == 8, out=r.stdout.strip().splitlines()[-1:] if r.stdout else r.stderr[-200:])

# 5. Short mix + video mux smoke test (music, two effects, ducking, loudness, peak, sync, stream copy).
narration = project / "narration.wav"
shutil.copy(repo / "experiments/E04/native-timing/samples/sample-B-native.wav", narration)
seconds = 8.925
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", f"color=c=0x427361:s=270x480:r=30:d={seconds}",
                "-i", str(narration), "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
                str(project / "preview.mp4")], check=True)
spec = {"narration": "narration.wav", "manifest": "audio/assets/assets-manifest.json",
        "music": {"file": "audio/assets/music-pad.wav", "gain_db": 2, "fade_in": 1.0, "fade_out": 1.5, "duck": {"threshold": 0.03, "ratio": 8, "attack_ms": 30, "release_ms": 600}},
        "sfx": [{"file": "audio/assets/whoosh.wav", "at": 1.6, "gain_db": -16, "why": "test transition"},
                {"file": "audio/assets/pop.wav", "at": 4.375, "gain_db": -22, "why": "test reveal"}],
        "loudness": {"integrated_lufs": -16, "true_peak_db": -1.5}, "intelligibility_min_lu": 12,
        "output": "audio/mix.wav", "video": {"input": "preview.mp4", "output": "preview-mixed.mp4"}}
(project / "mix-spec.json").write_text(json.dumps(spec, indent=2), encoding="utf-8")
r = py(audio / "mix_audio.py", project / "mix-spec.json")
ev = json.loads((project / "audio/mix.evidence.json").read_text(encoding="utf-8")) if r.returncode == 0 else {}
check("mix + mux smoke: all checks pass, video stream copied", r.returncode == 0 and ev.get("passed") and ev["checks"].get("video_stream_copied_unchanged"),
      checks=ev.get("checks"), lufs=ev.get("output", {}).get("integrated"), peak=ev.get("output", {}).get("true_peak"), sync=ev.get("sync"), err=r.stderr[-200:])
r = py(audio / "mix_audio.py", project / "mix-spec.json")
check("rerun refuses to overwrite existing mix outputs", r.returncode != 0 and "--overwrite" in r.stderr, err=r.stderr.strip()[-150:])

# 6. Narration-only mix (no music, no effects).
only = {k: v for k, v in spec.items() if k not in ("music", "sfx", "video")} | {"output": "audio/narration-only.wav"}
(project / "only-spec.json").write_text(json.dumps(only, indent=2), encoding="utf-8")
r = py(audio / "mix_audio.py", project / "only-spec.json")
ev = json.loads((project / "audio/narration-only.evidence.json").read_text(encoding="utf-8")) if r.returncode == 0 else {}
check("narration-only mix passes loudness, peak and sync", r.returncode == 0 and ev.get("passed") and not ev.get("provenance"),
      checks=ev.get("checks"), sync=ev.get("sync"), err=r.stderr[-200:])

# 7. Provenance: a hash-mismatched file and an unlicensed manifest entry are both refused.
bad = project / "audio/assets/pop-edited.wav"
data = bytearray((assets / "pop.wav").read_bytes()); data[-2] ^= 1; bad.write_bytes(bytes(data))
mis = only | {"sfx": [{"file": "audio/assets/pop-edited.wav", "at": 2.0, "gain_db": -22}], "output": "audio/bad1.wav"}
(project / "bad1.json").write_text(json.dumps(mis), encoding="utf-8")
r = py(audio / "mix_audio.py", project / "bad1.json")
check("rejects asset whose hash is not in the manifest", r.returncode != 0 and "provenance" in r.stderr, err=r.stderr.strip()[-120:])
manifest = json.loads((assets / "assets-manifest.json").read_text(encoding="utf-8"))
manifest["assets"]["pop"]["license"] = ""
(project / "audio/assets/unlicensed-manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
unl = only | {"manifest": "audio/assets/unlicensed-manifest.json", "sfx": [{"file": "audio/assets/pop.wav", "at": 2.0, "gain_db": -22}], "output": "audio/bad2.wav"}
(project / "bad2.json").write_text(json.dumps(unl), encoding="utf-8")
r = py(audio / "mix_audio.py", project / "bad2.json")
check("rejects asset whose manifest entry has no license", r.returncode != 0 and "license" in r.stderr, err=r.stderr.strip()[-120:])

# 8. Regression: the packaged mixer reproduces the accepted P013 flight mix byte for byte (audio only, no video).
flights = repo / "experiments/E10/p013-flights"
fspec = json.loads((flights / "audio/mix-spec.json").read_text(encoding="utf-8"))
reg = work / "regression"; reg.mkdir()
fspec["narration"] = str((flights / "audio" / fspec["narration"]).resolve())
fspec["manifest"] = str((flights / "audio" / fspec["manifest"]).resolve())
fspec["music"]["file"] = str((flights / "audio" / fspec["music"]["file"]).resolve())
for s in fspec["sfx"]:
    s["file"] = str((flights / "audio" / s["file"]).resolve())
fspec.pop("video"); fspec["output"] = "flights-mix.wav"
(reg / "spec.json").write_text(json.dumps(fspec, ensure_ascii=False), encoding="utf-8")
r = py(audio / "mix_audio.py", reg / "spec.json")
# The FFmpeg graph is not bit-reproducible run to run (the unchanged experimental mixer also differs between runs), so compare
# measurements and the residual against the accepted mix instead of bytes.
new = json.loads((reg / "flights-mix.evidence.json").read_text(encoding="utf-8")) if r.returncode == 0 else {}
old = json.loads((flights / "audio/flights-mix.evidence.json").read_text(encoding="utf-8"))
stats = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(reg / "flights-mix.wav"), "-i", str(flights / "audio/flights-mix.wav"), "-filter_complex",
                        "[0][1]amerge=inputs=2,pan=mono|c0=c0-c2,astats=reset=0", "-f", "null", "-"], capture_output=True, text=True).stderr
residual = float(stats.split("Overall")[-1].split("RMS level dB:")[1].split()[0]) if "Overall" in stats else 0.0
same = r.returncode == 0 and new["loudnorm_first_pass"] == old["loudnorm_first_pass"] and new["applied_gain_db"] == old["applied_gain_db"] and     (new["output"]["integrated"], new["output"]["true_peak"]) == (old["output"]["integrated"], old["output"]["true_peak"]) and new["passed"]
check("flight mix regression: same measurements as P013.5.2, residual <= -70 dBFS RMS", same and residual <= -70,
      residual_rms_db=residual, lufs=new.get("output", {}).get("integrated"), peak=new.get("output", {}).get("true_peak"), err=r.stderr[-200:])

(PKG / "scripts" / "tests" / "test-audio-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed")
sys.exit(0 if all(x["ok"] for x in results) else 1)
