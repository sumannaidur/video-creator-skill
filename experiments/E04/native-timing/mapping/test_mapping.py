import json
import unittest

from evaluate_alignment import ROOT, evaluate, validate


class MappingTests(unittest.TestCase):
    def test_candidates_keep_capture_identity(self):
        for passage, word_count in (("A", 20), ("B", 23)):
            base = ROOT / "outputs"
            native = json.loads((base / f"sample-{passage}-native.timeline.json").read_text(encoding="utf-8"))
            mapped = json.loads((base / f"sample-{passage}-candidate.timeline.json").read_text(encoding="utf-8"))
            validate(mapped)
            for field in ("run_id", "audio", "text"):
                self.assertEqual(native[field], mapped[field])
            symbols = [r for r in native["records"] if r["kind"] == "phoneme"]
            words = [r for r in mapped["records"] if r["kind"] == "word" and r["source"] == "native_model"]
            self.assertEqual(len(words), word_count)
            for word in words:
                span = word["mapping"]
                self.assertEqual(word["start"], symbols[span["first_symbol"]]["start"])
                self.assertEqual(word["end"], symbols[span["last_symbol"]]["end"])

    def test_synthetic_evaluation(self):
        def word(lo, start, end, **extra):
            return dict(kind="word", text_ref=dict(field="speech", start=lo, end=lo+1),
                        start=start, end=end, **extra)

        data = dict(audio=dict(sha256="fixture", sample_rate=1000, sample_count=100),
                    text=dict(speech="abc"),
                    records=[word(0, 10, 30, source="native_model"), word(1, None, None, source=None)])
        ref = dict(sha256="fixture", annotations=[word(0, 12, 35), word(1, 40, 50),
                                                  word(2, None, None, uncertain=True), word(0, 49, 90)])
        result = evaluate(data, ref, "word")
        self.assertEqual(result["mapping_coverage"], 0.5)
        self.assertEqual(result["scored_reference_coverage"], 0.5)
        self.assertEqual(result["invalid_annotations"], 1)
        self.assertEqual(result["uncertain_annotations"], 1)
        self.assertEqual(result["start"]["mean_ms"], 2)
        self.assertEqual(result["end"]["mean_ms"], 5)
        self.assertEqual(result["pooled"]["median_ms"], 3.5)
        self.assertEqual(result["pooled"]["p95_ms"], 5)
        self.assertIsNone(evaluate(data, dict(sha256="fixture", annotations=[]), "word")["pooled"])
        with self.assertRaises(ValueError):
            evaluate(data, dict(sha256="wrong", annotations=[]), "word")
