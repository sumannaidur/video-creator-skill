"""Verify the downloaded publisher snapshot against its official tree metadata."""
import hashlib
import json
from pathlib import Path
import sys
from urllib.request import urlopen

repo = "Oomni/mithi-v2-flash"
rev = "1fc0dd68496a2483508ec764d310146c41ff90be"
root = Path(sys.argv[1])
required = {
    "LICENSE", "config.json", "run.py", "decoder.safetensors", "voices.safetensors",
    "writer.safetensors", "indic_encoder/config.json", "indic_encoder/model.safetensors",
    "indic_encoder/old2new.npy", "indic_encoder/spiece.model",
}
with urlopen(f"https://huggingface.co/api/models/{repo}/tree/{rev}?recursive=true", timeout=25) as response:
    entries = {item["path"]: item for item in json.load(response)}
files = []
for name in sorted(required):
    item = entries[name]
    data = (root / name).read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    published = item.get("lfs", {}).get("oid")
    git_blob = hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest() if not published else None
    if len(data) != item["size"] or (sha != published if published else git_blob != item["oid"]):
        raise ValueError(f"Integrity mismatch: {name}")
    files.append(dict(path=name, bytes=len(data), sha256=sha, published_sha256=published,
                      git_blob=item["oid"]))
total = sum(f["bytes"] for f in files)
Path(__file__).with_name("model-manifest.json").write_text(
    json.dumps(dict(repo=repo, revision=rev, total_bytes=total, files=files), indent=2) + "\n")
print(f"Verified {len(files)} files, {total} bytes")
