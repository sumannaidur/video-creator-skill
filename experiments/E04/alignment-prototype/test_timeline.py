from copy import deepcopy
import json
import unittest

from timeline import HERE, validate


class TimelineTests(unittest.TestCase):
    def setUp(self):
        self.item = json.loads((HERE / "outputs/sample-A.timeline.json").read_text(encoding="utf-8"))

    def test_original_and_unknown_text_timing(self):
        for path in (HERE / "outputs").glob("*.timeline.json"):
            validate(json.loads(path.read_text(encoding="utf-8")))
        text = self.item["text"]["display"]
        self.item["records"].append(dict(kind="sentence", label=text, start=None, end=None,
                                        source=None, text_ref=dict(field="display", start=0, end=len(text))))
        validate(json.loads(json.dumps(self.item, ensure_ascii=False)))
        self.item["records"][-1]["text_ref"]["end"] -= 1
        with self.assertRaises(ValueError):
            validate(self.item)

    def test_invalid_intervals_and_sources(self):
        for change in (dict(start=-1), dict(end=0), dict(end=999999), dict(start=0.0),
                       dict(source="guess"), dict(source=None), dict(confidence=0.9)):
            with self.subTest(change=change), self.assertRaises(ValueError):
                item = deepcopy(self.item)
                item["records"][0].update(change)
                validate(item)
        self.item["records"].reverse()
        with self.assertRaises(ValueError):
            validate(self.item)

    def test_invalid_audio_identity_or_timebase(self):
        for key, value in (("sha256", "0" * 64), ("sample_count", 1), ("sample_rate", 16000),
                           ("path", "../outside.wav")):
            with self.subTest(key=key), self.assertRaises(ValueError):
                item = deepcopy(self.item)
                item["audio"][key] = value
                validate(item)
        self.item["unit"] = "ms"
        with self.assertRaises(ValueError):
            validate(self.item)
