"""Runs inside headless Blender (started by scripts/blender_layers.py). Executes an agent-authored scene script that builds
the scene, sets scene.camera and lights, and defines LAYERS = {"name": [objects]} (first layer opaque, the others
transparent) and optionally GEOMETRY = {...} (numbers the topic needs, for example pivots as image fractions). Renders each
layer with only its objects visible and writes <name>.png plus layers.json (sizes, geometry, timings, Blender version)."""
import json
import os
import sys
import time

import bpy

scene_file, out, W, H, samples = sys.argv[sys.argv.index("--") + 1:][:5]
W, H, samples = int(W), int(H), int(samples)
ns = {"__name__": "__vc_scene__", "bpy": bpy, "W": W, "H": H}
with open(scene_file, encoding="utf-8") as fh:
    exec(compile(fh.read(), scene_file, "exec"), ns)
layers, geometry = ns.get("LAYERS"), ns.get("GEOMETRY", {})
if not isinstance(layers, dict) or not layers:
    raise SystemExit("[blender-layers] the scene script must define LAYERS = {'name': [objects]}")
sc = bpy.context.scene
if sc.camera is None:
    raise SystemExit("[blender-layers] the scene script must set scene.camera")
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
if sc.render.engine not in ("BLENDER_EEVEE", "CYCLES"):
    sc.render.engine = "BLENDER_EEVEE"
try:
    sc.eevee.taa_render_samples = samples
except Exception:
    pass
names, times = list(layers), {}
everything = {o for objs in layers.values() for o in objs}
for i, name in enumerate(names):
    for o in everything:
        o.hide_render = o not in layers[name]
    sc.render.film_transparent = i > 0
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB" if i == 0 else "RGBA"
    sc.render.filepath = os.path.join(out, f"{name}.png")
    t = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    times[name] = round(time.perf_counter() - t, 2)
with open(os.path.join(out, "layers.json"), "w") as fh:
    json.dump({"layers": names, "size": [W, H], "geometry": geometry, "renderSeconds": times, "blender": bpy.app.version_string, "engine": sc.render.engine}, fh, indent=1)
print("VC-LAYERS-DONE", json.dumps(times))
