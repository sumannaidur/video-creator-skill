"""E19 / P022.1 - Blender cinematic hero shot: the E18 night-desk 'send' beat, rebuilt as a lit 3D product shot.

Agent-authored, fully procedural (no external assets): geometry, materials, lights, camera and motion are built here.
Telugu UI text comes from browser-rendered textures (../textures, made by make-textures.mjs).

Usage (headless):
  blender -b --factory-startup --python scene.py -- --out DIR --res 540x960 --frames 27-34 [--samples 32] [--tag NAME]
Frame f shows narration time t = f / 30 s (E18 timeline: send cue 2.4 s).
Writes DIR/<tag>-FFFF.png and DIR/<tag>-timing.json (init, per-frame render seconds).
"""
import json
import math
import os
import random
import sys
import time

T_START = time.perf_counter()
import bpy  # noqa: E402
from mathutils import Euler, Matrix, Quaternion, Vector  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "..", "textures")
FPS = 30
SEND = 2.4                       # E18 resolved-plan cue 'send' (seconds)


def parse():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    opt = {"out": os.path.join(HERE, "..", "out", "test"), "res": "540x960", "frames": "36", "samples": "32", "tag": "f"}
    for i in range(0, len(argv) - 1, 2):
        opt[argv[i].lstrip("-")] = argv[i + 1]
    frames = []
    for part in opt["frames"].split(","):
        a, _, b = part.partition("-")
        frames += list(range(int(a), int(b or a) + 1))
    w, h = map(int, opt["res"].split("x"))
    return opt["out"], w, h, frames, int(opt["samples"]), opt["tag"]


def tryset(obj, attr, value):
    try:
        setattr(obj, attr, value)
        return True
    except Exception:
        return False


# ---------------------------------------------------------------- easing (animation principles, deterministic)
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def smooth(p):
    p = clamp(p)
    return p * p * (3 - 2 * p)


def ease_in_out(p):
    p = clamp(p)
    return 4 * p ** 3 if p < .5 else 1 - (-2 * p + 2) ** 3 / 2


def ease_out_quart(p):
    return 1 - (1 - clamp(p)) ** 4


def ease_out_back(p, s=1.9):
    p = clamp(p) - 1
    return 1 + (s + 1) * p ** 3 + s * p ** 2


def spring(t, freq=2.6, damp=5.5):
    """Damped follow-through: 1 at t=0, decays with oscillation (overshoot then settle)."""
    return math.exp(-damp * t) * math.cos(2 * math.pi * freq * t) if t > 0 else 1.0


# ---------------------------------------------------------------- scene helpers
def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def node_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    return m, nt, out


def principled(name, color, rough=.5, metal=0.0, **extra):
    m, nt, out = node_mat(name)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    for k, v in extra.items():
        b.inputs[k].default_value = v
    nt.links.new(b.outputs[0], out.inputs["Surface"])
    return m, nt, b


def mix_rgba(nt):
    n = nt.nodes.new("ShaderNodeMix")
    n.data_type = "RGBA"
    a = [s for s in n.inputs if s.name == "A" and s.type == "RGBA"][0]
    b = [s for s in n.inputs if s.name == "B" and s.type == "RGBA"][0]
    o = [s for s in n.outputs if s.type == "RGBA"][0]
    return n, n.inputs[0], a, b, o


def obj(name, mesh_op, mat=None, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), parent=None, **kw):
    mesh_op(**kw)
    o = bpy.context.active_object
    o.name = name
    o.location, o.rotation_euler, o.scale = loc, rot, scale
    if mat:
        o.data.materials.append(mat)
    if parent:
        o.parent = parent
    return o


def apply_scale(o):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def rounded_box(name, size, corner, edge, mat, parent=None, loc=(0, 0, 0), axis="Y", seg=12):
    """Box with large rounded corners around `axis` (bevel weights) and a small eased edge on every edge."""
    o = obj(name, bpy.ops.mesh.primitive_cube_add, mat, loc=loc, parent=parent, size=1)
    o.scale = size
    apply_scale(o)
    me = o.data
    attr = me.attributes.get("bevel_weight_edge") or me.attributes.new("bevel_weight_edge", "FLOAT", "EDGE")
    idx = {"X": 0, "Y": 1, "Z": 2}[axis]
    for e in me.edges:
        a, b = (me.vertices[i].co for i in e.vertices)
        attr.data[e.index].value = 1.0 if abs(a[idx] - b[idx]) > 1e-6 else 0.0
    m1 = o.modifiers.new("corners", "BEVEL")
    m1.limit_method = "WEIGHT"
    m1.width, m1.segments = corner, seg
    if edge > 0:
        m2 = o.modifiers.new("edges", "BEVEL")
        m2.limit_method = "ANGLE"
        m2.width, m2.segments = edge, (8 if edge > .003 else 4)
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
    except Exception:
        bpy.ops.object.shade_smooth()
    return o


