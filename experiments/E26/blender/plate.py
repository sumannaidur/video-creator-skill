"""E26 (P023.6) static Blender layers for a Tech Explainer: an open 3.5-inch hard drive, top-down orthographic, so the
engine can rotate the hub and the actuator arm exactly in 2D. Procedural geometry and materials only (no assets).
blender -b --factory-startup --python plate.py -- OUT_DIR WIDTH HEIGHT
Writes base.png (opaque), hub.png and arm.png (transparent), and geometry.json (pivot and centres as image fractions).
Units: millimetres. Chassis 101.6 x 147 (3.5-inch form factor), platter 95 mm.
"""
import json, math, os, sys, time
import bpy
from mathutils import Vector

out, W, H = sys.argv[sys.argv.index("--") + 1:][:3]
W, H = int(W), int(H)
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.eevee.taa_render_samples = 48
for a, v in (("use_raytracing", True), ("use_shadows", True)):
    try: setattr(sc.eevee, a, v)
    except Exception: pass
try: sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
except Exception: pass
sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.022, 0.028, 1)
sc.world.node_tree.nodes["Background"].inputs[1].default_value = .6
# world seen straight up is what the mirror platter reflects: a soft diagonal studio gradient toward the zenith
wn = sc.world.node_tree; wt = wn.nodes.new("ShaderNodeTexCoord"); ws = wn.nodes.new("ShaderNodeSeparateXYZ"); wm = wn.nodes.new("ShaderNodeMath"); wr = wn.nodes.new("ShaderNodeValToRGB")
wm.operation = "MULTIPLY_ADD"; wm.inputs[1].default_value = .55; wn.links.new(wt.outputs["Generated"], ws.inputs[0]); wn.links.new(ws.outputs["Z"], wm.inputs[0]); wn.links.new(ws.outputs["X"], wm.inputs[2])
wr.color_ramp.elements[0].position = .3; wr.color_ramp.elements[0].color = (.015, .018, .025, 1); wr.color_ramp.elements[1].position = .95; wr.color_ramp.elements[1].color = (.55, .6, .7, 1)
wn.links.new(wm.outputs[0], wr.inputs[0]); wn.links.new(wr.outputs[0], wn.nodes["Background"].inputs[0])

