#!/usr/bin/env python3
"""Repository consistency checks for CI (P026.4; standard library only).

    python tools/check_repository.py [--package skills/video-creator]

Checks: Agent Skills SKILL.md metadata, relative Markdown links and anchors, the canonical Apache-2.0 LICENSE text and its
package copy, identical THIRD_PARTY_NOTICES copies, and that the package contains no machine-specific paths or
references to the repository's experiments. Exits 1 on any failure.
"""
import argparse
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APACHE_SHA256 = "cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30"   # https://www.apache.org/licenses/LICENSE-2.0.txt
failures, passes = [], 0


def check(name, ok, detail=""):
    global passes
    print(("PASS " if ok else "FAIL ") + name + (f": {detail}" if detail and not ok else ""))
    if ok:
        passes += 1
    else:
        failures.append(name)


def skill_metadata(pkg):
    text = (pkg / "SKILL.md").read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n", text.replace("\r\n", "\n"), re.S)
    check("SKILL.md has YAML frontmatter", bool(m))
    if not m:
        return
    fm = m.group(1)
    field = lambda k: (re.search(rf"^{k}: (.*)$", fm, re.M) or [None, None])[1]
    keys = re.findall(r"^([a-z-]+):", fm, re.M)
    name, desc, compat = field("name"), field("description"), field("compatibility")
    check("SKILL.md keys within the Agent Skills specification", set(keys) <= {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}, str(keys))
    check("name: 1-64 lowercase letters, digits and hyphens, matching the folder", bool(name and re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name) and len(name) <= 64 and name == pkg.name), str(name))
    check("description: 1-1024 characters", bool(desc) and len(desc) <= 1024, str(len(desc or "")))
    check("compatibility: at most 500 characters", compat is None or len(compat) <= 500, str(len(compat or "")))
    check("license field names Apache-2.0", "Apache-2.0" in (field("license") or ""))


def links():
    bad = []
    for md in sorted(ROOT.rglob("*.md")):
        rel = md.relative_to(ROOT)
        if rel.parts[0] in ("experiments", "archive", "release", "node_modules") or ".git" in rel.parts:
            continue
        text = md.read_text(encoding="utf-8", errors="replace")
        heads = {re.sub(r"[^a-z0-9 -]", "", h.lower()).replace(" ", "-") for h in re.findall(r"^#+ (.+)$", text, re.M)}
        for target in re.findall(r"\]\(([^)\s]+)\)", text):
            if target.startswith(("http://", "https://", "mailto:")):
                continue
            path, _, anchor = target.partition("#")
            # Archived history may cite experiment files recoverable from Git (docs/history/experiments-index.md).
            if path and rel.parts[:2] == ("docs", "history") and (md.parent / path).resolve().is_relative_to(ROOT / "experiments"):
                continue
            if path and not (md.parent / path).exists():
                bad.append(f"{rel} -> {target}")
            elif not path and anchor and anchor not in heads:
                bad.append(f"{rel} -> #{anchor}")
    check("relative Markdown links and anchors resolve", not bad, "; ".join(bad[:8]))


def licensing(pkg):
    digest = lambda p: hashlib.sha256(p.read_bytes().replace(b"\r\n", b"\n")).hexdigest() if p.is_file() else None
    check("LICENSE is the canonical Apache-2.0 text", digest(ROOT / "LICENSE") == APACHE_SHA256)
    check("package LICENSE identical to the root LICENSE", digest(pkg / "LICENSE") == APACHE_SHA256)
    check("package THIRD_PARTY_NOTICES identical to the root copy", digest(ROOT / "THIRD_PARTY_NOTICES.md") is not None
          and digest(ROOT / "THIRD_PARTY_NOTICES.md") == digest(pkg / "THIRD_PARTY_NOTICES.md"))


def package_hygiene(pkg):
    machine = re.compile(r"[A-Za-z]:[\\/]+Users[\\/]+(?!<)[A-Za-z0-9._-]+|/home/(?!<)[a-z0-9._-]+/|/Users/(?!<|Shared)[A-Za-z0-9._-]+/")
    hits, refs = [], []
    for p in sorted(pkg.rglob("*")):
        if not p.is_file() or "__pycache__" in p.parts or p.suffix not in (".py", ".mjs", ".js", ".json", ".md", ".txt", ".css", ".html"):
            continue
        if p.name.startswith("test-") and p.name.endswith("results.json"):   # local test output: git-ignored, excluded from releases
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        if machine.search(text):
            hits.append(str(p.relative_to(pkg)))
        if p.suffix in (".py", ".mjs", ".js") and "tests" not in p.parts:
            body = re.sub(r'\A\s*("""|\'\'\').*?\1', "", text, count=1, flags=re.S) if p.suffix == ".py" else text   # module docstring: provenance notes
            code = "\n".join(l for l in body.splitlines() if not l.lstrip().startswith(("#", "//", "*")) and "Packaged from" not in l)
            if re.search(r"experiments[\\/]", code):
                refs.append(str(p.relative_to(pkg)))
    check("package has no machine-specific user paths", not hits, ", ".join(hits[:8]))
    check("package runtime code does not reference repository experiments", not refs, ", ".join(refs[:8]))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--package", default=str(ROOT / "skills" / "video-creator"))
    pkg = Path(ap.parse_args().package).resolve()
    skill_metadata(pkg)
    links()
    licensing(pkg)
    package_hygiene(pkg)
    print(f"{passes} passed, {len(failures)} failed, 0 skipped")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
