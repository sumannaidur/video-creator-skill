import hashlib
import json
import unittest

from capture_native_timing import HERE, ROOT, offsets, pcm, validate
import numpy as np


class NativeTimingTests(unittest.TestCase):
    def test_fixed_hop(self):
        self.assertEqual(offsets([2, 0, 3], 3000), [0, 1200, 1200, 3000])
        for frames, samples in (([1], 601), ([-1], -600), ([1.0], 600), ([], 0)):
            with self.subTest(frames=frames), self.assertRaises(ValueError):
                offsets(frames, samples)

    def test_captured_artifacts(self):
        for passage in ("A", "B"):
            with self.subTest(passage=passage):
                stem = HERE / "outputs" / f"sample-{passage}-native"
                raw = json.loads(stem.with_suffix(".raw-duration.json").read_text(encoding="utf-8"))
                timeline = json.loads(stem.with_suffix(".timeline.json").read_text(encoding="utf-8"))
                validate(timeline)
                self.assertEqual(raw["run_id"], timeline["run_id"])
                wav = ROOT / timeline["audio"]["path"]
                self.assertEqual(raw["audio_sha256"], hashlib.sha256(wav.read_bytes()).hexdigest())
                rate, frames = pcm(wav)
                self.assertEqual(rate, raw["sample_rate"])
                waveform = np.load(stem.parent / raw["waveform"]["file"], allow_pickle=False)
                self.assertEqual(list(waveform.shape), raw["waveform"]["shape"])
                self.assertEqual(str(waveform.dtype), raw["waveform"]["dtype"])
                self.assertEqual(waveform.size, len(frames) // 2)
                edges = offsets(raw["duration"]["values"], waveform.size)
                records = [r for r in timeline["records"] if r["kind"] == "phoneme"]
                self.assertEqual([(r["start"], r["end"]) for r in records],
                                 [(a, b) for a, b in zip(edges[1:-2], edges[2:-1]) if a < b])
                self.assertTrue(all(r["source"] is None for r in timeline["records"] if r["kind"] == "word"))
