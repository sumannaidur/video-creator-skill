"""Unified QA report and delivery packet (standard library + FFmpeg/FFprobe; reuses the existing validators).

  python scripts/qa.py report <project> --video <final.mp4> --render-evidence <render .../<name>-evidence.json>
                              --preflight <preflight.json> --mix-evidence <mix.evidence.json>
                              [--captions captions/captions.json] [--out-dir qa] [--complete]

Collects the ledger's stage evidence and re-checks that every artifact belongs to the current project and configuration:
stage states and hashes (project.py verify), narration timeline contract, the current passed visual preflight bound to the
render, caption artifact (captions.py check), mix evidence and narration sync (mix_audio.py --check-sync), and the final
MP4 (FFprobe properties against the resolved configuration, frame count, video stream preserved by the mux, full decode).
Writes <out-dir>/qa-report.json, delivery-report.md and human-review-checklist.md. With --complete, a technically passing
report completes the ledger's review-delivery stage (a failing one fails it). It never approves human review or publication.
Exit codes: 0 technical checks passed, 1 failed (or any mandatory check missing, stale or unsupported), 2 usage.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
SCRIPTS = Path(__file__).resolve().parent
PACKAGE = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS / "narration"))
from timeline import validate as validate_timeline  # noqa: E402

PRE_DELIVERY = ["research", "script", "narration", "creative-plan", "visual-production", "sound"]
HEIGHT = {"vertical": lambda r: (r, r * 16 // 9), "horizontal": lambda r: (r * 16 // 9, r)}
CHECKLIST = [
    ("factual-accuracy", "Every claim on screen and in narration matches its verified source; nothing implies more than the sources support"),
    ("storytelling", "The hook is answered; ideas progress clearly; the ending pays off the opening"),
    ("visual-composition", "Each shot has one clear job; framing, balance and empty space work at phone size"),
    ("illustration-quality", "Artwork is original, coherent with the style and free of distracting errors"),
    ("motion", "Motion supports the spoken explanation; timing, easing and transitions feel deliberate; no static slides"),
    ("pronunciation", "Every word is pronounced correctly for the locale (native listener)"),
    ("accent", "The accent matches the requested locale and audience (native listener)"),
    ("narration-naturalness", "Rhythm, pauses and intonation sound natural, not synthetic (native listener)"),
    ("timing-alignment", "Visual cues and captions land on the spoken words (timings are not acoustically verified)"),
    ("caption-readability", "Captions read naturally: wording, line breaks, compounds and reading speed (native reader)"),
    ("audio-balance", "Narration stays clearly intelligible over music and effects; levels feel comfortable"),
    ("licensing", "Fonts, voice and model terms, music, effects and any external assets are cleared for the intended use"),
]


class QAError(Exception):
    pass


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(args, **kw):
    return subprocess.run([str(a) for a in args], capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)


class Report:
    def __init__(self):
        self.checks = {}

    def add(self, name, status, detail=None, evidence=None):
        assert status in ("passed", "failed", "missing", "stale", "unsupported")
        self.checks[name] = dict(status=status, detail=detail, evidence=evidence)
        return status == "passed"


def rel(project, path):
    p = Path(path)
    p = (project / p) if not p.is_absolute() else p
    try:
        return p.resolve().relative_to(project).as_posix()
    except ValueError:
        raise QAError(f"{path} is outside the project") from None


def ledger_file(stages, name, path, kinds=("outputs", "evidence")):
    """True when path is a recorded output or the evidence of stage `name` with its recorded hash."""
    s = stages[name]
    if "outputs" in kinds and any(o["path"] == path for o in s["outputs"]):
        return True
    return "evidence" in kinds and (s.get("validation") or {}).get("evidence") == path


def load_json(project, path):
    try:
        return json.loads((project / path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def check_stages(project, r):
    done = run([sys.executable, "-I", SCRIPTS / "project.py", "verify", project])
    if done.returncode:
        r.add("ledger", "failed", done.stderr.strip()[-300:])
        return None
    data = json.loads((project / "project.json").read_text(encoding="utf-8"))
    for name in PRE_DELIVERY:
        s = data["stages"][name]
        status = {"completed": "passed", "invalidated": "stale", "failed": "failed", "blocked": "failed"}.get(s["state"], "missing")
        detail = s["state"] + (f": {(s.get('invalidated') or {}).get('reason') or (s.get('failure') or {}).get('reason')}" if s["state"] in ("invalidated", "failed", "blocked") else "")
        if status == "passed":
            v = s.get("validation") or {}
            ev = project / v.get("evidence", "")
            if not v.get("evidence") or not ev.is_file():
                status, detail = "missing", "stage evidence file is missing"
            elif sha(ev) != v.get("evidence_sha256"):
                status, detail = "stale", "stage evidence changed after the stage completed"
            elif not (lambda e: e and (e.get("passed") is True or e.get("failures") == []))(load_json(project, v["evidence"])):
                status, detail = "failed", "stage evidence does not record a pass"
        r.add(f"stage:{name}", status, detail, (s.get("validation") or {}).get("evidence"))
    return data


def ffprobe(video):
    out = run(["ffprobe", "-v", "error", "-count_frames", "-show_entries",
               "stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames,duration:format=duration", "-of", "json", video])
    return json.loads(out.stdout) if out.returncode == 0 else None


def video_md5(path):
    out = run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", path, "-map", "0:v", "-c", "copy", "-f", "md5", "-"])
    return out.stdout.strip() if out.returncode == 0 else None


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["report"])
    ap.add_argument("project")
    for k in ("video", "render-evidence", "preflight", "mix-evidence"):
        ap.add_argument(f"--{k}", required=True)
    ap.add_argument("--captions", default="captions/captions.json")
    ap.add_argument("--out-dir", default="qa")
    ap.add_argument("--complete", action="store_true")
    a = ap.parse_args(argv)
    project = Path(a.project).resolve()
    if project.is_relative_to(PACKAGE) or not (project / "project.json").is_file():
        raise QAError("give a project folder outside the Skill package")
    r = Report()
    data = check_stages(project, r)
    stages = data["stages"] if data else {}
    cfg = data["config"]["effective"] if data else {}
    paths = {k: rel(project, getattr(a, k.replace("-", "_"))) for k in ("video", "render-evidence", "preflight", "mix-evidence")}
    tools = all(shutil.which(t) for t in ("ffmpeg", "ffprobe"))

    # Ownership: every file named on the command line is a recorded, current artifact of this project.
    owners = {"video": ("sound", "visual-production"), "render-evidence": ("visual-production",), "preflight": ("visual-production",), "mix-evidence": ("sound",)}
    for key, names in owners.items():
        f = project / paths[key]
        if not f.is_file():
            r.add(f"artifact:{key}", "missing", paths[key])
        elif not stages or not any(ledger_file(stages, n, paths[key]) for n in names):
            r.add(f"artifact:{key}", "failed", f"{paths[key]} is not a recorded output or evidence of {' / '.join(names)}")
        else:
            r.add(f"artifact:{key}", "passed", paths[key])
    render_ev, pre, mix = (load_json(project, paths[k]) or {} for k in ("render-evidence", "preflight", "mix-evidence"))
    narr_out = {o["path"]: o["sha256"] for o in stages.get("narration", {}).get("outputs", [])}
    plan_out = {o["path"]: o["sha256"] for o in stages.get("creative-plan", {}).get("outputs", [])}
    timeline_path = next((p for p in narr_out if p.endswith(".timeline.json")), None)
    wav_path = next((p for p in narr_out if p.endswith(".wav")), None)

    # Narration timeline contract (reused validator).
    timeline = load_json(project, timeline_path) if timeline_path else None
    try:
        validate_timeline(timeline, project) if timeline else None
        r.add("narration-timeline", "passed" if timeline else "missing", timeline_path)
    except ValueError as error:
        r.add("narration-timeline", "failed", str(error))

    # Visual preflight: passed, complete, and the exact one the final render was gated on.
    if not pre:
        r.add("visual-preflight", "missing", "production delivery needs a passed visual preflight")
    elif pre.get("status") == "incomplete":
        unsupported = [k for k, v in pre.get("checks", {}).items() if v["status"] == "unsupported"]
        r.add("visual-preflight", "unsupported", f"backend could not perform: {', '.join(unsupported)}", paths["preflight"])
    elif pre.get("status") != "passed":
        r.add("visual-preflight", "failed", f"{len(pre.get('defects', []))} defect(s)", paths["preflight"])
    elif (render_ev.get("preflight") or {}).get("binding") != pre["binding"]["sha256"]:
        r.add("visual-preflight", "stale", "the final render was not gated on this preflight (render with --preflight)", paths["preflight"])
    elif timeline_path and pre["binding"].get("timeline") != narr_out.get(timeline_path):
        r.add("visual-preflight", "stale", "preflight was run against a different narration timeline", paths["preflight"])
    elif pre["binding"].get("plan") and pre["binding"]["plan"] not in plan_out.values():
        r.add("visual-preflight", "stale", "preflight was run against a different resolved plan", paths["preflight"])
    else:
        r.add("visual-preflight", "passed", f"{pre['frames']['inspected']} frames at {pre['frames']['fps']} fps", paths["preflight"])

    # Render evidence (renderer's own media checks).
    if not render_ev:
        r.add("render-media-checks", "missing")
    else:
        r.add("render-media-checks", "passed" if render_ev.get("failures") == [] else "failed", render_ev.get("failures"))

    # Captions (reused validator) and burn-in binding.
    caps = cfg.get("captions") or {}
    if not caps.get("enabled", True):
        r.add("captions", "passed", "captions disabled by configuration")
        cap_doc = None
    else:
        done = run([sys.executable, "-I", SCRIPTS / "captions.py", "check", project, "--captions", a.captions])
        cap_doc = load_json(project, a.captions)
        if done.returncode:
            text = done.stderr.strip()
            r.add("captions", "stale" if "stale" in text else "missing" if not cap_doc else "failed", text[-300:])
        elif caps.get("burn_in", True) and (render_ev.get("inputs", {}).get("captions") or {}).get("sha256") != sha(project / a.captions):
            r.add("captions", "stale", "the final render did not burn in this caption artifact (render with --captions)")
        else:
            r.add("captions", "passed", f"{len(cap_doc['cues'])} cues; files: {', '.join(sorted(cap_doc['files']))}", a.captions)

    # Audio: mix evidence, bound to the current narration and the final video, plus an independent sync re-check.
    if not mix:
        r.add("audio-mix", "missing")
    elif not mix.get("passed") or not all(mix.get("checks", {}).values()):
        r.add("audio-mix", "failed", {k: v for k, v in mix.get("checks", {}).items() if not v})
    elif wav_path and mix["narration"]["sha256"] != narr_out.get(wav_path):
        r.add("audio-mix", "stale", "the mix used a different narration WAV")
    else:
        r.add("audio-mix", "passed", dict(lufs=round(mix["output"].get("integrated", 0), 2), true_peak=mix["output"].get("true_peak"),
                                           speech_over_bed_lu=round(mix["speech_over_bed_lu"], 1), sync_lag_ms=mix["sync"].get("lag_ms")))
    # The mixer writes <output>.evidence.json next to its output; spec-relative paths resolve from the spec folder.
    mix_dir = (project / paths["mix-evidence"]).parent
    for _ in Path((mix.get("output") or {}).get("path", "x")).parent.parts:
        mix_dir = mix_dir.parent
    if mix and tools and wav_path:
        mixed, bed = mix_dir / mix["output"]["path"], (mix_dir / mix["output"]["path"]).with_suffix(".bed.wav")
        done = run([sys.executable, "-I", SCRIPTS / "audio" / "mix_audio.py", "--check-sync", project / wav_path, mixed, *([bed] if bed.exists() else [])])
        r.add("narration-sync", "passed" if done.returncode == 0 else "failed", done.stdout.strip()[-200:] or done.stderr.strip()[-200:])
    else:
        r.add("narration-sync", "unsupported" if not tools else "missing", "FFmpeg unavailable" if not tools else "mix or narration missing")

    # Final MP4 against the resolved configuration.
    video = project / paths["video"]
    if not tools:
        r.add("final-video", "unsupported", "FFprobe/FFmpeg unavailable: properties and decode cannot be verified")
    elif not video.is_file():
        r.add("final-video", "missing", paths["video"])
    else:
        probe = ffprobe(video)
        v = next((s for s in (probe or {}).get("streams", []) if s["codec_type"] == "video"), {})
        au = next((s for s in (probe or {}).get("streams", []) if s["codec_type"] == "audio"), {})
        res, orient, fps = cfg.get("resolution"), cfg.get("orientation"), cfg.get("fps")
        want = HEIGHT.get(orient, lambda x: None)(res) if isinstance(res, int) else None
        problems = []
        if v.get("codec_name") != "h264" or au.get("codec_name") != "aac" or v.get("pix_fmt") != "yuv420p":
            problems.append(f"codecs {v.get('codec_name')}/{au.get('codec_name')} {v.get('pix_fmt')}")
        if want and (v.get("width"), v.get("height")) != want:
            problems.append(f"size {v.get('width')}x{v.get('height')} != configured {want[0]}x{want[1]}")
        if isinstance(fps, int) and v.get("r_frame_rate") != f"{fps}/1":
            problems.append(f"frame rate {v.get('r_frame_rate')} != configured {fps}")
        if render_ev.get("frames") is not None and int(v.get("nb_read_frames") or -1) != render_ev["frames"]:
            problems.append(f"{v.get('nb_read_frames')} frames != {render_ev['frames']} rendered")
        if abs(float(v.get("duration") or 0) - float(au.get("duration") or 0)) > 1 / max(1, fps if isinstance(fps, int) else 30) + .03:
            problems.append("video and audio durations differ")
        if timeline and abs(float(v.get("duration") or 0) - timeline["audio"]["sample_count"] / timeline["audio"]["sample_rate"]) > .1:
            problems.append("duration differs from the narration")
        mux = mix.get("video") or {}
        if mux.get("sha256") != sha(video):
            problems.append("this MP4 is not the one the mix evidence produced")
        src = mix_dir / mux.get("input", "") if mux.get("input") else None
        if not (src and src.is_file() and video_md5(src) == video_md5(video)):
            problems.append("video stream not preserved from the rendered MP4 through the mux")
        decode = run(["ffmpeg", "-hide_banner", "-v", "error", "-i", video, "-f", "null", "-"])
        if decode.returncode or decode.stderr.strip():
            problems.append("full decode reported errors")
        r.add("final-video", "failed" if problems else "passed", problems or dict(size=f"{v.get('width')}x{v.get('height')}", fps=v.get("r_frame_rate"),
              frames=v.get("nb_read_frames"), duration=v.get("duration"), codecs=f"{v.get('codec_name')}/{au.get('codec_name')}"), paths["video"])

    # Provenance: recorded where available, explicitly missing otherwise. Never a licensing approval.
    narr_ev = load_json(project, (stages.get("narration", {}).get("validation") or {}).get("evidence", "")) or {}
    pick = lambda *xs: next((x for x in xs if x not in (None, "", "auto")), None)
    nar_cfg = cfg.get("narration") or {}
    present = render_ev.get("presentation") or {}
    provenance = dict(
        narration_provider=pick(narr_ev.get("provider"), (timeline or {}).get("timing", {}).get("provider"), nar_cfg.get("provider")) or "MISSING",
        voice=pick(narr_ev.get("voice"), nar_cfg.get("voice")) or "MISSING",
        model=pick(narr_ev.get("model"), (timeline or {}).get("timing", {}).get("model")) or "MISSING (not recorded by the narration stage)",
        timing_method=(timeline or {}).get("timing", {}).get("method") or "MISSING", timing_status=(timeline or {}).get("validation") or "MISSING",
        fonts=dict(caption=present.get("captionFont") or "MISSING", label=present.get("labelFont") or "MISSING",
                   note="system fonts as reported by the browser; font licensing is not reviewed"),
        audio_assets=mix.get("provenance") or ("no music or effects assets recorded (narration-only mix)" if mix else "MISSING"),
        visual_assets="topic artwork: see the creative plan's assets list" if plan_out else "MISSING",
        renderer=dict(browser=render_ev.get("browser"), style=(render_ev.get("settings") or {}).get("style")))

    research = stages.get("research", {}).get("outputs", [])
    deliverables = dict(video=paths["video"], subtitles=sorted(f["path"] for f in ((cap_doc or {}).get("files") or {}).values()),
                        sources=[o["path"] for o in research], supporting=sorted({paths["render-evidence"], paths["preflight"], paths["mix-evidence"],
                                                                                   *(o["path"] for n in PRE_DELIVERY for o in stages.get(n, {}).get("outputs", []))}))
    technical = all(c["status"] == "passed" for c in r.checks.values())
    approvals = data["approvals"] if data else {}
    human = approvals.get("human_review", {}).get("status", "pending")
    publication = approvals.get("publication", {}).get("status", "not-approved")
    report = dict(schema="video-creator.qa-report", version=1, project=data["id"] if data and "id" in data else project.name,
                  config_sha256=(data or {}).get("config", {}).get("sha256"),
                  technical=dict(status="passed" if technical else "failed", checks=r.checks,
                                 blocking=[k for k, c in r.checks.items() if c["status"] != "passed"]),
                  human_review=dict(status=human, checklist=[dict(id=i, question=q, status="pending") for i, q in CHECKLIST],
                                    note="never approved automatically; record with project.py approve human-review"),
                  publication=dict(status=publication, ready=technical and human == "approved" and publication == "approved",
                                   note="needs technical pass, approved human review (including licensing) and an explicit publication approval"),
                  provenance=provenance, deliverables=deliverables, passed=technical)
    out = project / a.out_dir
    out.mkdir(parents=True, exist_ok=True)
    (out / "qa-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [f"# Delivery report: technical {report['technical']['status'].upper()}", "",
             f"- Human review: **{human}** (never automatic). Publication: **{publication}**; ready to publish: **{report['publication']['ready']}**.", "",
             "| Check | Status | Detail |", "|---|---|---|",
             *[f"| {k} | {c['status']} | {json.dumps(c['detail'], ensure_ascii=False)[:160] if c['detail'] is not None else ''} |" for k, c in r.checks.items()], "",
             "## Deliverables", f"- Video: `{deliverables['video']}`", f"- Subtitles: {', '.join(f'`{s}`' for s in deliverables['subtitles']) or 'none'}",
             f"- Sources: {', '.join(f'`{s}`' for s in deliverables['sources']) or 'MISSING'}", f"- Supporting artifacts: {len(deliverables['supporting'])} files (see qa-report.json)", "",
             "## Provenance (recorded, not reviewed)", *[f"- {k}: {json.dumps(v, ensure_ascii=False)[:200]}" for k, v in provenance.items()], "",
             "Technical checks do not judge artistic quality, native-language quality, acoustic timing accuracy or licensing."]
    (out / "delivery-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (out / "human-review-checklist.md").write_text("\n".join(["# Human review checklist", "",
        "Every item needs a person; none is approved by the tools. Record the outcome with `project.py approve human-review --by <name>` (or `--reject`).", "",
        *[f"- [ ] **{i}**: {q}" for i, q in CHECKLIST]]) + "\n", encoding="utf-8")
    if a.complete:
        files = [out / "qa-report.json", out / "delivery-report.md", out / "human-review-checklist.md"]
        if stages.get("review-delivery", {}).get("state") != "running":
            run([sys.executable, "-I", SCRIPTS / "project.py", "start", project, "review-delivery"])
        if technical:
            done = run([sys.executable, "-I", SCRIPTS / "project.py", "complete", project, "review-delivery", *sum((["--output", f] for f in files), []), "--evidence", out / "qa-report.json"])
        else:
            done = run([sys.executable, "-I", SCRIPTS / "project.py", "fail", project, "review-delivery", "--reason", "QA blocking: " + ", ".join(report["technical"]["blocking"]), "--evidence", out / "qa-report.json"])
        if done.returncode:
            raise QAError("ledger: " + done.stderr.strip())
    return dict(technical=report["technical"]["status"], blocking=report["technical"]["blocking"], human_review=human,
                publication_ready=report["publication"]["ready"], report=(out / "qa-report.json").relative_to(project).as_posix()), 0 if technical else 1


if __name__ == "__main__":
    try:
        result, code = main(sys.argv[1:])
        print(json.dumps(result, ensure_ascii=True, indent=2))
        sys.exit(code)
    except QAError as error:
        print(f"[qa] {error}", file=sys.stderr)
        sys.exit(1)
