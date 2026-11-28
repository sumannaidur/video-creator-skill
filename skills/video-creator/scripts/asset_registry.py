"""Local source-only asset registry. Does not execute source or certify reviews."""
import argparse
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile

PACKAGE = Path(__file__).resolve().parents[1]
MAX_SOURCE = 256 * 1024
MAX_RECORD = 2 * 1024 * 1024
SCHEMA = "video-creator.source-asset"
ID = re.compile(r"[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*", re.ASCII)
VERSION = re.compile(r"(?:0|[1-9][0-9]{0,5})\.(?:0|[1-9][0-9]{0,5})\.(?:0|[1-9][0-9]{0,5})")
FIELDS = {"id", "version", "category", "description", "tags", "capabilities",
          "parameters", "dependencies", "origin"}
CATEGORIES = {"object", "character", "environment", "material", "motion", "sound", "technique"}


class AssetError(Exception):
    pass


def require(ok, message):
    if not ok:
        raise AssetError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical(data):
    return (json.dumps(data, sort_keys=True, ensure_ascii=False, allow_nan=False,
                       separators=(",", ":")) + "\n").encode("utf-8")


def short_text(value, limit=500):
    return isinstance(value, str) and bool(value.strip()) and len(value) <= limit


def identity(asset_id, version):
    require(isinstance(asset_id, str) and len(asset_id) <= 80 and ID.fullmatch(asset_id),
            "invalid asset id")
    require(isinstance(version, str) and VERSION.fullmatch(version), "invalid version")
    return "asset-" + asset_id + "@" + version


def read_bytes(path, limit):
    require(not path.is_symlink() and path.is_file(), "missing or unsafe file: " + str(path))
    with path.open("rb") as f:
        data = f.read(limit + 1)
    require(len(data) <= limit, "file exceeds size limit: " + str(path))
    return data


def read_json(path):
    return json.loads(read_bytes(path, MAX_RECORD).decode("utf-8"))


def validate_metadata(meta):
    require(isinstance(meta, dict) and set(meta) == FIELDS, "invalid metadata fields")
    identity(meta["id"], meta["version"])
    require(isinstance(meta["category"], str) and meta["category"] in CATEGORIES, "invalid category")
    require(short_text(meta["description"]), "invalid description")
    require(meta["origin"] == "original", "only original procedural source is supported")
    for key in ("tags", "capabilities", "parameters"):
        values = meta[key]
        require(isinstance(values, list) and len(values) <= 32
                and all(short_text(v, 80) for v in values), "invalid " + key)
        require(len(set(values)) == len(values), "duplicate " + key)
    deps = meta["dependencies"]
    require(isinstance(deps, list) and len(deps) <= 32, "invalid dependencies")
    seen = set()
    for dep in deps:
        require(isinstance(dep, dict) and set(dep) == {"id", "version", "sha256"},
                "dependency must pin id, version and sha256")
        key = identity(dep["id"], dep["version"])
        require(key not in seen and key != identity(meta["id"], meta["version"]), "duplicate or self dependency")
        require(isinstance(dep["sha256"], str) and re.fullmatch("[0-9a-f]{64}", dep["sha256"]),
                "invalid dependency digest")
        seen.add(key)


