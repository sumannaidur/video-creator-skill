"""P014.4C focused project/ledger tests (generic artifacts only; no creative generation).

python -I scripts/tests/test_project.py [--work <folder outside the package>]
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-project-tests"))
work = Path(ap.parse_args().work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
tool, prefs = pkg / "scripts" / "project.py", pkg / "scripts" / "preferences.py"
results = []
snapshot = lambda: {p.relative_to(pkg).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(pkg.rglob("*")) if p.is_file()}
before = snapshot()


def check(name, ok, **detail):
    results.append(dict(name=name, ok=bool(ok), **detail))
    print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(detail)[:260])


def run(*args):
    done = subprocess.run([sys.executable, "-I", str(tool), *map(str, args)], capture_output=True, text=True, encoding="utf-8")
    try:
        out = json.loads(done.stdout) if done.stdout.strip() else {}
    except ValueError:
        out = {}
    return done.returncode, out, done.stderr.strip()


def resolve(file, *items):
    subprocess.run([sys.executable, "-I", str(prefs), "resolve", *items, "--store", str(work / "prefs.json"), "--json", str(file)],
                   capture_output=True, check=True)
    return file


def artifact(project, rel, text):
    path = Path(project) / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def evidence(project, name, passed=True):
    return artifact(project, f"qa/{name}.json", json.dumps({"passed": passed}))


def state(project):
    return json.loads((Path(project) / "project.json").read_text(encoding="utf-8"))


cfg = resolve(work / "config-a.json", "locale=hi-IN", "style=auto")
projects = work / "projects"

# Initialization.
code, out, err = run("init", "--root", projects, "--topic", "A generic test topic", "--config", cfg)
P = out.get("created", {}).get("project")
m = state(P) if P else {}
check("init creates a versioned, uniquely identified project with topic, config and provenance",
      code == 0 and m["schema"] == "video-creator.project" and m["version"] == 1 and m["id"].startswith("vc-")
      and m["config"]["effective"]["locale"] == "hi-IN" and m["config"]["source"]["locale"] == "request"
      and list(m["stages"]) == ["research", "script", "narration", "creative-plan", "visual-production", "sound", "review-delivery"]
      and all(s["state"] == "pending" for s in m["stages"].values()), id=m.get("id"))
code2, out2, err2 = run("init", "--root", projects, "--topic", "x", "--config", cfg, "--id", m["id"])
code3, out3, err3 = run("init", "--root", pkg / "projects", "--topic", "x")
check("existing project and in-package root are refused", code2 == 1 and "never overwritten" in err2 and code3 == 1 and "outside the Skill package" in err3)

# Dependency enforcement.
code, out, err = run("start", P, "script")
check("a stage cannot start before its dependencies complete", code == 1 and "blocked" in err and state(P)["stages"]["script"]["state"] == "pending")

# Transitions and completion evidence.
run("start", P, "research")
a1 = artifact(P, "research/claims.json", '{"claims": []}')
r_no_ev = run("complete", P, "research", "--output", a1)
r_bad_ev = run("complete", P, "research", "--output", a1, "--evidence", evidence(P, "research-bad", False))
r_missing = run("complete", P, "research", "--output", Path(P) / "research/nope.json", "--evidence", evidence(P, "research"))
r_outside = run("complete", P, "research", "--output", work / "prefs-outside.json", "--evidence", evidence(P, "research"))
code, out, err = run("complete", P, "research", "--output", a1, "--evidence", evidence(P, "research"))
check("completion requires an existing in-project artifact and passing evidence",
      r_no_ev[0] == 1 and r_bad_ev[0] == 1 and r_missing[0] == 1 and r_outside[0] == 1 and code == 0
      and state(P)["stages"]["research"]["outputs"][0]["path"] == "research/claims.json")
code, out, err = run("start", P, "research")
check("a completed, verified stage is not repeated", code == 1 and "not repeated" in err)
for stage, rel in (("script", "script/script.json"), ("narration", "narration/narration.timeline.json")):
    run("start", P, stage); run("complete", P, stage, "--output", artifact(P, rel, stage), "--evidence", evidence(P, stage))
code, nxt, err = run("next", P)
check("next names the first unfinished stage and the verified stages it reuses", nxt.get("stage") == "creative-plan" and nxt["ready"]
      and nxt["reuse"] == ["research", "script", "narration"], next=nxt.get("stage"))

# Interrupted-stage recovery: a stage left running is resumable; completed stages are reused.
run("start", P, "creative-plan")
code, nxt, err = run("next", P)
code2, out2, err2 = run("start", P, "creative-plan")
check("an interrupted running stage is resumable without repeating earlier stages",
      nxt.get("stage") == "creative-plan" and nxt["state"] == "running" and nxt["resumable"] and code2 == 0
      and state(P)["stages"]["creative-plan"]["attempts"] == 2 and state(P)["stages"]["research"]["attempts"] == 1)

# Failure and blocked states keep their reasons.
run("fail", P, "creative-plan", "--reason", "plan validation failed")
f = state(P)["stages"]["creative-plan"]
run("block", P, "sound", "--reason", "music asset rights unknown")
b = state(P)["stages"]["sound"]
check("failed and blocked states record reasons", f["state"] == "failed" and f["failure"]["reason"] == "plan validation failed"
      and b["state"] == "blocked" and b["failure"]["reason"] == "music asset rights unknown")

# Artifact corruption invalidates the stage and everything downstream.
run("start", P, "creative-plan"); run("complete", P, "creative-plan", "--output", artifact(P, "plan/plan.json", "plan"), "--evidence", evidence(P, "plan"))
Path(P, "script/script.json").write_text("edited outside the ledger", encoding="utf-8")
code, out, err = run("verify", P)
st = out.get("stages", {})
check("a changed artifact invalidates its stage and downstream stages", st.get("research") == "completed" and st.get("script") == "invalidated"
      and st.get("narration") == "invalidated" and st.get("creative-plan") == "invalidated", stages=st)
code, nxt, err = run("next", P)
check("next resumes at the earliest invalidated stage", nxt.get("stage") == "script" and "artifact changed" in (nxt.get("invalidated") or {}).get("reason", ""))

# Re-completing upstream with identical output restores nothing automatically, but changed output re-invalidates downstream.
run("start", P, "script"); run("complete", P, "script", "--output", Path(P, "script/script.json"), "--evidence", evidence(P, "script2"))
check("downstream stays invalidated after upstream changes", state(P)["stages"]["narration"]["state"] == "invalidated")

# Configuration change invalidates only stages that depend on the changed keys.
Q = run("init", "--root", projects, "--topic", "Second generic topic", "--config", cfg)[1]["created"]["project"]
for stage, rel in (("research", "r.json"), ("script", "s.json"), ("narration", "n.json")):
    run("start", Q, stage); run("complete", Q, stage, "--output", artifact(Q, rel, stage), "--evidence", evidence(Q, stage))
code, out, err = run("reconfigure", Q, "--config", resolve(work / "config-b.json", "locale=hi-IN", "style=auto", "narration.voice=hf_alpha"))
st = out.get("stages", {})
check("a narration-only setting change invalidates narration but keeps research and script", st.get("research") == "completed"
      and st.get("script") == "completed" and st.get("narration") == "invalidated", stages=st)
code, out, err = run("reconfigure", Q, "--config", resolve(work / "config-c.json", "locale=hi-IN", "style=auto", "narration.voice=hf_alpha", "fps=25"))
check("a rendering-only setting change does not touch completed upstream stages", out.get("stages", {}).get("research") == "completed")

# Human review and publication are separate from technical completion.
code1, _, e1 = run("approve", Q, "human-review", "--by", "tester")
check("human approval is refused before technical completion", code1 == 1 and "technically completed" in e1)
R = run("init", "--root", projects, "--topic", "Third", "--config", cfg)[1]["created"]["project"]
for stage in ["research", "script", "narration", "creative-plan", "visual-production", "sound", "review-delivery"]:
    run("start", R, stage); run("complete", R, stage, "--output", artifact(R, f"out/{stage}.txt", stage), "--evidence", evidence(R, stage))
n = run("next", R)[1]
p1 = run("approve", R, "publication", "--by", "tester")
h = run("approve", R, "human-review", "--by", "tester", "--notes", "reviewed in full")
p2 = run("approve", R, "publication", "--by", "tester")
check("technical completion, human review and publication are distinct gates", n.get("technical_completion") and n["approvals"]["human_review"]["status"] == "pending"
      and p1[0] == 1 and h[0] == 0 and p2[0] == 0 and state(R)["approvals"]["publication"]["status"] == "approved")
Path(R, "out/sound.txt").write_text("changed", encoding="utf-8")
run("verify", R)
check("changing an artifact after approval revokes the approvals", state(R)["approvals"]["human_review"]["status"] == "revoked"
      and state(R)["stages"]["review-delivery"]["state"] == "invalidated")

# Single writer, atomic writes, corrupt manifests.
lock = Path(Q) / "project.lock"
lock.write_text(json.dumps({"pid": os.getpid()}))
code, out, err = run("verify", Q)
lock.write_text(json.dumps({"pid": 2147480000}))
code2, out2, err2 = run("verify", Q)
check("a live lock refuses writers; a stale lock is recovered and released", code == 1 and "locked" in err and code2 == 0 and not lock.exists()
      and not list(Path(Q).glob(".project-*")))
bad = artifact(work, "broken/project.json", "{broken")
digest_before = hashlib.sha256(bad.read_bytes()).hexdigest()
code, out, err = run("verify", bad.parent)
check("a corrupt manifest is refused and left untouched", code == 1 and hashlib.sha256(bad.read_bytes()).hexdigest() == digest_before)

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "project-test-results.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - results: {work / 'project-test-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
