"""E41 / P024.16A hero keyframe: lighthouse headland at twilight, Blender EEVEE, 540x960.
CC0 Poly Haven assets (experiments/E41/assets, provenance.json): the_sky_is_on_fire (HDRI), coastal_cliff_01, ship_pinnace.
The lighthouse, lantern, lamp, beam and ocean are procedural geometry/materials written here. Placement is solved from
the camera's field of view (not by eye) and verified by projecting the ship and lantern into the frame.
Usage: blender -b --factory-startup --python hero_scene.py -- <assets dir> <out.png> <metrics.json>
"""
import bpy, sys, math, json, time
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ASSETS, OUT, METRICS = sys.argv[sys.argv.index("--") + 1:][:3]
t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
try: sc.render.engine = "BLENDER_EEVEE"
except TypeError: sc.render.engine = "BLENDER_EEVEE_NEXT"
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 540, 960, 100
sc.eevee.taa_render_samples = 64
for attr, val in (("use_raytracing", True), ("use_shadows", True)):
    if hasattr(sc.eevee, attr): setattr(sc.eevee, attr, val)
sc.view_settings.view_transform = "AgX"
try: sc.view_settings.look = "AgX - Medium High Contrast"
except TypeError: pass

def mat(name, color=(1, 1, 1, 1), rough=.5, metal=0., emit=None, emit_strength=0., alpha=1., transmission=0.):
    m = bpy.data.materials.new(name)
    try: m.use_nodes = True
    except Exception: pass
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color; b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if emit: b.inputs["Emission Color"].default_value = emit; b.inputs["Emission Strength"].default_value = emit_strength
    if transmission: b.inputs["Transmission Weight"].default_value = transmission
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        if hasattr(m, "surface_render_method"): m.surface_render_method = "BLENDED"
    return m

def link(obj, m): obj.data.materials.clear(); obj.data.materials.append(m); return obj

# ---------- camera (portrait, vertical sensor fit) ----------
cam_data = bpy.data.cameras.new("cam"); cam_data.sensor_fit = "VERTICAL"; cam_data.sensor_height = 36; cam_data.lens = 35
cam = bpy.data.objects.new("cam", cam_data); sc.collection.objects.link(cam); sc.camera = cam
PITCH = 2.0
cam.location = (0, 0, 4); cam.rotation_euler = (math.radians(90 + PITCH), 0, 0)      # looking along +y, slightly up
half_v = math.atan(18 / 35); half_h = math.atan(math.tan(half_v) * 540 / 960)
def place(ndc_x, ndc_y, depth):
    """World point on the plane at `depth` along the view that projects to normalised screen (x, y in -1..1, y up)."""
    d = Vector((ndc_x * math.tan(half_h), ndc_y * math.tan(half_v), -1)) * depth   # camera space (looking down -z)
    return cam.matrix_world @ d if False else (cam.rotation_euler.to_matrix() @ d) + Vector(cam.location)