class Registry:
    def __init__(self, root=None):
        base = Path(os.environ.get("APPDATA") or os.environ.get("XDG_CONFIG_HOME")
                    or Path.home() / ".config")
        self.root = Path(root or os.environ.get("VC_ASSETS") or
                         base / "video-creator" / "source-assets").expanduser().resolve()
        require(not self.root.is_relative_to(PACKAGE) and not PACKAGE.is_relative_to(self.root),
                "registry must be separate from the Skill package")
        for parent in PACKAGE.parents:
            if (parent / ".git").exists():
                require(not self.root.is_relative_to(parent), "registry must be outside repository")
                break

    def path(self, asset_id, version, review=False):
        p = self.root / (identity(asset_id, version) + (".review.json" if review else ".json"))
        require(not p.is_symlink() and p.resolve().parent == self.root, "unsafe registry path")
        return p

    @contextmanager
    def writer(self):
        self.root.mkdir(parents=True, exist_ok=True)
        lock = self.root / ".write-lock"
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError:
            raise AssetError("registry writer active or interrupted; inspect lock before manual recovery") from None
        try:
            with os.fdopen(fd, "w") as f:
                f.write(str(os.getpid()) + "\n")
            yield
        finally:
            lock.unlink()

    def publish(self, path, data):
        require(not path.exists(), "immutable record already exists")
        raw = canonical(data)
        require(len(raw) <= MAX_RECORD, "record exceeds size limit")
        fd, tmp = tempfile.mkstemp(dir=self.root, prefix=".asset-", suffix=".tmp")
        try:
            with os.fdopen(fd, "wb") as f:
                f.write(raw)
                f.flush()
                os.fsync(f.fileno())
            require(not path.exists() and not path.is_symlink(), "immutable record already exists")
            os.replace(tmp, path)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)

    def load(self, asset_id, version):
        raw = read_bytes(self.path(asset_id, version), MAX_RECORD)
        data = json.loads(raw.decode("utf-8"))
        require(isinstance(data, dict) and set(data) == {"schema", "metadata", "source", "source_sha256"}
                and data["schema"] == SCHEMA, "invalid asset record")
        meta = data["metadata"]
        validate_metadata(meta)
        require((meta["id"], meta["version"]) == (asset_id, version), "asset identity mismatch")
        require(isinstance(data["source"], str), "invalid source")
        source = data["source"].encode("utf-8")
        require(len(source) <= MAX_SOURCE and digest(source) == data["source_sha256"],
                "source digest or size mismatch")
        return data, digest(raw)

    def status(self, asset_id, version, record_hash):
        path = self.path(asset_id, version, review=True)
        if not path.exists():
            return "candidate"
        review = read_json(path)
        require(isinstance(review, dict) and review.get("asset_sha256") == record_hash
                and review.get("status") == "reviewed"
                and short_text(review.get("reviewer"), 100)
                and short_text(review.get("evidence"), 2000), "invalid review record")
        return "reviewed"

    def verify_deps(self, meta, reviewed=False):
        # Records can refer only to already-existing exact versions, so registrations form a DAG.
        pending = list(meta["dependencies"])
        seen = {}
        while pending:
            dep = pending.pop()
            key = (dep["id"], dep["version"])
            if key in seen:
                require(seen[key] == dep["sha256"], "conflicting dependency digests")
                continue
            data, sha = self.load(*key)
            require(sha == dep["sha256"], "dependency digest mismatch")
            require(not reviewed or self.status(*key, sha) == "reviewed", "dependency not reviewed")
            seen[key] = sha
            pending.extend(data["metadata"]["dependencies"])
        return seen

    def add(self, meta, source_path):
        validate_metadata(meta)
        path = Path(source_path)
        require(path.suffix.lower() in {".js", ".mjs"}, "only JS source accepted")
        source = read_bytes(path, MAX_SOURCE).decode("utf-8")
        require(source.strip() and "\x00" not in source
                and not re.search(r"data:\s*(?:image|audio|video)/", source, re.I),
                "empty, binary or embedded media source")
        record = dict(schema=SCHEMA, metadata=meta, source=source,
                      source_sha256=digest(source.encode("utf-8")))
        with self.writer():
            self.verify_deps(meta)
            self.publish(self.path(meta["id"], meta["version"]), record)
        return self.show(meta["id"], meta["version"])

    def show(self, asset_id, version):
        data, sha = self.load(asset_id, version)
        self.verify_deps(data["metadata"])
        return dict(**data["metadata"], sha256=sha,
                    source_sha256=data["source_sha256"], status=self.status(asset_id, version, sha))

    def promote(self, asset_id, version, reviewer, evidence):
        require(short_text(reviewer, 100) and short_text(evidence, 2000),
                "reviewer and specific review evidence required")
        with self.writer():
            data, sha = self.load(asset_id, version)
            self.verify_deps(data["metadata"], reviewed=True)
            self.publish(self.path(asset_id, version, review=True),
                         dict(status="reviewed", asset_sha256=sha, reviewer=reviewer, evidence=evidence))
        return self.show(asset_id, version)

    def search(self, query="", include_candidates=False, limit=20):
        require(1 <= limit <= 100, "limit must be 1..100")
        words = query.casefold().split()
        matches = []
        for path in sorted(self.root.glob("asset-*@*.json")):
            if path.name.endswith(".review.json"):
                continue
            key = path.stem.removeprefix("asset-").split("@")
            require(len(key) == 2, "invalid record filename")
            data, sha = self.load(*key)
            meta = data["metadata"]
            status = self.status(*key, sha)
            haystack = " ".join([meta["id"], meta["category"], meta["description"],
                                 *meta["tags"], *meta["capabilities"], *meta["parameters"]]).casefold()
            if (include_candidates or status == "reviewed") and all(w in haystack for w in words):
                self.verify_deps(meta, reviewed=(status == "reviewed"))
                matches.append(dict(**meta, status=status, sha256=sha))
                if len(matches) >= limit:
                    break
        return matches

    def source(self, asset_id, version, expected_sha):
        data, sha = self.load(asset_id, version)
        require(sha == expected_sha, "asset digest mismatch")
        self.verify_deps(data["metadata"])
        return data["source"]


    def checkout(self, asset_id, version, expected_sha, project, allow_candidates=False):
        """Publish an immutable source snapshot; never execute or concatenate modules."""
        project = Path(project).resolve()
        require(project.is_dir() and not project.is_relative_to(PACKAGE)
                and not PACKAGE.is_relative_to(project), "invalid project directory")
        require(not project.is_relative_to(self.root) and not self.root.is_relative_to(project),
                "project and registry must be separate")
        marker = read_json(project / "project.json")
        require(isinstance(marker, dict) and marker.get("schema") == "video-creator.project"
                and marker.get("version") == 1, "initialized project required")
        parent = project / "asset-snapshots"
        require(not parent.is_symlink() and parent.resolve().parent == project, "unsafe snapshot directory")
        parent.mkdir(exist_ok=True)
        name = identity(asset_id, version)
        destination = parent / name
        require(not destination.exists() and not destination.is_symlink(), "snapshot already exists")
        pending = [(asset_id, version, expected_sha)]
        records = {}
        while pending:
            aid, ver, pin = pending.pop()
            key = identity(aid, ver)
            if key in records:
                require(records[key]["sha256"] == pin, "conflicting asset pins")
                continue
            require(len(records) < 64, "snapshot exceeds 64 asset versions")
            data, sha = self.load(aid, ver)
            require(sha == pin and digest(canonical(data)) == sha, "asset record digest mismatch")
            status = self.status(aid, ver, sha)
            require(allow_candidates or status == "reviewed", "candidate requires explicit experiment opt-in")
            review = read_json(self.path(aid, ver, review=True)) if status == "reviewed" else None
            records[key] = dict(metadata=data["metadata"], sha256=sha,
                                source_sha256=data["source_sha256"], status=status, review=review,
                                filename=key + ".js", source=data["source"])
            pending.extend((d["id"], d["version"], d["sha256"]) for d in data["metadata"]["dependencies"])
        # A private staging directory is invisible to readers until publication. A dedicated
        # exclusive lock prevents cooperating checkout writers from overwriting each other.
        lock = parent / ".checkout-lock"
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError:
            raise AssetError("checkout locked; inspect before manual recovery") from None
        try:
            with os.fdopen(fd, "w") as out:
                out.write(str(os.getpid()) + "\n")
            require(not destination.exists() and not destination.is_symlink(), "snapshot already exists")
            with tempfile.TemporaryDirectory(dir=parent, prefix=".checkout-") as temp:
                staged = Path(temp) / name
                staged.mkdir()
                entries = []
                for key, row in sorted(records.items()):
                    (staged / row["filename"]).write_bytes(row["source"].encode("utf-8"))
                    entries.append({k: v for k, v in row.items() if k != "source"})
                manifest = dict(schema="video-creator.asset-snapshot", version=1, root=name,
                                experiment=allow_candidates, assets=entries)
                raw = canonical(manifest)
                require(len(raw) <= MAX_RECORD, "snapshot manifest exceeds size limit")
                (staged / "manifest.json").write_bytes(raw)
                verify_snapshot(staged, digest(raw))
                staged.rename(destination)
        finally:
            lock.unlink()
        return dict(snapshot=str(destination), manifest_sha256=digest(raw),
                    files=[str(destination / row["filename"]) for row in entries],
                    experiment=allow_candidates)


