# E42 induction hob: original procedural Blender scene for scripts/blender_layers.py (no external assets).
# Layers (one perspective camera): base = granite counter + black glass-ceramic hob + brushed-steel pan;
# under = the hob with tinted see-through glass revealing the copper coil and ferrite bars (+ pan, + counter);
# hot = the pan alone with a glowing base. GEOMETRY: projected coil ring, pan base, eddy rings, field loops (image fractions).
import math
import bmesh
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.view_settings.view_transform = "AgX"
try: sc.view_settings.look = "AgX - Medium High Contrast"
except TypeError: pass
if hasattr(sc.eevee, "use_raytracing"): sc.eevee.use_raytracing = True

def mat(name, color, rough=.4, metal=0., emit=None, emit_strength=0., alpha=1., aniso=0.):
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if aniso and "Anisotropic" in b.inputs: b.inputs["Anisotropic"].default_value = aniso
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = emit_strength
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        if hasattr(m, "surface_render_method"): m.surface_render_method = "BLENDED"
    return m

def obj_from_bm(name, bm, m):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); sc.collection.objects.link(o)
    o.data.materials.append(m); [setattr(p, "use_smooth", True) for p in o.data.polygons]; return o

def revolve(name, profile, m, seg=96):
    """Surface of revolution about +Z from a (r, z) polyline."""
    bm = bmesh.new(); rings = []
    for k in range(seg):
        a = k / seg * 2 * math.pi; rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in profile])
    for k in range(seg):
        A, B = rings[k], rings[(k + 1) % seg]
        for i in range(len(profile) - 1): bm.faces.new((A[i], A[i + 1], B[i + 1], B[i]))
    return obj_from_bm(name, bm, m)

# ---------- materials ----------
granite = bpy.data.materials.new("granite")
gn, gl = granite.node_tree.nodes, granite.node_tree.links; gb = gn["Principled BSDF"]
noise = gn.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 140; noise.inputs["Detail"].default_value = 6
ramp = gn.new("ShaderNodeValToRGB"); ramp.color_ramp.elements[0].color = (.012, .012, .014, 1); ramp.color_ramp.elements[1].color = (.09, .085, .08, 1); ramp.color_ramp.elements[0].position = .55
gl.new(noise.outputs["Fac"], ramp.inputs["Fac"]); gl.new(ramp.outputs["Color"], gb.inputs["Base Color"]); gb.inputs["Roughness"].default_value = .32
glass = mat("ceramic", (.008, .008, .01), rough=.06)
ghost = mat("ceramic-ghost", (.02, .025, .03), rough=.05, alpha=.32)
steel = mat("steel", (.62, .62, .64), rough=.22, metal=1, aniso=.6)
steel_dark = mat("steel-dark", (.32, .32, .34), rough=.3, metal=1)
copper = mat("copper", (.85, .42, .22), rough=.28, metal=1)
ferrite = mat("ferrite", (.05, .05, .055), rough=.55)
tray = mat("tray", (.18, .19, .2), rough=.45, metal=.6)
mark = mat("mark", (.55, .55, .55), rough=.4)
hot = mat("pan-hot", (.62, .62, .64), rough=.22, metal=1)                                   # emission ramps up toward the base
hn, hl = hot.node_tree.nodes, hot.node_tree.links; hb = hn["Principled BSDF"]
tco = hn.new("ShaderNodeTexCoord"); sep = hn.new("ShaderNodeSeparateXYZ"); mr = hn.new("ShaderNodeMapRange")
mr.inputs["From Min"].default_value = .0; mr.inputs["From Max"].default_value = .03; mr.inputs["To Min"].default_value = 5; mr.inputs["To Max"].default_value = 0
hl.new(tco.outputs["Object"], sep.inputs["Vector"]); hl.new(sep.outputs["Z"], mr.inputs["Value"]); hl.new(mr.outputs["Result"], hb.inputs["Emission Strength"])
hb.inputs["Emission Color"].default_value = (1, .32, .06, 1)

