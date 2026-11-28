"""P026.3: runtime-file discovery (narration/runtimes.py). No narration runtime needed.

python -I scripts/tests/test_runtime_discovery.py
"""
import os
from pathlib import Path
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "narration"))
import runtimes  # noqa: E402

with tempfile.TemporaryDirectory() as d:
    os.environ["VC_RUNTIMES"] = d
    assert runtimes.runtime_dir() == Path(d)
    assert runtimes.discover(["mithi", "kokoro-onnx"], {}) == {}, "nothing configured -> nothing found"
    (Path(d) / "mithi.json").write_text("{}", encoding="utf-8")
    assert runtimes.discover(["mithi", "kokoro-onnx"], {}) == {"mithi": str(Path(d) / "mithi.json")}, "conventional file found, others absent"
    assert runtimes.discover(["mithi"], {"mithi": "explicit.json"}) == {"mithi": "explicit.json"}, "explicit --runtime wins"
    (Path(d) / "sub").mkdir(); (Path(d) / "sub" / "kokoro-onnx.json").write_text("{}", encoding="utf-8")
    assert "kokoro-onnx" not in runtimes.discover(["kokoro-onnx"], {}), "no recursive search"
    del os.environ["VC_RUNTIMES"]
    os.environ["APPDATA"] = d
    assert runtimes.runtime_dir() == Path(d) / "video-creator" / "runtimes", "APPDATA fallback"
print("Runtime discovery fixtures passed.")
