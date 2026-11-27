"""Optional pre-rendered artwork layers with Blender (P024.1B). Blender is never required: without it every command except
detect fails with an explicit [blender-unavailable] code, and the style keeps its own renderer (no silent substitution).

python scripts/blender_layers.py detect [--json OUT]
python scripts/blender_layers.py render --scene SCENE.py --out DIR --res 810x1440 [--samples 48]
python scripts/blender_layers.py pack --layers DIR --topic TOPIC.js --out PACKED.js [--jpeg-quality 3]

render: SCENE.py is an agent-authored bpy script (original procedural artwork; it may also import owner-approved, licence-
verified assets recorded in the project's assets/provenance.json, see references/visual-production.md) that builds the scene, sets scene.camera and
defines LAYERS = {"base": [...], "part": [...]} (first opaque, the others transparent) and optional GEOMETRY. Use an
orthographic camera aligned to any axis the engine will rotate parts about, so 2D rotations stay exact.
pack: writes one topic module that starts with globalThis.vcLayers = {name: data URI, ..., geometry, size} (base as JPEG
when FFmpeg is available, others PNG), ready for techKit.art.raster(vcLayers.base, w, h). Outputs must be outside the Skill.
Blender is found in VC_BLENDER, on PATH, or in the standard Windows/macOS/Linux install locations.
"""
import argparse
import base64
import glob
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from pathlib import Path

PACKAGE = Path(__file__).resolve().parents[1]
NEEDED_FOR = "optional pre-rendered artwork layers (scripts/blender_layers.py)"


def find_blender():
    cands = [os.environ.get("VC_BLENDER"), shutil.which("blender")]
    if platform.system() == "Windows":
        cands += sorted(glob.glob(r"C:\Program Files\Blender Foundation\Blender*\blender.exe"), reverse=True)
    elif platform.system() == "Darwin":
        cands.append("/Applications/Blender.app/Contents/MacOS/Blender")
    else:
        cands += ["/usr/bin/blender", "/snap/bin/blender"]
    return next((c for c in cands if c and Path(c).is_file()), None)


def detect():
    path = find_blender()
    if not path:
        return dict(status="missing", path=None, required=False, needed_for=NEEDED_FOR)
    try:
        out = subprocess.run([path, "-b", "--factory-startup", "--version"], capture_output=True, text=True, timeout=90).stdout
        ver = next((line.split()[1] for line in out.splitlines() if line.startswith("Blender ")), None)
    except Exception as e:
        return dict(status="incompatible", path=path, reason=str(e)[:120], required=False, needed_for=NEEDED_FOR)
    return dict(status="available" if ver else "incompatible", path=path, version=ver, required=False, needed_for=NEEDED_FOR)


def outside_package(p):
    p = Path(p).resolve()
    if p == PACKAGE or PACKAGE in p.parents:
        sys.exit(f"[output-in-package] {p} is inside the Skill package; write outputs to the project folder")
    return p


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("detect")
    d.add_argument("--json")
    r = sub.add_parser("render")
    r.add_argument("--scene", required=True); r.add_argument("--out", required=True); r.add_argument("--res", default="810x1440"); r.add_argument("--samples", type=int, default=48)
    k = sub.add_parser("pack")
    k.add_argument("--layers", required=True); k.add_argument("--topic", required=True); k.add_argument("--out", required=True); k.add_argument("--jpeg-quality", type=int, default=3)
    a = ap.parse_args()
    if a.cmd == "detect":
        txt = json.dumps(detect(), indent=2)
        if a.json:
            outside_package(a.json).write_text(txt, encoding="utf-8")
        print(txt)
        return
    if a.cmd == "render":
        path = find_blender()
        if not path:
            sys.exit("[blender-unavailable] Blender was not found (VC_BLENDER, PATH or a standard install). Keep the style's own renderer; do not substitute.")
        out = outside_package(a.out)
        out.mkdir(parents=True, exist_ok=True)
        w, h = (int(x) for x in a.res.split("x"))
        t = time.perf_counter()
        p = subprocess.run([path, "-b", "--factory-startup", "--python", str(PACKAGE / "scripts/blender/layer_runner.py"), "--",
                            str(Path(a.scene).resolve()), str(out), str(w), str(h), str(a.samples)], capture_output=True, text=True, encoding="utf-8", errors="replace")
        ok = p.returncode == 0 and (out / "layers.json").exists() and "VC-LAYERS-DONE" in p.stdout
        print(json.dumps(dict(ok=ok, out=str(out), wallSeconds=round(time.perf_counter() - t, 1), log=None if ok else (p.stdout + p.stderr)[-600:])))
        sys.exit(0 if ok else 1)
    src = Path(a.layers)
    meta = json.loads((src / "layers.json").read_text(encoding="utf-8"))
    data = {}
    for i, name in enumerate(meta["layers"]):
        png = src / f"{name}.png"
        if i == 0 and shutil.which("ffmpeg"):
            jpg = src / f"{name}.jpg"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(png), "-q:v", str(a.jpeg_quality), str(jpg)], check=True)
            data[name] = "data:image/jpeg;base64," + base64.b64encode(jpg.read_bytes()).decode()
        else:
            data[name] = "data:image/png;base64," + base64.b64encode(png.read_bytes()).decode()
    data["geometry"], data["size"] = meta.get("geometry", {}), meta["size"]
    out = outside_package(a.out)
    out.write_text("globalThis.vcLayers = " + json.dumps(data) + ";\n" + Path(a.topic).read_text(encoding="utf-8"), encoding="utf-8")
    print(json.dumps(dict(ok=True, out=str(out), kb=round(out.stat().st_size / 1024))))


if __name__ == "__main__":
    main()