# ---------- world: HDRI, sunset glow placed behind-left ----------
world = bpy.data.worlds.new("w"); sc.world = world
try: world.use_nodes = True
except Exception: pass
nt = world.node_tree; nt.nodes.clear()
env = nt.nodes.new("ShaderNodeTexEnvironment"); env.image = bpy.data.images.load(ASSETS + "/the_sky_is_on_fire/the_sky_is_on_fire_2k.hdr")
mp = nt.nodes.new("ShaderNodeMapping"); tc = nt.nodes.new("ShaderNodeTexCoord"); bg = nt.nodes.new("ShaderNodeBackground"); out = nt.nodes.new("ShaderNodeOutputWorld")
nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], env.inputs["Vector"]); nt.links.new(env.outputs["Color"], bg.inputs["Color"]); nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
bg.inputs["Strength"].default_value = 1.0
img = env.image; W, H = img.size; px = img.pixels[:]                                   # brightest column above the horizon
cols = [0.] * W
for y in range(H // 2, int(H * .62)):
    row = y * W * 4
    for x in range(0, W, 4): cols[x] += px[row + x * 4] + px[row + x * 4 + 1]
bright = max(range(0, W, 4), key=lambda x: cols[x]); u = bright / W
SUN_AZ = math.radians(-28)                                                              # target: 28 deg left of the view axis
# equirect u maps to azimuth phi = (u - .5) * 2pi around +x (Blender: u=.5 faces -x? measured, not assumed: rotate so u lands on +y-28deg)
phi_bright = (u - .5) * 2 * math.pi
mp.inputs["Rotation"].default_value[2] = (math.pi / 2 + SUN_AZ) - phi_bright + math.pi
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sc.collection.objects.link(sun)
sun.data.energy = 2.2; sun.data.color = (1.0, .62, .38); sun.data.angle = math.radians(3)
sun.rotation_euler = (math.radians(84), 0, math.radians(180) + SUN_AZ)                 # low sun, behind-left: rim light on tower and sails

# ---------- ocean ----------
bpy.ops.mesh.primitive_plane_add(size=4000, location=(0, 1500, 0)); sea = bpy.context.object
m_sea = mat("sea", (.012, .04, .065, 1), rough=.06)
n = m_sea.node_tree.nodes; l = m_sea.node_tree.links
noise = n.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 1.8; noise.inputs["Detail"].default_value = 10
wave = n.new("ShaderNodeTexWave"); wave.inputs["Scale"].default_value = .35; wave.inputs["Distortion"].default_value = 6
add = n.new("ShaderNodeMath"); add.operation = "ADD"; bump = n.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = .22; bump.inputs["Distance"].default_value = .4
l.new(noise.outputs["Fac"], add.inputs[0]); l.new(wave.outputs["Fac"], add.inputs[1]); l.new(add.outputs["Value"], bump.inputs["Height"]); l.new(bump.outputs["Normal"], n["Principled BSDF"].inputs["Normal"])
link(sea, m_sea)

# ---------- cliff (scanned), turned to face the camera, its left end forming the headland ----------
bpy.ops.import_scene.gltf(filepath=ASSETS + "/coastal_cliff_01/coastal_cliff_01_1k.gltf")
cliff = [o for o in bpy.context.selected_objects if o.type == "MESH"][0]
mw = cliff.matrix_world; ny = sum((mw.to_3x3() @ p.normal).y * p.area for p in cliff.data.polygons)
cliff.rotation_euler[2] += math.pi if ny > 0 else 0                                     # face (mean normal) toward -y, the camera
S = 1.65; cliff.scale = (S, S, S); bpy.context.view_layer.update()
D1 = 140.0
bb = [cliff.matrix_world @ Vector(c) for c in cliff.bound_box]
xmin, yc, zmin = min(p.x for p in bb), sum(p.y for p in bb) / 8, min(p.z for p in bb)
cliff.location += Vector((-5 - xmin, D1 - yc, -zmin - .8)); bpy.context.view_layer.update()

# ---------- lighthouse on the cliff top near the headland ----------
LX = place(.38, 0, D1).x
dg = bpy.context.evaluated_depsgraph_get()
hit, loc, *_ = sc.ray_cast(dg, Vector((LX, D1, 300)), Vector((0, 0, -1)))
base = loc.z if hit else max(p.z for p in bb)
white = mat("plaster", (.82, .8, .76, 1), rough=.62); red = mat("red", (.42, .05, .04, 1), rough=.5)
iron = mat("iron", (.03, .035, .04, 1), rough=.35, metal=.85); roofm = mat("roof", (.12, .03, .025, 1), rough=.35, metal=.6)
glass = mat("glass", (.75, .85, .9, 1), rough=.02, alpha=.18)
lampm = mat("lamp", (1, .85, .55, 1), emit=(1, .78, .45, 1), emit_strength=60)
halo = mat("halo", (1, .8, .5, 1), emit=(1, .75, .4, 1), emit_strength=6, alpha=.12)
TH = 15.0
def cone(r1, r2, h, z, m, verts=48, x=LX, y=D1):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=h, location=(x, y, z + h / 2)); o = bpy.context.object
    bpy.ops.object.shade_smooth(); return link(o, m)
cone(2.4, 2.6, 1.2, base - .6, iron)                                                    # plinth
cone(2.2, 1.55, TH, base, white)
cone(2.2 - .65 * .34 + .03, 2.2 - .65 * .58 + .03, TH * .24, base + TH * .34, red)       # red band (follows the taper)
cone(2.3, 2.3, .28, base + TH, iron)                                                    # gallery deck
bpy.ops.mesh.primitive_torus_add(major_radius=2.15, minor_radius=.05, location=(LX, D1, base + TH + 1.0)); link(bpy.context.object, iron)
for k in range(16):
    a = k / 16 * 2 * math.pi; cone(.035, .035, 1.0, base + TH + .28, iron, verts=8, x=LX + math.cos(a) * 2.15, y=D1 + math.sin(a) * 2.15)
cone(1.3, 1.3, .5, base + TH + .28, iron)                                               # lantern plinth
LZ = base + TH + .78
cone(1.25, 1.25, 2.3, LZ, glass)
for k in range(10):
    a = k / 10 * 2 * math.pi; cone(.04, .04, 2.3, LZ, iron, verts=8, x=LX + math.cos(a) * 1.26, y=D1 + math.sin(a) * 1.26)
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.4, location=(LX, D1, LZ + 2.3), segments=48, ring_count=24); dome = bpy.context.object
bpy.ops.object.shade_smooth(); dome.scale = (1, 1, .75); link(dome, roofm)
bpy.ops.mesh.primitive_uv_sphere_add(radius=.22, location=(LX, D1, LZ + 3.45)); link(bpy.context.object, iron)
for k in range(5):                                                                      # small windows up the tower
    z = base + 2.5 + k * 2.6; r = 2.2 - .65 * (z - base) / TH
    bpy.ops.mesh.primitive_cube_add(size=1, location=(LX, D1 - r + .02, z)); w = bpy.context.object; w.scale = (.32, .1, .55); link(w, mat(f"win{k}", (.02, .02, .025, 1), rough=.2))
