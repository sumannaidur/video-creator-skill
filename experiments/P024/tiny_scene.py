import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.mesh.primitive_cube_add(size=2); base = bpy.context.active_object
bpy.ops.mesh.primitive_uv_sphere_add(radius=.7, location=(0, 0, 1.6)); part = bpy.context.active_object
ld = bpy.data.lights.new("k", "SUN"); lo = bpy.data.objects.new("k", ld); sc.collection.objects.link(lo); lo.rotation_euler = (.6, .2, .4)
cd = bpy.data.cameras.new("c"); cd.type = "ORTHO"; cd.ortho_scale = 8; cam = bpy.data.objects.new("c", cd); sc.collection.objects.link(cam); cam.location = (0, 0, 10); sc.camera = cam
LAYERS = {"base": [base], "part": [part]}
GEOMETRY = {"pivot": [0.5, 0.5]}
