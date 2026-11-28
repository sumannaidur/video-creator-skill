"""Focused source asset registry tests; no rendering or runtime dependencies."""
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from asset_registry import Registry, AssetError


class Assets(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.reg = Registry(self.root / "library")
        self.js = self.root / "source.js"
        self.js.write_text("function wheel(r) { return r * 2; }\n", encoding="utf-8")

    def meta(self, asset_id="object.wheel", version="1.0.0", deps=None):
        return dict(id=asset_id, version=version, category="object", description="Wooden wheel",
                    tags=["mill"], capabilities=["rotate"], parameters=["radius"],
                    dependencies=deps or [], origin="original")

    def test_candidate_review_and_source(self):
        item = self.reg.add(self.meta(), self.js)
        self.assertEqual(item["status"], "candidate")
        self.assertEqual(self.reg.search("mill"), [])
        self.assertEqual(len(self.reg.search("mill rotate", True)), 1)
        self.reg.promote("object.wheel", "1.0.0", "owner", "Reviewed actual frames; test fixture")
        self.assertEqual(self.reg.search("mill")[0]["sha256"], item["sha256"])
        self.assertEqual(self.reg.source("object.wheel", "1.0.0", item["sha256"]),
                         self.js.read_text(encoding="utf-8"))
        with self.assertRaises(AssetError):
            self.reg.promote("object.wheel", "1.0.0", "owner", "duplicate")

    def test_immutable_variants(self):
        first = self.reg.add(self.meta(), self.js)
        self.js.write_text("function wheel(r) { return r * 3; }\n", encoding="utf-8")
        with self.assertRaises(AssetError):
            self.reg.add(self.meta(), self.js)
        second = self.reg.add(self.meta(version="1.1.0"), self.js)
        self.assertNotEqual(first["sha256"], second["sha256"])
        self.assertIn("* 2", self.reg.source("object.wheel", "1.0.0", first["sha256"]))

    def test_dependency_review(self):
        first = self.reg.add(self.meta(), self.js)
        dep = {k: first[k] for k in ("id", "version", "sha256")}
        child = self.meta("object.mill", deps=[dep])
        self.reg.add(child, self.js)
        with self.assertRaises(AssetError):
            self.reg.promote("object.mill", "1.0.0", "owner", "review")
        self.reg.promote("object.wheel", "1.0.0", "owner", "review")
        self.reg.promote("object.mill", "1.0.0", "owner", "review")
        self.assertEqual(len(self.reg.search("mill")), 2)
        dep["sha256"] = "0" * 64
        with self.assertRaises(AssetError):
            self.reg.add(self.meta("object.other", deps=[dep]), self.js)

    def test_reject_paths_media_and_lock(self):
        for bad in ("../escape", "a/b", "CON", "a..b"):
            with self.assertRaises(AssetError):
                self.reg.add(self.meta(bad), self.js)
        self.js.write_text("const image = 'data:image/png;base64,AAAA';", encoding="utf-8")
        with self.assertRaises(AssetError):
            self.reg.add(self.meta(), self.js)
        self.js.write_text("const x = 1;", encoding="utf-8")
        with self.reg.writer():
            with self.assertRaises(AssetError):
                self.reg.add(self.meta(), self.js)
        self.assertEqual(self.reg.search("", True), [])

    def test_tampering_and_wrong_pin(self):
        item = self.reg.add(self.meta(), self.js)
        with self.assertRaises(AssetError):
            self.reg.source("object.wheel", "1.0.0", "0" * 64)
        path = self.reg.path("object.wheel", "1.0.0")
        record = json.loads(path.read_text(encoding="utf-8"))
        record["source"] = "changed"
        path.write_text(json.dumps(record), encoding="utf-8")
        with self.assertRaises(AssetError):
            self.reg.show("object.wheel", "1.0.0")

    def test_shared_root(self):
        item = self.reg.add(self.meta(), self.js)
        other = Registry(self.root / "library")
        self.assertEqual(other.show("object.wheel", "1.0.0"), item)


if __name__ == "__main__":
    unittest.main()
