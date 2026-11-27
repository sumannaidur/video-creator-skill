"""Writes plan/creative-plan.json for E18 (agent-authored creative decisions; run from the project root)."""
import glob
import hashlib
import json

tl = sorted(glob.glob("narration/narration-*.timeline.json"))[0].replace("\\", "/")
sha = hashlib.sha256(open(tl, "rb").read()).hexdigest()


def O(i, a, d):
    return dict(id=i, asset=a, description=d)


def C(i, o, act, word, seg, occ=None):
    return dict(id=i, object=o, action=act, at=dict(word=word, segment=seg, **({"occurrence": occ} if occ else {})))


shots = [
    dict(id="send", purpose="Hook: 'హాయ్' types itself on a phone at a night desk; send glows; what happens in between?",
         metaphor="the message as a physical object about to travel",
         objects=[O("d-typed", "art-desk", "typed text"), O("d-bubble", "art-desk", "sent bubble"), O("d-q", "art-desk", "question badge")],
         cues=[C("type", "d-typed", "the word types itself", "హాయ్", "s1"), C("send", "d-bubble", "send glows; the bubble jumps up", "సెండ్", "s1"),
               C("mid", "d-q", "a question badge appears", "మధ్యలో", "s1")]),
    dict(id="lock", start={"segment": "s2"}, purpose="The message is sealed in a glass capsule with a padlock on the phone; two keys: you and your friend.",
         objects=[O("d-lock", "art-capsule", "padlock"), O("d-key1", "art-capsule", "your key"), O("d-key2", "art-capsule", "friend's key"), O("d-tfriend", "art-capsule", "friend key tag")],
         cues=[C("lock", "d-lock", "padlock snaps shut on the capsule", "తాళం", "s2"), C("key", "d-key1", "two keys appear", "తాళంచెవి", "s2"),
               C("friendkey", "d-tfriend", "the friend's key is tagged, then flies away", "ఫ్రెండ్", "s2")]),
    dict(id="travel", start={"segment": "s3"}, purpose="The locked capsule streaks across a glowing city network to the server tower; one grey tick.",
         objects=[O("n-route", "art-city", "fibre route"), O("n-tick", "art-city", "one grey tick"), O("n-srv", "art-city", "server tag")],
         cues=[C("net", "n-route", "the route lights and the capsule races along it", "ఇంటర్నెట్", "s3"), C("server3", "n-srv", "the server tower is tagged", "సర్వర్‌", "s3"),
               C("tick1", "n-tick", "one grey tick lights", "టిక్", "s3")]),
    dict(id="server", start={"segment": "s4"}, purpose="Inside the server hall a scanner tries to read the capsule and is refused; the server only routes it.",
         objects=[O("h-x", "art-hall", "refusal mark"), O("h-cant", "art-hall", "cannot read tag"), O("h-exit", "art-hall", "route to the right phone")],
         cues=[C("cant", "h-x", "scanner refused: red mark", "చదవలేదు.", "s4", 1), C("wa", "h-cant", "'cannot read' tag", "వాట్సాప్", "s4"),
               C("right", "h-exit", "the route to the right phone lights", "సరైన", "s4")]),
    dict(id="wait", start={"segment": "s5"}, purpose="If the friend's phone is off, the locked capsule waits in a vault drawer for up to 30 days.",
         objects=[O("h-off", "art-hall", "inset: friend's phone off at night"), O("h-days", "art-hall", "30 days read-out")],
         cues=[C("off", "h-off", "inset of the dark phone", "ఆఫ్‌లో", "s5"), C("days", "h-days", "30 days read-out", "ముప్పై", "s5")]),
    dict(id="delivered", start={"segment": "s6"}, purpose="Dawn: the friend's phone wakes, the capsule arrives on a beam, two grey ticks, the server copy dissolves.",
         objects=[O("r-beam", "art-room", "arrival beam"), O("r-t2", "art-room", "two grey ticks"), O("r-srv", "art-room", "server copy inset")],
         cues=[C("reach", "r-beam", "the beam brings the capsule down", "చేరగానే", "s6"), C("tick2", "r-t2", "two grey ticks", "టిక్‌లు", "s6"),
               C("srv6", "r-srv", "the server copy dissolves", "సర్వర్", "s6")]),
    dict(id="unlock", start={"segment": "s7"}, purpose="Only the friend's key opens the lock; the bubble appears and the ticks turn blue.",
         objects=[O("r-key", "art-room", "friend's key"), O("r-bubble", "art-room", "received bubble"), O("r-t2b", "art-room", "blue ticks")],
         cues=[C("key7", "r-key", "the friend's key flies in", "తాళంచెవితోనే", "s7"), C("open", "r-bubble", "the lock pops; the bubble appears", "తెరుచుకుంటుంది.", "s7"),
               C("blue", "r-t2b", "ticks turn blue", "నీలం", "s7")]),
    dict(id="auto", start={"segment": "s8"}, purpose="Pull back over the city: every message travels locked, automatically.",
         objects=[O("n-c0", "art-city", "many capsules"), O("n-blue", "art-city", "blue ticks")],
         cues=[C("every", "n-c0", "many capsules race between phones", "ప్రతి", "s8"), C("auto", "n-blue", "blue ticks land", "ఆటోమేటిక్‌గా", "s8")]),
]
plan = {"schema": "video-creator.creative-plan", "version": 1, "narration": {"timeline": tl, "sha256": sha}, "style": "tech-explainer",
        "style_reason": "A message's journey is a device-and-network story; the Tech Explainer's dark product studio, glass, beams and isometric "
                        "cities (P018.3) show phones, a city network and a server hall as one lit world, close to the reference's 3D/X-Ray look.",
        "story": [dict(segment="s1", role="hook", idea="Send 'hi'; it appears in moments. What happens in between?"),
                  dict(segment="s2", role="mechanism", idea="The message is locked on your phone; only you and your friend hold the key."),
                  dict(segment="s3", role="mechanism", idea="The locked message travels to the server; one grey tick."),
                  dict(segment="s4", role="contrast", idea="The server and WhatsApp cannot read it; it only routes it."),
                  dict(segment="s5", role="example", idea="If the phone is off it waits, locked, up to 30 days."),
                  dict(segment="s6", role="mechanism", idea="Delivered: two grey ticks; removed from the server."),
                  dict(segment="s7", role="mechanism", idea="Only the friend's key opens it; read: blue ticks."),
                  dict(segment="s8", role="resolution", idea="All of it happens automatically for every message.")],
        "motifs": [dict(id="m-capsule", stands_for="the encrypted message (glass capsule + padlock)"), dict(id="m-keys", stands_for="the keys only you and your friend hold"),
                   dict(id="m-ticks", stands_for="the tick scoreboard (sent, delivered, read)")],
        "assets": [dict(id="art-desk", kind="original", description="night desk: phone with generic chat UI, lamp beam, window city bokeh, mug, plant"),
                   dict(id="art-capsule", kind="original", description="glass message capsule, padlock and shackle, gold keys"),
                   dict(id="art-city", kind="original", description="isometric night city network, fibre routes, server tower, mini phones"),
                   dict(id="art-hall", kind="original", description="server hall racks, pedestal, scanner, vault drawer, insets"),
                   dict(id="art-room", kind="original", description="bedside at dawn, friend's phone, arrival beam, tick chips")],
        "guardrails": ["no WhatsApp logo or trade dress; generic chat UI", "personal text chat only", "server is one illustrative building",
                       "'not even WhatsApp' applies to personal chats", "ticks shown simply; no claim that grey means unread", "simplified, not to scale"],
        "shots": shots,
        "extensions": {"tech-explainer": {"labels": "narration words only", "presentation": "full-bleed, word captions, hook headline"}}}
open("plan/creative-plan.json", "w", encoding="utf-8").write(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")
print("ok", tl)