# ---------------------------------------------------------------- build
def build(w, h, samples):
    clear()
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, 100
    sc.render.fps = FPS
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    ee = sc.eevee
    ee.taa_render_samples = samples
    tryset(ee, "use_raytracing", True)
    tryset(ee, "use_shadows", True)
    tryset(ee, "volumetric_tile_size", "8")
    tryset(ee, "volumetric_samples", 48)
    tryset(ee, "volumetric_end", 3.0)
    tryset(ee, "use_volumetric_shadows", True)
    tryset(ee, "use_fast_gi", True)
    sc.render.use_motion_blur = True
    tryset(sc.render, "motion_blur_shutter", .45)
    vs = sc.view_settings
    tryset(vs, "view_transform", "AgX")
    for look in ("AgX - Medium High Contrast", "Medium High Contrast", "AgX - Base Contrast"):
        if tryset(vs, "look", look):
            break
    vs.exposure = 0.0

    # World: deep night blue, very low.
    world = bpy.data.worlds.new("night")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (0.010, 0.016, 0.035, 1)
    bg.inputs[1].default_value = 0.5

    # ---- materials
    wood_m, wnt, wb = principled("walnut", (0.2, 0.1, 0.05), rough=.38, **{"Coat Weight": .1, "Coat Roughness": .2})
    tc = wnt.nodes.new("ShaderNodeTexCoord")
    mp = wnt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (0.6, 9.0, 1.0)
    wave = wnt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 2.2
    wave.inputs["Distortion"].default_value = 3.0
    wave.inputs["Detail"].default_value = 4.0
    noise = wnt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 60.0
    ramp = wnt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.075, 0.032, 0.014, 1)
    ramp.color_ramp.elements[1].color = (0.17, 0.08, 0.035, 1)
    mixf = wnt.nodes.new("ShaderNodeMath")
    mixf.operation = "MULTIPLY_ADD"
    mixf.inputs[1].default_value = .85
    wnt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    wnt.links.new(mp.outputs[0], wave.inputs["Vector"])
    wnt.links.new(mp.outputs[0], noise.inputs["Vector"])
    wnt.links.new(wave.outputs["Fac"], mixf.inputs[0])
    wnt.links.new(noise.outputs["Fac"], mixf.inputs[2])
    wnt.links.new(mixf.outputs[0], ramp.inputs[0])
    wnt.links.new(ramp.outputs[0], wb.inputs["Base Color"])
    bump = wnt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = .08
    bump.inputs["Distance"].default_value = .0005
    wnt.links.new(wave.outputs["Fac"], bump.inputs["Height"])
    wnt.links.new(bump.outputs[0], wb.inputs["Normal"])
    rr = wnt.nodes.new("ShaderNodeMapRange")
    rr.inputs[3].default_value, rr.inputs[4].default_value = .30, .52
    wnt.links.new(noise.outputs["Fac"], rr.inputs[0])
    wnt.links.new(rr.outputs[0], wb.inputs["Roughness"])

    alu, _, alub = principled("graphite-titanium", (0.36, 0.37, 0.40), rough=.24, metal=1.0, **{"Anisotropic": .5})
    glass_black, _, _ = principled("black-glass", (0.004, 0.005, 0.006), rough=.06, **{"Coat Weight": 1.0, "Coat Roughness": .02})
    stand_m, _, _ = principled("stand-anodised", (0.05, 0.055, 0.06), rough=.42, metal=1.0)
    ceramic, _, _ = principled("terracotta-glaze", (0.55, 0.14, 0.07), rough=.22, **{"Coat Weight": .6, "Coat Roughness": .08})
    coffee, _, _ = principled("coffee", (0.03, 0.012, 0.005), rough=.08)
    leaf, _, lb = principled("leaf", (0.025, 0.09, 0.04), rough=.5, **{"Subsurface Weight": .25})
    lb.inputs["Subsurface Radius"].default_value = (0.002, 0.004, 0.001)
    pot, _, _ = principled("pot", (0.12, 0.2, 0.28), rough=.6)
    wall, _, _ = principled("wall", (0.035, 0.04, 0.055), rough=.9)
    frame_m, _, _ = principled("window-frame", (0.02, 0.022, 0.026), rough=.5)

    # Screen: Telugu UI textures (browser-shaped), emission through rounded-corner alpha, under a glossy cover glass.
    scr, snt, sout = node_mat("screen")
    sb = snt.nodes.new("ShaderNodeBsdfPrincipled")
    sb.inputs["Base Color"].default_value = (0.003, 0.003, 0.004, 1)
    sb.inputs["Roughness"].default_value = .04
    sb.inputs["Coat Weight"].default_value = 1.0
    sb.inputs["Coat Roughness"].default_value = .01
    t1 = snt.nodes.new("ShaderNodeTexImage")
    t1.image = bpy.data.images.load(os.path.join(TEX, "screen-typed.png"))
    t2 = snt.nodes.new("ShaderNodeTexImage")
    t2.image = bpy.data.images.load(os.path.join(TEX, "screen-sent.png"))
    mx, fac, ia, ib, mo = mix_rgba(snt)
    snt.links.new(t1.outputs["Color"], ia)
    snt.links.new(t2.outputs["Color"], ib)
    snt.links.new(mo, sb.inputs["Emission Color"])
    em = snt.nodes.new("ShaderNodeMath")
    em.operation = "MULTIPLY"
    snt.links.new(t1.outputs["Alpha"], em.inputs[0])
    snt.links.new(em.outputs[0], sb.inputs["Emission Strength"])
    snt.links.new(sb.outputs[0], sout.inputs["Surface"])
    screen_ctrl = {"mix": fac, "gain": em.inputs[1]}

    # Capsule glass: clear refractive glass + Fresnel edge light (the 'sealed message' read).
    cap_m, cnt, cout = node_mat("capsule-glass")
    gb = cnt.nodes.new("ShaderNodeBsdfPrincipled")
    gb.inputs["Base Color"].default_value = (0.86, 0.97, 1.0, 1)
    gb.inputs["Roughness"].default_value = .02
    gb.inputs["IOR"].default_value = 1.12
    gb.inputs["Transmission Weight"].default_value = 1.0
    gb.inputs["Coat Weight"].default_value = .5
    lw = cnt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs[0].default_value = .18
    ee_n = cnt.nodes.new("ShaderNodeEmission")
    ee_n.inputs[0].default_value = (0.35, 1.0, 0.70, 1)
    pw = cnt.nodes.new("ShaderNodeMath")
    pw.operation = "MULTIPLY"
    cnt.links.new(lw.outputs["Facing"], pw.inputs[0])
    cnt.links.new(pw.outputs[0], ee_n.inputs[1])
    add = cnt.nodes.new("ShaderNodeAddShader")
    cnt.links.new(gb.outputs[0], add.inputs[0])
    cnt.links.new(ee_n.outputs[0], add.inputs[1])
    cnt.links.new(add.outputs[0], cout.inputs["Surface"])
    tryset(cap_m, "use_raytrace_refraction", True)
    tryset(cap_m, "surface_render_method", "DITHERED")
    capsule_ctrl = {"rim": pw.inputs[1]}

    card_m, knt, kout = node_mat("card")
    kt = knt.nodes.new("ShaderNodeTexImage")
    kt.image = bpy.data.images.load(os.path.join(TEX, "card.png"))
    ke = knt.nodes.new("ShaderNodeEmission")          # self-lit UI card: unaffected by nearby lights (no blowout)
    ke.inputs[1].default_value = 1.25
    knt.links.new(kt.outputs["Color"], ke.inputs[0])
    ktr = knt.nodes.new("ShaderNodeBsdfTransparent")
    kmx = knt.nodes.new("ShaderNodeMixShader")
    knt.links.new(kt.outputs["Alpha"], kmx.inputs[0])
    knt.links.new(ktr.outputs[0], kmx.inputs[1])
    knt.links.new(ke.outputs[0], kmx.inputs[2])
    knt.links.new(kmx.outputs[0], kout.inputs["Surface"])
    tryset(card_m, "surface_render_method", "DITHERED")

    trail_m, tnt, tout = node_mat("trail")
    te = tnt.nodes.new("ShaderNodeEmission")
    te.inputs[0].default_value = (0.3, 1.0, 0.62, 1)
    tnt.links.new(te.outputs[0], tout.inputs["Surface"])
    trail_ctrl = {"strength": te.inputs[1]}

    def emissive(name, color, strength):
        m, nt, out = node_mat(name)
        e = nt.nodes.new("ShaderNodeEmission")
        e.inputs[0].default_value = (*color, 1)
        e.inputs[1].default_value = strength
        nt.links.new(e.outputs[0], out.inputs["Surface"])
        return m

    # ---- set: desk, back wall with a window onto a night city (bokeh), lamp off-frame left
    obj("desk", bpy.ops.mesh.primitive_cube_add, wood_m, loc=(0, 0.15, -0.02), scale=(1.6, 1.5, 0.04), size=1)
    wy = 0.95
    for n, (x, z, sx, sz) in {"wall-l": (-0.9, 0.6, 0.9, 1.6), "wall-r": (0.95, 0.6, 0.7, 1.6), "wall-b": (0, 0.06, 2.6, 0.12),
                              "wall-t": (0, 1.35, 2.6, 0.5)}.items():
        obj(n, bpy.ops.mesh.primitive_cube_add, wall, loc=(x, wy, z), scale=(sx, 0.05, sz), size=1)
    for i, x in enumerate((-0.45, 0.02, 0.6)):
        obj(f"mullion-{i}", bpy.ops.mesh.primitive_cube_add, frame_m, loc=(x, wy - 0.01, 0.65), scale=(0.035, 0.06, 1.2), size=1)
    obj("transom", bpy.ops.mesh.primitive_cube_add, frame_m, loc=(0, wy - 0.01, 0.62), scale=(2.6, 0.06, 0.03), size=1)
    obj("sill", bpy.ops.mesh.primitive_cube_add, frame_m, loc=(0, wy - 0.04, 0.125), scale=(2.6, 0.12, 0.02), size=1)
    sky = emissive("sky", (0.03, 0.06, 0.16), 1.0)
    obj("sky", bpy.ops.mesh.primitive_plane_add, sky, loc=(0, 7.0, 2.0), rot=(math.radians(90), 0, 0), scale=(9, 5, 1), size=1)
    rnd = random.Random(19)
    palette = [(1.0, .62, .28), (1.0, .78, .45), (.45, .62, 1.0), (.95, .45, .55), (.6, .9, 1.0)]
    for i in range(64):
        c = palette[0 if rnd.random() < .45 else rnd.randrange(len(palette))]
        m = emissive(f"city-{i}", c, rnd.uniform(6, 22))
        obj(f"city-{i}", bpy.ops.mesh.primitive_ico_sphere_add, m, loc=(rnd.uniform(-2.6, 2.6), rnd.uniform(2.5, 6.0), rnd.uniform(-0.3, 2.4)),
            subdivisions=1, radius=rnd.uniform(.012, .03))
    for i in range(9):                  # dark tower silhouettes between the lights
        obj(f"tower-{i}", bpy.ops.mesh.primitive_cube_add, wall, loc=(-2.4 + i * .6 + rnd.uniform(-.1, .1), 6.4, -0.4),
            scale=(rnd.uniform(.3, .55), .3, rnd.uniform(2.2, 4.4)), size=1)

    # ---- phone on a stand (procedural bevelled body, cover glass, screen, buttons, punch-hole camera)
    PW, PT, PH = 0.0715, 0.0082, 0.1515
    root = bpy.data.objects.new("phone-root", None)
    sc.collection.objects.link(root)
    root.location = (0.004, 0.035, 0.0105)
    root.rotation_euler = Euler((math.radians(-13), 0, math.radians(-17)), "XYZ")
    rounded_box("phone-body", (PW, PT, PH), .0105, .0022, alu, parent=root, loc=(0, 0, PH / 2))
    cover = rounded_box("cover-glass", (PW - .0016, .0008, PH - .0016), .0098, .0004, glass_black, parent=root, loc=(0, -PT / 2 - .0002, PH / 2), seg=10)
    obj("screen", bpy.ops.mesh.primitive_plane_add, scr, loc=(0, -PT / 2 - .00065, PH / 2), rot=(math.radians(90), 0, 0),
        scale=(PW - .0052, PH - .0052, 1), parent=root, size=1)
    obj("punch-hole", bpy.ops.mesh.primitive_cylinder_add, glass_black, loc=(0, -PT / 2 - .0007, PH - .0062), rot=(math.radians(90), 0, 0),
        parent=root, radius=.0017, depth=.0003, vertices=24)
    for i, (z, ln) in enumerate(((0.112, 0.02), (0.088, 0.012))):
        rounded_box(f"button-{i}", (0.0018, 0.0034, ln), .0016, 0, alu, parent=root, loc=(-PW / 2 - .0005, 0, z), axis="X", seg=4)
    rounded_box("stand-base", (0.078, 0.07, 0.0075), .008, .0015, stand_m, loc=(0.004, 0.04, 0.0038), axis="Z")
    rounded_box("stand-lip", (0.07, 0.008, 0.012), .003, .001, stand_m, parent=root, loc=(0, -PT / 2 - .004, 0.002), axis="Z", seg=4)
    rounded_box("stand-back", (0.05, 0.006, 0.09), .006, .0012, stand_m, parent=root, loc=(0, PT / 2 + .0035, 0.05), seg=6)
    cover.hide_render = False

    # ---- mug (right, background) and plant (left, foreground framing, out of focus)
    mug = obj("mug", bpy.ops.mesh.primitive_cylinder_add, ceramic, loc=(0.165, 0.30, 0.047), radius=.04, depth=.094, vertices=64)
    sol = mug.modifiers.new("wall", "SOLIDIFY")
    sol.thickness = .004
    bm = mug.modifiers.new("ease", "BEVEL")
    bm.width, bm.segments = .002, 3
    bpy.ops.object.shade_smooth()
    obj("coffee", bpy.ops.mesh.primitive_cylinder_add, coffee, loc=(0.165, 0.30, 0.082), radius=.0365, depth=.002, vertices=64)
    obj("handle", bpy.ops.mesh.primitive_torus_add, ceramic, loc=(0.208, 0.30, 0.05), rot=(math.radians(90), 0, 0),
        major_radius=.022, minor_radius=.0055, major_segments=48, minor_segments=16)
    bpy.ops.object.shade_smooth()
    obj("pot", bpy.ops.mesh.primitive_cylinder_add, pot, loc=(-0.15, -0.16, 0.035), radius=.045, depth=.07, vertices=48)
    bpy.ops.object.shade_smooth()
    for i, (rx, rz, s) in enumerate(((-30, -20, 1.0), (-15, 25, .9), (-45, 60, .85), (-20, -70, .95), (-55, 5, .8), (-10, 110, .9))):
        lf = obj(f"leaf-{i}", bpy.ops.mesh.primitive_uv_sphere_add, leaf, loc=(-0.15, -0.16, 0.07), segments=24, ring_count=12, radius=1)
        lf.scale = (0.016 * s, 0.003, 0.075 * s)
        lf.rotation_euler = Euler((math.radians(rx), 0, math.radians(rz)), "ZXY")
        lf.location = Vector((-0.15, -0.16, 0.07)) + lf.rotation_euler.to_matrix() @ Vector((0, 0, 0.07 * s))
        bpy.ops.object.shade_smooth()

    # Volumetric haze only around the set, so the lamp beam reads.
    vol_m = bpy.data.materials.new("haze")
    vol_m.use_nodes = True
    vnt = vol_m.node_tree
    vnt.nodes.remove(vnt.nodes.get("Principled BSDF"))
    pv = vnt.nodes.new("ShaderNodeVolumePrincipled")
    pv.inputs["Density"].default_value = 0.22
    pv.inputs["Anisotropy"].default_value = .55
    vnt.links.new(pv.outputs[0], vnt.nodes.get("Material Output").inputs["Volume"])
    obj("haze", bpy.ops.mesh.primitive_cube_add, vol_m, loc=(0, 0.2, 0.4), scale=(1.4, 1.3, 0.8), size=1)

    # Dust motes in the beam (life, deterministic drift).
    mote_m = emissive("mote", (1.0, .85, .6), 1.2)
    motes = []
    for i in range(14):
        mo = obj(f"mote-{i}", bpy.ops.mesh.primitive_ico_sphere_add, mote_m, subdivisions=1, radius=.0006)
        motes.append((mo, Vector((rnd.uniform(-0.16, 0.0), rnd.uniform(-0.12, 0.2), rnd.uniform(0.06, 0.28))), rnd.uniform(0, 6.28), rnd.uniform(.4, .9)))

    # ---- lights: warm desk lamp (spot, volumetric), lamp bounce (area), cool window rim, screen spill
    def light(name, kind, loc, energy, color, size=None, aim=None, **kw):
        ld = bpy.data.lights.new(name, kind)
        ld.energy, ld.color = energy, color
        if size is not None:
            if kind == "AREA":
                ld.size = size
            else:
                ld.shadow_soft_size = size
        for k, v in kw.items():
            tryset(ld, k, v)
        lo = bpy.data.objects.new(name, ld)
        sc.collection.objects.link(lo)
        lo.location = loc
        if aim is not None:
            d = Vector(aim) - Vector(loc)
            lo.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        return lo

    light("lamp", "SPOT", (-0.36, -0.02, 0.46), 30, (1.0, .70, .42), size=.03, aim=(0.02, 0.06, 0.0), spot_size=math.radians(46), spot_blend=.55,
          volume_factor=1.0)
    light("lamp-bounce", "AREA", (-0.3, 0.05, 0.32), 1.6, (1.0, .78, .55), size=.35, aim=(0, 0.03, 0.07), volume_factor=0.0, transmission_factor=0.0)
    light("moon-rim", "AREA", (0.42, 0.55, 0.32), 9.0, (.45, .62, 1.0), size=.4, aim=(0, 0.03, 0.08), volume_factor=.2, transmission_factor=0.0)
    spill = light("screen-spill", "AREA", (0.0, -0.03, 0.09), 0.8, (.45, 1.0, .75), size=.08, aim=(-0.05, -0.4, 0.06), volume_factor=0.0, specular_factor=0.0, transmission_factor=0.0)

    # ---- capsule (hero): glass pill + browser-rendered Telugu card + Fresnel rim, under an animated root
    croot = bpy.data.objects.new("capsule-root", None)
    sc.collection.objects.link(croot)
    squash = bpy.data.objects.new("capsule-squash", None)
    sc.collection.objects.link(squash)
    squash.parent = croot
    # v2 (E19 correction): no subdivision on the bevelled n-gon caps (it pinched into star shards); a real edge bevel instead.
    shell = rounded_box("capsule-shell", (0.064, 0.02, 0.033), .0099, .0045, cap_m, parent=squash, seg=14)
    obj("capsule-card", bpy.ops.mesh.primitive_plane_add, card_m, rot=(math.radians(90), 0, 0), scale=(0.056, 0.028, 1), parent=squash, size=1)
    glow = light("capsule-glow", "POINT", (0, 0, 0), 0.0, (.4, 1.0, .65), size=.02, volume_factor=.3, specular_factor=0.0, transmission_factor=0.0)
    glow.parent = squash

    # Trail: an emissive tube along the flight path, revealed by bevel factors.
    cu = bpy.data.curves.new("trail", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = .0007
    cu.bevel_resolution = 3
    tr = bpy.data.objects.new("trail", cu)
    sc.collection.objects.link(tr)
    tr.data.materials.append(trail_m)

    # ---- camera
    cd = bpy.data.cameras.new("cam")
    cd.lens, cd.sensor_width, cd.sensor_fit = 48, 36, "AUTO"
    cd.clip_start = .01
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = 4.0
    cd.dof.aperture_blades = 7
    cam = bpy.data.objects.new("cam", cd)
    sc.collection.objects.link(cam)
    sc.camera = cam
    focus = bpy.data.objects.new("focus", None)
    sc.collection.objects.link(focus)
    cd.dof.focus_object = focus

    # Compositor: gentle bloom (Blender 5 node-group API, with a fallback for 4.x).
    comp_log = setup_bloom(sc)

    bpy.context.view_layer.update()
    rig = dict(sc=sc, root=root, croot=croot, squash=squash, cam=cam, focus=focus, glow=glow, spill=spill, tr=tr, cu=cu, motes=motes,
               screen=screen_ctrl, capsule=capsule_ctrl, trail=trail_ctrl, PW=PW, PT=PT, PH=PH)
    animate(rig)
    return comp_log


def setup_bloom(sc):
    try:
        if hasattr(sc, "compositing_node_group"):
            ng = bpy.data.node_groups.new("vc-bloom", "CompositorNodeTree")
            ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
            rl = ng.nodes.new("CompositorNodeRLayers")
            gl = ng.nodes.new("CompositorNodeGlare")
            out = ng.nodes.new("NodeGroupOutput")
            sc.compositing_node_group = ng
        else:
            sc.use_nodes = True
            ng = sc.node_tree
            rl = ng.nodes.get("Render Layers")
            out = ng.nodes.get("Composite")
            gl = ng.nodes.new("CompositorNodeGlare")
        settings = {"glare_type": "BLOOM", "quality": "HIGH", "threshold": 1.2, "mix": -.55, "size": 7}
        done = {k: tryset(gl, k, v) for k, v in settings.items()}
        for inp in gl.inputs:
            key = inp.name.lower()
            if key == "type":
                done["type-input"] = tryset(inp, "default_value", "Bloom")
            elif key == "threshold":
                inp.default_value = 1.2
                done["threshold-input"] = True
            elif key == "strength":
                inp.default_value = .45
                done["strength-input"] = True
            elif key == "size":
                inp.default_value = .55
                done["size-input"] = True
            elif key == "quality":
                done["quality-input"] = tryset(inp, "default_value", "High")
        ng.links.new(rl.outputs["Image"], gl.inputs["Image"])
        ng.links.new(gl.outputs["Image"] if "Image" in gl.outputs else gl.outputs[0], out.inputs[0])
        return {"bloom": True, "settings": done, "inputs": [i.name for i in gl.inputs]}
    except Exception as e:  # bloom is optional polish; report, never hide
        return {"bloom": False, "error": repr(e)[:300]}


# ---------------------------------------------------------------- motion (all values are pure functions of time)
def animate(r):
    sc, cam, focus = r["sc"], r["cam"], r["focus"]
    root_m = r["root"].matrix_world.copy()
    q_phone = root_m.to_quaternion()

    def cam_pose(t):
        p = ease_in_out((t - 0.9) / 4.5)
        pos = Vector((-0.096, -0.352, 0.112)).lerp(Vector((-0.068, -0.306, 0.13)), p)
        pos += Vector((math.sin(t * 1.3) * .0007, 0, math.sin(t * 0.9 + 1) * .0006))    # breathing, deterministic
        lift = smooth((t - 2.5) / 1.3)
        tgt = Vector((0.004, 0.03, 0.086)).lerp(Vector((0.014, -0.01, 0.112)), lift)
        q = (tgt - pos).to_track_quat("-Z", "Y")
        roll = Quaternion((0, 0, 1), math.radians(-1.2 + 1.6 * p))   # slow Dutch drift toward level
        return pos, q @ roll

    # Hero rest point, composed in camera space at the settle moment: upper-centre third, ~0.30 m from the lens.
    cpos, cq = cam_pose(3.6)
    fwd, up, right = cq @ Vector((0, 0, -1)), cq @ Vector((0, 1, 0)), cq @ Vector((1, 0, 0))
    d = 0.26
    half_h = d * math.tan(math.atan(18 / 48))
    R = cpos + fwd * d + up * (0.50 * half_h) + right * (0.12 * half_h)
    PT = r["PT"]
    S = root_m @ Vector((-0.011, -PT / 2 - .002, 0.016))        # where 'హాయ్' sits in the input field
    n = (root_m.to_3x3() @ Vector((0, -1, 0))).normalized()     # screen normal
    S_in = S - n * .004                                         # anticipation: pressed into the glass
    ctrl1 = S + n * 0.09 + Vector((0, 0, 0.02))
    over = R + (R - S).normalized() * 0.022                     # overshoot target (follow-through)
    ctrl2 = over + Vector((0.0, 0.0, -0.05))

    def bez(p):
        a, b, c, e = S, ctrl1, ctrl2, over
        u = 1 - p
        return a * u ** 3 + b * 3 * u * u * p + c * 3 * u * p * p + e * p ** 3

    q_face0 = q_phone                                    # card lies on the screen
    q_face1 = (cpos - R).to_track_quat("-Y", "Z")         # card faces the lens at rest

    # Trail geometry (fixed path, revealed over time).
    sp = r["cu"].splines.new("POLY")
    pts = [bez(i / 40) for i in range(41)]
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)

    T0, T1, T2 = 2.20, SEND, 2.98            # appear / launch / arrive at overshoot
    for f in range(20, 175):
        t = f / FPS
        pos, q = cam_pose(t)
        cam.location, cam.rotation_mode = pos, "QUATERNION"
        cam.rotation_quaternion = q
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_quaternion", frame=f)

        # capsule
        appear = ease_out_back((t - T0) / (T1 - T0))
        sq = Vector((1, 1, 1))
        if t < T1:
            p_in = smooth((t - T0) / (T1 - T0))
            loc = S.lerp(S_in, p_in)
            qq = q_face0
            sq = Vector((1 + .10 * p_in, 1 - .25 * p_in, 1 - .12 * p_in))   # squash into the screen
        elif t < T2:
            p = ease_out_quart((t - T1) / (T2 - T1))
            loc = bez(p)
            qq = q_face0.slerp(q_face1, smooth((t - T1) / (T2 - T1) * 1.15))
            speed = 1 - p                                             # fast at launch, slowing in
            sq = Vector((1 - .10 * speed, 1, 1 + .22 * speed))       # stretch along travel
            qq = qq @ Quaternion((0, 1, 0), math.radians(-16 * math.sin(math.pi * p)))
        else:
            k = spring(t - T2)
            loc = R + (over - R) * k
            bob = smooth((t - T2 - .4) / .8)
            loc = loc + up * (math.sin((t - T2) * 2.6) * .0016 * bob)
            qq = q_face1 @ Quaternion((0, 1, 0), math.radians(6.5 * k)) @ Quaternion((0, 0, 1), math.radians(5 * math.sin((t - T2) * 1.4) * bob))
            sq = Vector((1 + .05 * k, 1, 1 - .06 * k))                 # residual squash settles
        s = max(appear, 0.0) if t < T1 else 1.0
        r["croot"].location = loc
        r["croot"].rotation_mode = "QUATERNION"
        r["croot"].rotation_quaternion = qq
        r["croot"].scale = (s, s, s)
        r["squash"].scale = sq
        for o, path in ((r["croot"], ("location", "rotation_quaternion", "scale")), (r["squash"], ("scale",))):
            for pth in path:
                o.keyframe_insert(pth, frame=f)

        # focus: rack from the screen to the capsule as it leaves
        rack = smooth((t - 2.45) / .7)
        focus.location = (root_m @ Vector((0, 0, 0.08))).lerp(loc, rack)
        focus.keyframe_insert("location", frame=f)

        # screen: typed -> sent at the send cue; send pulse; spill follows
        r["screen"]["mix"].default_value = smooth((t - (T1 - .02)) / .12)
        pulse = math.exp(-((t - T1) / .12) ** 2)
        r["screen"]["gain"].default_value = 2.2 + 2.6 * pulse
        r["screen"]["mix"].keyframe_insert("default_value", frame=f)
        r["screen"]["gain"].keyframe_insert("default_value", frame=f)
        r["spill"].data.energy = .8 + 2.2 * pulse
        r["spill"].data.keyframe_insert("energy", frame=f)

        # capsule light + rim, trail reveal and fade
        live = smooth((t - T0) / .25)
        r["glow"].data.energy = .015 * live + .03 * pulse
        r["glow"].data.keyframe_insert("energy", frame=f)
        r["capsule"]["rim"].default_value = 1.2 * live + 0.8 * pulse
        r["capsule"]["rim"].keyframe_insert("default_value", frame=f)
        pr = ease_out_quart((t - T1) / (T2 - T1)) if t >= T1 else 0.0
        r["cu"].bevel_factor_end = clamp(pr)
        r["cu"].bevel_factor_start = clamp(pr - .35 + 1.1 * smooth((t - T2 + .15) / .45))
        r["cu"].keyframe_insert("bevel_factor_end", frame=f)
        r["cu"].keyframe_insert("bevel_factor_start", frame=f)
        r["trail"]["strength"].default_value = 0.0 if t < T1 else 4.0 * (1 - smooth((t - T2) / .5))
        r["trail"]["strength"].keyframe_insert("default_value", frame=f)

        for mo, base, ph, sp_ in r["motes"]:
            mo.location = base + Vector((math.sin(t * .35 * sp_ + ph) * .012, math.cos(t * .25 + ph) * .008, math.sin(t * .2 * sp_ + ph * 2) * .01))
            mo.keyframe_insert("location", frame=f)
    return R


# ---------------------------------------------------------------- main
def main():
    out, w, h, frames, samples, tag = parse()
    out = os.path.abspath(out)
    os.makedirs(out, exist_ok=True)
    comp = build(w, h, samples)
    sc = bpy.context.scene
    t_built = time.perf_counter()
    times = []
    for f in frames:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(out, f"{tag}-{f:04d}.png")
        a = time.perf_counter()
        bpy.ops.render.render(write_still=True)
        times.append({"frame": f, "seconds": round(time.perf_counter() - a, 3)})
        print(f"FRAME {f} {times[-1]['seconds']}s", flush=True)
    info = {"blender": bpy.app.version_string, "engine": sc.render.engine, "resolution": [w, h], "samples": samples,
            "gpu": bpy.app.build_platform.decode() if isinstance(bpy.app.build_platform, bytes) else str(bpy.app.build_platform),
            "python_start_to_scene_built_s": round(t_built - T_START, 3), "frames": times, "compositor": comp}
    with open(os.path.join(out, f"{tag}-timing.json"), "w", encoding="utf-8") as fh:
        json.dump(info, fh, indent=2)
    print("DONE", json.dumps({"built": info["python_start_to_scene_built_s"], "n": len(times)}))


main()