def mat(name, col, rough, metal=0.0, aniso=0.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    b.inputs["Anisotropic"].default_value = aniso; b.inputs["Coat Weight"].default_value = coat
    return m
ALU = mat("brushed-alu", (.72, .73, .75), .34, 1, .6)
CAST = mat("cast-alu", (.55, .56, .58), .55, 1)
PLATTER = mat("platter", (.86, .87, .9), .045, 1)
STEEL = mat("steel", (.78, .79, .82), .18, 1)
DARK = mat("black-anodised", (.03, .032, .036), .38, 1)
COPPER = mat("copper-coil", (.62, .32, .16), .3, 1)
FLOOR = mat("studio-floor", (.05, .055, .065), .5, 0, 0, .3)

def add(op, m, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, seg=6, **kw):
    op(location=loc, rotation=rot, **kw); o = bpy.context.active_object
    o.data.materials.append(m)
    if bevel:
        b = o.modifiers.new("b", "BEVEL"); b.width, b.segments = bevel, seg
    bpy.ops.object.shade_smooth(); return o
def box(m, size, loc, bevel=1.0, seg=6):
    o = add(bpy.ops.mesh.primitive_cube_add, m, loc=loc, size=1); o.scale = size       # scale first, then bevel in mm
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        b = o.modifiers.new("b", "BEVEL"); b.width, b.segments = bevel, seg
    return o
def cyl(m, r, d, loc, bevel=.4, v=96):
    return add(bpy.ops.mesh.primitive_cylinder_add, m, loc=loc, bevel=bevel, radius=r, depth=d, vertices=v)

layers = {"base": [], "hub": [], "arm": []}
# studio floor + chassis (cast frame with a recessed bay), perimeter screws
layers["base"].append(box(FLOOR, (600, 900, 2), (0, 0, -6), 0))
layers["base"].append(box(CAST, (101.6, 147, 6), (0, 0, 0), 2.5))
layers["base"].append(box(ALU, (95, 140, 2), (0, 0, 3.2), 1.2))
for x, y in ((-46, -68), (46, -68), (-46, 68), (46, 68), (-46, 0), (46, 0)):
    layers["base"].append(cyl(DARK, 2.2, 1.4, (x, y, 4.6), .3, 32))
PC = (0, 16)                                    # platter centre
layers["base"].append(cyl(PLATTER, 47.5, 1.2, (*PC, 5.0), .5, 192))
# voice-coil magnet block and parking ramp (static)
PV = (33, -46)                                  # actuator pivot
layers["base"].append(box(DARK, (30, 22, 4), (PV[0] + 4, PV[1] - 14, 5.2), 2.5))
layers["base"].append(box(DARK, (6, 14, 3), (44, -10, 5.4), .8))
# hub layer: spindle clamp with six screws (rotates)
layers["hub"] += [cyl(STEEL, 13.5, 1.6, (*PC, 6.2), .6, 128), cyl(STEEL, 5, 2.0, (*PC, 7.0), .4, 64)]
for i in range(6):
    a = i / 6 * math.tau
    layers["hub"].append(cyl(DARK, 1.6, 1.2, (PC[0] + math.cos(a) * 9.2, PC[1] + math.sin(a) * 9.2, 7.4), .2, 24))
# arm layer (rest angle: head at the outer track), pivot bearing, coil, tapered arm, slider at the tip
L = 58.0
rest = math.atan2(PC[1] + 41 - PV[1], PC[0] + 8 - PV[0])                      # aims the tip near the outer track
layers["arm"] += [cyl(STEEL, 6.5, 3.2, (*PV, 7.6), .6, 64), cyl(DARK, 2.4, 3.6, (*PV, 8.6), .3, 32)]
ux, uy = math.cos(rest), math.sin(rest)
mid = (PV[0] + ux * L * .5, PV[1] + uy * L * .5)
arm = box(ALU, (L, 7, 1.0), (*mid, 7.0), .8); arm.rotation_euler = (0, 0, rest); layers["arm"].append(arm)
coil = box(COPPER, (14, 16, 2.4), (PV[0] - ux * 10, PV[1] - uy * 10, 6.8), 2.0); coil.rotation_euler = (0, 0, rest); layers["arm"].append(coil)
tip = (PV[0] + ux * L, PV[1] + uy * L)
slider = box(DARK, (3.2, 2.4, 1.0), (*tip, 6.3), .3); slider.rotation_euler = (0, 0, rest); layers["arm"].append(slider)
# lights: soft key from top-left, cool rim, warm fill
def light(name, kind, loc, energy, col, size=None):
    d = bpy.data.lights.new(name, kind); d.energy, d.color = energy, col
    if size: d.size = size
    o = bpy.data.objects.new(name, d); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler(); return o
light("key", "AREA", (-120, 120, 260), 1.1e6, (1, .97, .92), 160)
light("rim", "AREA", (160, -60, 120), 4.0e5, (.6, .75, 1), 120)
light("fill", "AREA", (40, -200, 220), 2.5e5, (1, .85, .7), 200)
# softbox above the camera: what a mirror platter reflects when seen from directly above (a soft diagonal gradient)
sb = bpy.data.materials.new("softbox"); sb.use_nodes = True; nt = sb.node_tree; nt.nodes.remove(nt.nodes["Principled BSDF"])
em = nt.nodes.new("ShaderNodeEmission"); gr = nt.nodes.new("ShaderNodeTexGradient"); tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping")
mp.inputs["Rotation"].default_value = (0, 0, math.radians(35)); rp = nt.nodes.new("ShaderNodeValToRGB")
rp.color_ramp.elements[0].color = (.02, .025, .035, 1); rp.color_ramp.elements[1].position = .55; rp.color_ramp.elements[1].color = (.9, .93, 1, 1)
nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"]); nt.links.new(mp.outputs[0], gr.inputs["Vector"]); nt.links.new(gr.outputs[0], rp.inputs[0])
nt.links.new(rp.outputs[0], em.inputs["Color"]); em.inputs["Strength"].default_value = 1.4; nt.links.new(em.outputs[0], nt.nodes["Material Output"].inputs["Surface"])
bpy.ops.mesh.primitive_plane_add(size=900, location=(0, -18, 600)); bpy.context.active_object.data.materials.append(sb)
bpy.context.active_object.visible_camera = False
# orthographic top-down camera, chassis slightly above frame centre (captions sit low)
cd = bpy.data.cameras.new("cam"); cd.type = "ORTHO"; cd.ortho_scale = 231.1; cd.clip_start, cd.clip_end = 1, 1000
cam = bpy.data.objects.new("cam", cd); sc.collection.objects.link(cam); cam.location = (0, -18, 400); sc.camera = cam
FW, FH, CX, CY = 130.0, 231.1, 0.0, -18.0
frac = lambda x, y: [round((x - CX + FW / 2) / FW, 5), round(1 - (y - CY + FH / 2) / FH, 5)]
times = {}
for name, objs in layers.items():
    for n, os_ in layers.items():
        for o in os_: o.hide_render = n != name
    sc.render.film_transparent = name != "base"
    sc.render.image_settings.color_mode = "RGB" if name == "base" else "RGBA"
    sc.render.filepath = os.path.join(out, f"{name}.png")
    t = time.perf_counter(); bpy.ops.render.render(write_still=True); times[name] = round(time.perf_counter() - t, 2)
geo = {"size": [W, H], "platter": frac(*PC), "platterR": round(47.5 / FW, 5), "pivot": frac(*PV), "armLen": round(L / FW, 5), "restDeg": round(math.degrees(rest), 3),
       "frameMm": [FW, FH], "renderSeconds": times}
json.dump(geo, open(os.path.join(out, "geometry.json"), "w"), indent=1); print("GEO", json.dumps(geo))