# ---------- counter and hob (units: metres; glass top at z = 0) ----------
bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, -.0005)); counter = bpy.context.object; counter.data.materials.append(granite)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -.003)); hob = bpy.context.object; hob.scale = (.62, .54, .006); hob.data.materials.append(glass)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -.003)); hobg = bpy.context.object; hobg.scale = (.62, .54, .006); hobg.data.materials.append(ghost)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -.062)); trayo = bpy.context.object; trayo.scale = (.6, .52, .07); trayo.data.materials.append(tray)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -.024)); hole = bpy.context.object; hole.scale = (.6, .52, .001); hole.data.materials.append(mat("void", (.004, .004, .005), rough=.8))
# printed zone ring on the glass (top surface, both glass versions)
ring = revolve("zone", [(.118, .0002), (.122, .0002)], mark)
# copper coil: flat spiral of round wire under the glass
turns, r0, r1, zc = 15, .018, .1, -.008
pts = [Vector((r * math.cos(a), r * math.sin(a), zc)) for i in range(turns * 64 + 1) for a, r in [(i / 64 * 2 * math.pi, r0 + (r1 - r0) * i / (turns * 64))]]
cd = bpy.data.curves.new("coil", "CURVE"); cd.dimensions = "3D"; cd.bevel_depth = .0026; cd.bevel_resolution = 3
sp = cd.splines.new("POLY"); sp.points.add(len(pts) - 1)
for p, v in zip(sp.points, pts): p.co = (*v, 1)
coil = bpy.data.objects.new("coil", cd); sc.collection.objects.link(coil); cd.materials.append(copper)
bars = []
for k in range(8):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(math.cos(k * math.pi / 4) * .06, math.sin(k * math.pi / 4) * .06, -.016)); b = bpy.context.object
    b.scale = (.085, .014, .006); b.rotation_euler[2] = k * math.pi / 4; b.data.materials.append(ferrite); bars.append(b)
# pan: steel shell (base r 0.1, wall to r 0.125 at 0.07), thick base, rolled rim, tubular handle
prof = [(1e-4, .0005), (.1, .0005), (.106, .004), (.112, .02), (.12, .055), (.126, .07), (.129, .072), (.126, .074), (.12, .058), (.112, .024), (.104, .008), (.098, .0065), (1e-4, .0065)]
pan = revolve("pan", prof, steel); pan.location = (0, 0, .0002)
pang = revolve("pan-ghost", prof, mat("steel-ghost", (.62, .62, .64), rough=.22, metal=1, alpha=.28)); pang.location = (0, 0, .0002)
panh = revolve("pan-hot", prof, hot); panh.location = (0, 0, .0002)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=.011, depth=.19, location=(.215, .105, .068), rotation=(0, math.radians(84), math.radians(27))); handle = bpy.context.object; handle.data.materials.append(steel_dark)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=.011, depth=.19, location=(.215, .105, .068), rotation=(0, math.radians(84), math.radians(27))); handleh = bpy.context.object; handleh.data.materials.append(steel_dark)

# ---------- lights and camera ----------
def area(name, loc, rot, size, energy, color=(1, 1, 1)):
    l = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA")); l.data.size = size; l.data.energy = energy; l.data.color = color
    l.location = loc; l.rotation_euler = rot; sc.collection.objects.link(l); return l
area("key", (-.45, -.25, .75), (math.radians(35), math.radians(-28), 0), .9, 26, (1, .96, .9))
area("rim", (.35, .55, .4), (math.radians(-60), math.radians(30), 0), .6, 16, (.75, .85, 1))
area("fill", (.0, -.9, .25), (math.radians(78), 0, 0), 1.2, 4, (.9, .95, 1))
world = bpy.data.worlds.new("w"); sc.world = world; world.node_tree.nodes["Background"].inputs["Color"].default_value = (.012, .013, .016, 1)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 50; cam.data.sensor_fit = "VERTICAL"; cam.data.sensor_height = 24
cam.location = (0, -1.02, .8); cam.rotation_euler = (math.radians(52), 0, 0)               # looking down at about 38 degrees

LAYERS = {"base": [counter, hob, ring, pan, handle], "under": [counter, hobg, trayo, hole, coil, *bars, pang, handle], "hot": [panh, handleh]}

# ---------- geometry for the SVG overlays (image fractions, y down) ----------
bpy.context.view_layer.update()
sc.render.resolution_x, sc.render.resolution_y = W, H
P = lambda v: [round(world_to_camera_view(sc, cam, Vector(v)).x, 4), round(1 - world_to_camera_view(sc, cam, Vector(v)).y, 4)]
circ = (lambda r, z, n=72: [P((r * math.cos(a), r * math.sin(a), z)) for a in [k / n * 2 * math.pi for k in range(n + 1)]])
right = Vector((1, 0, 0))                                                                # field plane: x-z, facing the camera
loops = []
for i in range(4):
    cx, a, b = .085 + .012 * i, .07 + .016 * i, .045 + .022 * i
    for s in (1, -1):
        loops.append([P((s * (cx + a * math.cos(t)), 0, -.012 + b * math.sin(t))) for t in [k / 64 * 2 * math.pi for k in range(65)]])
GEOMETRY = {"coil": circ(.1, zc), "coilInner": circ(.02, zc), "panBase": circ(.1, .003), "eddy": [circ(r, .0035) for r in (.03, .055, .08)],
            "field": loops, "panTop": P((0, 0, .075)), "panBaseCentre": P((0, 0, .003)), "glassFront": P((0, -.2, 0)), "coilCentre": P((0, 0, zc)),
            "panBox": [P((-.13, 0, .075))[0], P((0, .13, .075))[1], P((.13, 0, .075))[0], P((0, -.13, 0))[1]]}
