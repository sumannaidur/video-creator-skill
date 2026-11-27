import bpy, sys
from mathutils import Vector
A = sys.argv[sys.argv.index("--") + 1]
for name in ["coastal_cliff_01/coastal_cliff_01_1k.gltf", "ship_pinnace/ship_pinnace_1k.gltf"]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=A + "/" + name)
    pts = [o.matrix_world @ Vector(c) for o in bpy.data.objects if o.type == "MESH" for c in o.bound_box]
    lo = [min(p[i] for p in pts) for i in range(3)]; hi = [max(p[i] for p in pts) for i in range(3)]
    print("PROBE", name, "objects", len([o for o in bpy.data.objects if o.type == "MESH"]), "min", [round(v, 2) for v in lo], "max", [round(v, 2) for v in hi], "tris~", sum(len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH"))
