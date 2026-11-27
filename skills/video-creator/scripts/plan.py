"""Creative-plan contract, validator and speech cue resolver (standard library only).

  python scripts/plan.py validate <project> [--plan plan/creative-plan.json]          check and resolve without touching the ledger
  python scripts/plan.py resolve  <project> [--plan plan/creative-plan.json] [--out plan/resolved-plan.json]

The plan records the agent's creative decisions (story roles, concepts, motifs, shots, assets, camera, transitions,
speech-anchored cues, guardrails). This tool never makes creative choices: it validates references and turns speech
anchors into sample-exact times from the verified narration timeline, whatever provider produced it. `resolve` runs the
ledger's creative-plan stage (start -> complete with evidence, or fail with the reason). Exit codes: 0 ok, 1 invalid, 2 usage.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
import subprocess
import sys
import unicodedata

sys.dont_write_bytecode = True
SCRIPTS = Path(__file__).resolve().parent
PACKAGE = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS / "narration"))
from timeline import validate as validate_timeline  # noqa: E402

SCHEMA, VERSION = "video-creator.creative-plan", 1
ROLES = {"hook", "context", "mechanism", "contrast", "example", "transition", "resolution"}
ASSET_KINDS = {"original", "procedural", "licensed", "user-supplied"}
MIN_SHOT_SECONDS = 0.3
CUE_ID = re.compile(r"^[a-z0-9][a-z0-9._-]*$")  # an id makes a cue addressable by topic modules


class PlanError(Exception):
    def __init__(self, code, message):
        super().__init__(f"[{code}] {message}"); self.code = code


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def norm(text):
    """Compare spoken words without surrounding punctuation (Unicode-aware, any script); never alter inner characters."""
    text = " ".join(str(text).split())
    while text and unicodedata.category(text[0]).startswith("P"):
        text = text[1:]
    while text and unicodedata.category(text[-1]).startswith("P"):
        text = text[:-1]
    return text


class Resolver:
    """Resolves anchors against a validated timeline (word/phrase records with integer sample bounds and provenance)."""

    def __init__(self, timeline):
        self.t = timeline
        self.rate = timeline["audio"]["sample_rate"]
        self.count = timeline["audio"]["sample_count"]
        self.words = [r for r in timeline["records"] if r["kind"] == "word"]
        self.phrases = [r for r in timeline["records"] if r["kind"] == "phrase"]
        self.segments = {s["id"]: s for s in timeline.get("segments", [])}

    def _scope(self, records, anchor, where):
        seg = anchor.get("segment")
        if seg is None:
            return records
        if seg not in self.segments:
            raise PlanError("unknown-segment", f"{where}: segment {seg!r} is not in the narration")
        return [r for r in records if r.get("segment") == seg]

    def _pick(self, matches, anchor, where, what):
        occurrence = anchor.get("occurrence")
        if occurrence is not None:
            if not isinstance(occurrence, int) or not 1 <= occurrence <= len(matches):
                raise PlanError("missing-reference", f"{where}: {what} occurrence {occurrence} not found ({len(matches)} matches)")
            return matches[occurrence - 1]
        if not matches:
            raise PlanError("missing-reference", f"{where}: {what} not found in the narration")
        if len(matches) > 1:
            raise PlanError("ambiguous-reference", f"{where}: {what} occurs {len(matches)} times; add segment or occurrence")
        return matches[0]

    def anchor(self, anchor, where, shot_starts=None):
        if not isinstance(anchor, dict):
            raise PlanError("invalid-anchor", f"{where}: anchor must be an object")
        edge = anchor.get("edge", "start")
        if edge not in ("start", "end"):
            raise PlanError("invalid-anchor", f"{where}: edge must be start or end")
        offset = anchor.get("offset_ms", 0)
        if not isinstance(offset, (int, float)) or isinstance(offset, bool):
            raise PlanError("invalid-anchor", f"{where}: offset_ms must be a number")
        if "word" in anchor:
            scope = self._scope(self.words, anchor, where)
            target = norm(anchor["word"])
            record = self._pick([r for r in scope if norm(r["label"]) == target], anchor, where, f"word {anchor['word']!r}")
            kind = "word"
        elif "phrase" in anchor or "phrase_index" in anchor:
            scope = self._scope(self.phrases, anchor, where)
            if "phrase_index" in anchor:
                i = anchor["phrase_index"]
                if not isinstance(i, int) or not 0 <= i < len(scope):
                    raise PlanError("missing-reference", f"{where}: phrase_index {i} out of range ({len(scope)} phrases)")
                record = scope[i]
            else:
                target = " ".join(str(anchor["phrase"]).split())
                record = self._pick([r for r in scope if " ".join(r["label"].split()) == target], anchor, where, "phrase")
            kind = "phrase"
        elif "segment" in anchor:
            seg = self.segments.get(anchor["segment"]) or (_ for _ in ()).throw(PlanError("unknown-segment", f"{where}: segment {anchor['segment']!r} is not in the narration"))
            start, end = seg["offset_samples"], seg["offset_samples"] + seg["sample_count"]
            record = dict(start=start, end=end, source="segment_boundary", label=anchor["segment"], kind="segment")
            kind = "segment"
        elif "shot" in anchor:
            if shot_starts is None or anchor["shot"] not in shot_starts:
                raise PlanError("unknown-shot", f"{where}: shot-relative anchor needs an earlier-resolved shot {anchor['shot']!r}")
            base = shot_starts[anchor["shot"]]
            record = dict(start=base, end=base, source="shot_relative", label=anchor["shot"], kind="shot")
            kind = "shot"
        elif anchor == {} or set(anchor) <= {"offset_ms", "edge", "at"} and anchor.get("at") in ("narration-start", "narration-end"):
            point = 0 if anchor.get("at", "narration-start") == "narration-start" else self.count
            record = dict(start=point, end=point, source="narration_bounds", label=anchor.get("at", "narration-start"), kind="bounds")
            kind = "bounds"
        else:
            raise PlanError("invalid-anchor", f"{where}: anchor needs word, phrase, phrase_index, segment, shot or at")
        if record.get("start") is None or record.get("source") is None:
            raise PlanError("unmapped-reference", f"{where}: {kind} {record.get('label')!r} has no measured timing; a time is never invented")
        sample = (record["start"] if edge == "start" else record["end"]) + round(offset * self.rate / 1000)
        if not 0 <= sample <= self.count:
            raise PlanError("out-of-range", f"{where}: resolves to sample {sample}, outside the narration (0-{self.count})")
        return dict(sample=sample, seconds=round(sample / self.rate, 4), kind=kind, label=record.get("label"), segment=record.get("segment"),
                    timing_source=record["source"], edge=edge, offset_ms=offset)


def validate_plan(plan, timeline, styles):
    """Return the resolved plan or raise PlanError. Checks structure, references, coverage, ordering and bounds."""
    if plan.get("schema") != SCHEMA or plan.get("version") != VERSION:
        raise PlanError("invalid-plan", f"expected schema {SCHEMA} v{VERSION}")
    style = plan.get("style")
    if style not in styles:
        raise PlanError("unknown-style", f"style {style!r} is not a registered style")
    if not isinstance(plan.get("style_reason"), str) or not plan["style_reason"].strip():
        raise PlanError("invalid-plan", "style_reason must record why this style serves the topic")
    for key in plan.get("extensions", {}):
        if key not in styles:
            raise PlanError("unknown-style", f"extension {key!r} is not a registered style")
    r = Resolver(timeline)
    for i, s in enumerate(plan.get("story", [])):
        if s.get("segment") not in r.segments or s.get("role") not in ROLES:
            raise PlanError("invalid-plan", f"story[{i}]: needs a narration segment and a role in {sorted(ROLES)}")
    if not isinstance(plan.get("guardrails"), list):
        raise PlanError("invalid-plan", "guardrails must be a list (it may be empty only if you decided none apply)")
    assets = {}
    for a in plan.get("assets", []):
        if not a.get("id") or a["id"] in assets or a.get("kind") not in ASSET_KINDS or not a.get("description"):
            raise PlanError("invalid-asset", f"asset {a.get('id')!r}: needs a unique id, a description and kind in {sorted(ASSET_KINDS)}")
        if a["kind"] in ("licensed", "user-supplied") and not (a.get("source") and a.get("license")):
            raise PlanError("asset-provenance", f"asset {a['id']!r}: {a['kind']} assets need source and license")
        assets[a["id"]] = a
    motifs = {m["id"]: m for m in plan.get("motifs", []) if m.get("id") and m.get("stands_for")}
    if len(motifs) != len(plan.get("motifs", [])):
        raise PlanError("invalid-plan", "every motif needs a unique id and what it stands_for")
    shots = plan.get("shots")
    if not isinstance(shots, list) or not shots:
        raise PlanError("invalid-plan", "shots must be a non-empty list (the count is yours)")
    resolved, starts, seen, cue_ids = [], {}, set(), set()
    for i, shot in enumerate(shots):
        sid = shot.get("id")
        if not sid or sid in seen or not shot.get("purpose"):
            raise PlanError("invalid-plan", f"shot {i}: needs a unique id and a purpose")
        seen.add(sid)
        start = r.anchor(shot["start"], f"shot {sid} start") if i else dict(sample=0, seconds=0.0, kind="bounds", label="narration-start", timing_source="narration_bounds")
        if i and "start" not in shot:
            raise PlanError("invalid-plan", f"shot {sid}: shots after the first need a start anchor")
        if i and start["sample"] <= resolved[-1]["start"]["sample"]:
            raise PlanError("cue-order", f"shot {sid} starts at or before the previous shot")
        starts[sid] = start["sample"]
        resolved.append(dict(shot, start=start))
    for i, shot in enumerate(resolved):
        end = resolved[i + 1]["start"]["sample"] if i + 1 < len(resolved) else r.count
        shot["end"] = dict(sample=end, seconds=round(end / r.rate, 4))
        if (end - shot["start"]["sample"]) / r.rate < MIN_SHOT_SECONDS:
            raise PlanError("shot-too-short", f"shot {shot['id']} is shorter than {MIN_SHOT_SECONDS} s")
        objects = {o["id"]: o for o in shot.get("objects", []) if o.get("id")}
        for o in objects.values():
            if o.get("asset") and o["asset"] not in assets:
                raise PlanError("missing-reference", f"shot {shot['id']} object {o['id']}: unknown asset {o['asset']!r}")
            if o.get("motif") and o["motif"] not in motifs:
                raise PlanError("missing-reference", f"shot {shot['id']} object {o['id']}: unknown motif {o['motif']!r}")
        for key in ("cues", "camera"):
            out = []
            for j, item in enumerate(shot.get(key, [])):
                where = f"shot {shot['id']} {key}[{j}]"
                if key == "cues" and (item.get("object") not in objects or not item.get("action")):
                    raise PlanError("missing-reference", f"{where}: cue needs an object of this shot and an action")
                if key == "cues" and "id" in item:
                    if not isinstance(item["id"], str) or not CUE_ID.match(item["id"]) or item["id"] in cue_ids:
                        raise PlanError("invalid-plan", f"{where}: cue id must be unique and match {CUE_ID.pattern}")
                    cue_ids.add(item["id"])
                at = r.anchor(item.get("at"), where, starts)
                if not shot["start"]["sample"] <= at["sample"] <= end:
                    raise PlanError("cue-outside-shot", f"{where}: resolves to {at['seconds']} s, outside its shot ({shot['start']['seconds']}-{round(end / r.rate, 4)} s)")
                out.append(dict(item, at=at))
            times = [x["at"]["sample"] for x in out]
            if times != sorted(times):
                raise PlanError("cue-order", f"shot {shot['id']} {key} must be in time order")
            shot[key] = out
        if shot.get("transition") is not None and (i + 1 == len(resolved) or not shot["transition"].get("type") or not shot["transition"].get("reason")):
            raise PlanError("invalid-plan", f"shot {shot['id']}: a transition needs a following shot, a type and a reason")
    return dict(plan, shots=resolved, resolution=dict(
        timeline_sha256=None, audio_sha256=timeline["audio"]["sha256"], sample_rate=r.rate, sample_count=r.count,
        timing_status=timeline["validation"], record_sources=sorted({x["source"] for x in r.words + r.phrases if x["source"]}),
        run_id=timeline.get("run_id")))


def load_inputs(project, plan_rel):
    pj = json.loads((project / "project.json").read_text(encoding="utf-8"))
    try:
        plan = json.loads((project / plan_rel).read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as error:
        raise PlanError("invalid-plan", f"cannot read plan: {error}") from None
    ref = plan.get("narration") or {}
    nar = pj["stages"]["narration"]
    tl_out = next((o for o in nar["outputs"] if o["path"] == ref.get("timeline")), None)
    if nar["state"] != "completed" or not tl_out:
        raise PlanError("narration-not-verified", "plan.narration.timeline must be a verified output of the completed narration stage")
    tl_path = project / tl_out["path"]
    if sha(tl_path) != tl_out["sha256"]:
        raise PlanError("stale-narration", "the narration timeline changed since the narration stage completed")
    if ref.get("sha256") != tl_out["sha256"]:
        raise PlanError("stale-narration", "the plan was written against a different narration; review it against the current narration")
    timeline = json.loads(tl_path.read_text(encoding="utf-8"))
    validate_timeline(timeline, project)
    styles = [k for k in json.loads((SCRIPTS / "styles" / "registry.json").read_text(encoding="utf-8")) if not k.startswith("_")]
    resolved = validate_plan(plan, timeline, styles)
    resolved["resolution"]["timeline_sha256"] = tl_out["sha256"]
    resolved["resolution"]["timeline"] = tl_out["path"]
    return pj, resolved


def ledger(project, *args):
    done = subprocess.run([sys.executable, "-I", str(SCRIPTS / "project.py"), args[0], str(project), *map(str, args[1:])],
                          capture_output=True, text=True, encoding="utf-8")
    if done.returncode:
        raise PlanError("ledger-refused", done.stderr.strip())
    return json.loads(done.stdout)


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["validate", "resolve"])
    ap.add_argument("project")
    ap.add_argument("--plan", default="plan/creative-plan.json")
    ap.add_argument("--out", default="plan/resolved-plan.json")
    a = ap.parse_args(argv)
    project = Path(a.project).resolve()
    if project.is_relative_to(PACKAGE):
        raise PlanError("invalid-project", "projects must live outside the Skill package")
    if a.command == "validate":
        _, resolved = load_inputs(project, a.plan)
        return dict(valid=True, shots=len(resolved["shots"]), cues=sum(len(s.get("cues", [])) for s in resolved["shots"])), 0
    pj = json.loads((project / "project.json").read_text(encoding="utf-8"))
    if pj["stages"]["creative-plan"]["state"] != "running":
        ledger(project, "start", "creative-plan")
    evidence_path = project / "plan" / "plan-evidence.json"
    evidence_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        _, resolved = load_inputs(project, a.plan)
    except PlanError as error:
        evidence_path.write_text(json.dumps(dict(passed=False, code=error.code, error=str(error)), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        ledger(project, "fail", "creative-plan", "--reason", str(error), "--evidence", evidence_path)
        raise
    out = project / a.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(resolved, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    evidence = dict(passed=True, shots=len(resolved["shots"]), cues=sum(len(s.get("cues", [])) for s in resolved["shots"]),
                    camera_keys=sum(len(s.get("camera", [])) for s in resolved["shots"]), **resolved["resolution"])
    evidence_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ledger(project, "complete", "creative-plan", "--output", project / a.plan, "--output", out, "--evidence", evidence_path)
    return evidence, 0


if __name__ == "__main__":
    try:
        result, code = main(sys.argv[1:])
        print(json.dumps(result, ensure_ascii=True, indent=2))
        sys.exit(code)
    except PlanError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