LAMP = Vector((LX, D1, LZ + 1.15))
bpy.ops.mesh.primitive_uv_sphere_add(radius=.38, location=LAMP); link(bpy.context.object, lampm)
bpy.ops.mesh.primitive_uv_sphere_add(radius=2.6, location=LAMP); link(bpy.context.object, halo)
pl = bpy.data.objects.new("lamp", bpy.data.lights.new("lamp", "POINT")); pl.data.energy = 9000; pl.data.color = (1, .78, .5); pl.data.shadow_soft_size = .3; pl.location = LAMP; sc.collection.objects.link(pl)

# ---------- ship (scanned/modelled CC0), solved into the left third on the water ----------
bpy.ops.import_scene.gltf(filepath=ASSETS + "/ship_pinnace/ship_pinnace_1k.gltf")
ship_objs = [o for o in bpy.context.selected_objects]
root = [o for o in ship_objs if o.parent is None]
ship = bpy.data.objects.new("ship-root", None); sc.collection.objects.link(ship)
for o in root: o.parent = ship
D2 = 235.0
sp = place(-.5, 0, D2); ship.location = (sp.x, sp.y, 0); ship.rotation_euler = (0, 0, math.radians(62))
bpy.context.view_layer.update()

# ---------- beam: soft cone from the lamp toward the ship's side of the frame ----------
target = Vector((sp.x + 40, sp.y - 60, 6)); dvec = target - LAMP; L = dvec.length
bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=.4, radius2=24, depth=L, end_fill_type="NOTHING", location=LAMP + dvec / 2)
beam = bpy.context.object; beam.rotation_mode = "QUATERNION"; beam.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(-dvec.normalized())
mb = bpy.data.materials.new("beam")
try: mb.use_nodes = True
except Exception: pass
bn, bl = mb.node_tree.nodes, mb.node_tree.links; bn.clear()
em = bn.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (1, .82, .55, 1); em.inputs["Strength"].default_value = 2.2
tr = bn.new("ShaderNodeBsdfTransparent"); mix = bn.new("ShaderNodeMixShader"); lw = bn.new("ShaderNodeLayerWeight"); lw.inputs["Blend"].default_value = .55
gr = bn.new("ShaderNodeTexGradient"); tco = bn.new("ShaderNodeTexCoord"); sep = bn.new("ShaderNodeSeparateXYZ")
fade = bn.new("ShaderNodeMath"); fade.operation = "MULTIPLY"; k2 = bn.new("ShaderNodeMath"); k2.operation = "MULTIPLY"; k2.inputs[1].default_value = .55
inv = bn.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1
o2 = bn.new("ShaderNodeOutputMaterial")
bl.new(tco.outputs["Generated"], sep.inputs["Vector"]); bl.new(sep.outputs["Z"], fade.inputs[0])                # z: 0 at the wide end .. 1 at the lamp
bl.new(lw.outputs["Facing"], inv.inputs[1]); bl.new(inv.outputs["Value"], fade.inputs[1]); bl.new(fade.outputs["Value"], k2.inputs[0])
bl.new(k2.outputs["Value"], mix.inputs["Fac"]); bl.new(tr.outputs[0], mix.inputs[1]); bl.new(em.outputs[0], mix.inputs[2]); bl.new(mix.outputs[0], o2.inputs["Surface"])
if hasattr(mb, "surface_render_method"): mb.surface_render_method = "BLENDED"
link(beam, mb)

# ---------- verify framing by projection, render, record ----------
bpy.context.view_layer.update()
def frame_box(objs):
    pts = [world_to_camera_view(sc, cam, o.matrix_world @ Vector(c)) for o in objs if o.type == "MESH" for c in o.bound_box]
    return [round(min(p.x for p in pts), 3), round(min(1 - p.y for p in pts), 3), round(max(p.x for p in pts), 3), round(max(1 - p.y for p in pts), 3)]
metrics = {"ship_box_xy_top_left": frame_box([o for o in ship_objs]), "lamp_screen": [round(v, 3) for v in world_to_camera_view(sc, cam, LAMP)[:2]],
           "horizon_from_top": round(.5 + math.tan(math.radians(PITCH)) / math.tan(half_v) / 2, 3), "hdri_bright_u": round(u, 3), "cliff_turned": ny > 0,
           "lighthouse_base_z": round(base, 2), "setup_seconds": round(time.time() - t0, 2)}
sb = metrics["ship_box_xy_top_left"]; metrics["ship_fully_in_frame"] = sb[0] >= 0 and sb[2] <= 1 and sb[1] >= 0 and sb[3] <= 1
sc.render.filepath = OUT; sc.render.image_settings.file_format = "PNG"
t1 = time.time(); bpy.ops.render.render(write_still=True); metrics["render_seconds"] = round(time.time() - t1, 2)
metrics["engine"] = sc.render.engine; metrics["blender"] = bpy.app.version_string
json.dump(metrics, open(METRICS, "w"), indent=1); print("METRICS", json.dumps(metrics))