def verify_snapshot(folder, expected_sha):
    """Offline integrity verification against a previously recorded manifest pin."""
    folder = Path(folder).resolve()
    raw = read_bytes(folder / "manifest.json", MAX_RECORD)
    require(digest(raw) == expected_sha, "snapshot manifest digest mismatch")
    manifest = json.loads(raw.decode("utf-8"))
    require(isinstance(manifest, dict) and manifest.get("schema") == "video-creator.asset-snapshot"
            and manifest.get("version") == 1 and isinstance(manifest.get("experiment"), bool)
            and isinstance(manifest.get("assets"), list) and 1 <= len(manifest["assets"]) <= 64,
            "invalid snapshot manifest")
    pins = {}
    for row in manifest["assets"]:
        require(isinstance(row, dict) and set(row) == {"metadata", "sha256", "source_sha256",
                "status", "review", "filename"}, "invalid snapshot entry")
        meta = row["metadata"]
        validate_metadata(meta)
        key = identity(meta["id"], meta["version"])
        require(key not in pins and row["filename"] == key + ".js", "invalid snapshot filename or duplicate")
        source = read_bytes(folder / row["filename"], MAX_SOURCE)
        require(digest(source) == row["source_sha256"], "snapshot source changed")
        data = dict(schema=SCHEMA, metadata=meta, source=source.decode("utf-8"),
                    source_sha256=row["source_sha256"])
        require(digest(canonical(data)) == row["sha256"], "snapshot record digest mismatch")
        review = row["review"]
        if row["status"] == "reviewed":
            require(isinstance(review, dict) and review.get("asset_sha256") == row["sha256"]
                    and review.get("status") == "reviewed" and short_text(review.get("reviewer"), 100)
                    and short_text(review.get("evidence"), 2000), "invalid snapshot review")
        else:
            require(row["status"] == "candidate" and review is None and manifest["experiment"],
                    "unreviewed snapshot entry")
        pins[key] = row
    require(manifest.get("root") in pins, "missing snapshot root")
    reachable = set()
    pending = [manifest["root"]]
    while pending:
        key = pending.pop()
        if key in reachable:
            continue
        reachable.add(key)
        for dep in pins[key]["metadata"]["dependencies"]:
            depkey = identity(dep["id"], dep["version"])
            require(depkey in pins and pins[depkey]["sha256"] == dep["sha256"], "missing or changed dependency")
            pending.append(depkey)
    require(reachable == set(pins), "unexpected snapshot entries")
    return dict(passed=True, manifest_sha256=expected_sha, assets=len(pins),
                experiment=manifest["experiment"])


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", help="shared external registry (or VC_ASSETS)")
    sub = ap.add_subparsers(dest="command", required=True)
    a = sub.add_parser("add")
    a.add_argument("metadata", type=Path)
    a.add_argument("source", type=Path)
    a = sub.add_parser("search")
    a.add_argument("query", nargs="?", default="")
    a.add_argument("--include-candidates", action="store_true")
    a.add_argument("--limit", type=int, default=20)
    for command in ("show", "source", "promote"):
        a = sub.add_parser(command)
        a.add_argument("id")
        a.add_argument("version")
        if command == "source":
            a.add_argument("--sha256", required=True)
        if command == "promote":
            a.add_argument("--reviewer", required=True)
            a.add_argument("--evidence", required=True)
            a.add_argument("--confirm-reviewed", action="store_true", required=True)
    a = sub.add_parser("checkout")
    a.add_argument("id")
    a.add_argument("version")
    a.add_argument("--sha256", required=True)
    a.add_argument("--project", required=True)
    a.add_argument("--allow-candidates", action="store_true")
    a = sub.add_parser("verify-snapshot")
    a.add_argument("folder")
    a.add_argument("--sha256", required=True)
    args = ap.parse_args()
    try:
        if args.command == "verify-snapshot":
            print(json.dumps(verify_snapshot(args.folder, args.sha256), indent=2))
            return
        reg = Registry(args.root)
        if args.command == "add":
            result = reg.add(read_json(args.metadata), args.source)
        elif args.command == "search":
            result = reg.search(args.query, args.include_candidates, args.limit)
        elif args.command == "show":
            result = reg.show(args.id, args.version)
        elif args.command == "promote":
            result = reg.promote(args.id, args.version, args.reviewer, args.evidence)
        elif args.command == "checkout":
            result = reg.checkout(args.id, args.version, args.sha256, args.project, args.allow_candidates)
        else:
            sys.stdout.buffer.write(reg.source(args.id, args.version, args.sha256).encode("utf-8"))
            return
        print(json.dumps(result, ensure_ascii=True, indent=2))
    except (AssetError, OSError, ValueError, TypeError) as exc:
        ap.exit(1, "[asset-registry] " + str(exc) + "\n")


if __name__ == "__main__":
    main()
