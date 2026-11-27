"""Writes plan/creative-plan.json for E17 / P018.5 (agent-authored creative decisions; run from the project root)."""
import glob
import hashlib
import json

tl = sorted(glob.glob("narration/narration-*.timeline.json"))[0].replace("\\", "/")
sha = hashlib.sha256(open(tl, "rb").read()).hexdigest()


def O(i, a, d):
    return dict(id=i, asset=a, description=d)


def C(i, o, act, word, seg):
    return dict(id=i, object=o, action=act, at=dict(word=word, segment=seg))


shots = [
    dict(id="pulse", purpose="Hook: a person on a rooftop at sunrise; an ECG line crosses the sky while the heart beats in a paper window on the chest.",
         metaphor="the heart as a tireless rhythm inside an ordinary morning",
         objects=[O("p-rate", "art-dawn", "60–100 per minute tag"), O("p-ecg", "art-dawn", "ECG line across the sky")],
         cues=[C("rate", "p-rate", "the 60–100 per minute tag appears", "అరవై", "s1"), C("ecg", "p-ecg", "the ECG line draws across the sky", "కొట్టుకుంటుంది.", "s1")]),
    dict(id="heart", start={"segment": "s2"}, purpose="Four chambers: the paper heart opens into a frontal cross-section.",
         objects=[O("h-sec", "art-heart", "frontal cross-section"), O("h-atria", "art-heart", "atria tag"), O("h-vent", "art-heart", "ventricles tag")],
         cues=[C("open", "h-sec", "the exterior opens into the cross-section", "నాలుగు", "s2"), C("atria", "h-atria", "tag the two upper chambers", "పైన", "s2"),
               C("ventricles", "h-vent", "tag the two lower chambers", "కింద", "s2")]),
    dict(id="right", start={"segment": "s3"}, purpose="Oxygen-poor blood enters the right atrium, drops to the right ventricle and is pumped to the lungs.",
         objects=[O("r-c0", "art-cells", "blue cells from the superior vena cava"), O("r-ra", "art-heart", "right atrium tag"), O("r-rv", "art-heart", "right ventricle tag")],
         cues=[C("blue-in", "r-c0", "blue cells enter from the body", "శరీరం", "s3"), C("ra", "r-ra", "tag the right atrium", "కర్ణికలోకి", "s3"),
               C("rv", "r-rv", "tag the right ventricle", "జఠరిక", "s3")]),
    dict(id="lungs", start={"segment": "s4"}, purpose="Blood picks up oxygen in the lungs and returns to the left atrium.",
         objects=[O("l-mag", "art-lungs", "magnified air sacs"), O("l-r0", "art-cells", "red cells returning"), O("l-la", "art-lungs", "left atrium tag")],
         cues=[C("o2", "l-mag", "magnifier on the air sacs; cells turn red", "ఆక్సిజన్", "s4"), C("back", "l-r0", "red cells flow back to the heart", "తిరిగి", "s4"),
               C("la", "l-la", "tag the left atrium", "అక్కడి", "s4")]),
    dict(id="body", start={"segment": "s5"}, purpose="The left ventricle squeezes and drives blood from head to toes.",
         objects=[O("b-lv", "art-body", "left ventricle tag"), O("b-up", "art-body", "arteries to the head"), O("b-down", "art-body", "arteries to the toes")],
         cues=[C("squeeze", "b-lv", "the heart squeezes; tag the left ventricle", "బలంగా", "s5"), C("head", "b-up", "arteries draw up to the head", "తల", "s5"),
               C("toes", "b-down", "arteries draw down to the toes", "కాలి", "s5")]),
    dict(id="valves", start={"segment": "s6"}, purpose="Valves are one-way paper doors that stop backflow.",
         objects=[O("v-c0", "art-valve", "cells pushing the leaflets open"), O("v-x", "art-valve", "backflow blocked mark")],
         cues=[C("vopen", "v-c0", "leaflets swing open with the flow", "తెరుచుకుంటాయి.", "s6"), C("stop", "v-x", "leaflets shut; backflow blocked", "వెనక్కి", "s6")]),
    dict(id="lubdub", start={"segment": "s7"}, purpose="The closing valves make the lub-dub sounds.",
         objects=[O("d-lub", "art-heart", "cut-paper LUB"), O("d-dub", "art-heart", "cut-paper DUB")],
         cues=[C("lub", "d-lub", "LUB lands with a sound ring", "లబ్", "s7"), C("dub", "d-dub", "DUB lands with a sound ring", "డబ్.", "s7")]),
    dict(id="spark", start={"word": "ఒక", "segment": "s8"}, purpose="Every beat starts with an electrical signal from the SA node in the right atrium.",
         objects=[O("s-star", "art-heart", "spark at the SA node"), O("s-wv", "art-heart", "wave across the ventricles")],
         cues=[C("spark", "s-star", "the SA node sparks", "విద్యుత్", "s8"), C("wave", "s-wv", "the wave sweeps down the ventricles", "మొదలవుతుంది.", "s8")]),
]
plan = {"schema": "video-creator.creative-plan", "version": 1, "narration": {"timeline": tl, "sha256": sha}, "style": "paper-explainer",
        "style_reason": "A heart is a layered physical organ; cut-paper construction lets one consistent paper heart open, be travelled through and be "
                        "re-lit shot after shot, matching the Painted Story / Paper Collage reference language with full-bleed scenes.",
        "story": [dict(segment="s1", role="hook", idea="Even at rest the heart beats 60–100 times a minute; how does it pump?"),
                  dict(segment="s2", role="context", idea="Four chambers: two atria above, two ventricles below."),
                  dict(segment="s3", role="mechanism", idea="Right side: body blood in, pumped to the lungs."),
                  dict(segment="s4", role="mechanism", idea="Lungs add oxygen; blood returns to the left atrium and ventricle."),
                  dict(segment="s5", role="mechanism", idea="The left ventricle drives blood to the whole body."),
                  dict(segment="s6", role="mechanism", idea="Valves open one way and stop backflow."),
                  dict(segment="s7", role="example", idea="Closing valves make the lub-dub sound."),
                  dict(segment="s8", role="resolution", idea="An electrical signal from the right atrium starts every beat.")],
        "motifs": [dict(id="m-cells", stands_for="blood cells travelling the loop (blue: oxygen-poor, red: oxygen-rich — teaching colours)"),
                   dict(id="m-heart", stands_for="one consistent paper heart, exterior and frontal cross-section")],
        "assets": [dict(id="art-dawn", kind="original", description="rooftop at sunrise: skyline facades, brick parapet, plants, a person with a chest window, ECG line"),
                   dict(id="art-heart", kind="original", description="anatomical paper heart: exterior with coronary vessels and fat, frontal cross-section with chambers, valves, chordae, SA node, great vessels"),
                   dict(id="art-cells", kind="original", description="biconcave red and blue paper cells"),
                   dict(id="art-lungs", kind="original", description="paper lungs (3 + 2 lobes, cardiac notch), trachea, bronchial tree, pulmonary vessels, magnified air sacs"),
                   dict(id="art-body", kind="original", description="paper body silhouette with arterial tree to head, arms and toes"),
                   dict(id="art-valve", kind="original", description="vessel close-up with two door-like leaflets")],
        "guardrails": ["frontal anatomical view: the heart's right side is on the viewer's left", "blue/red blood is a teaching convention (on-screen note)",
                       "no numbers except the narrated 60–100 per minute", "simplified, not to scale", "left ventricle wall drawn thicker (visual only, not narrated)"],
        "shots": shots,
        "extensions": {"paper-explainer": {"labels": "narration words only", "presentation": "full-bleed, word captions, hook headline"}}}
open("plan/creative-plan.json", "w", encoding="utf-8").write(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")
print("ok", tl)
