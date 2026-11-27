"""Score candidate timelines against independent Hindi annotations."""
import argparse
import json
import math
from pathlib import Path
from statistics import mean, median
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "alignment-prototype"))
from timeline import validate


def key(record):
    ref = record["text_ref"]
    return ref["field"], ref["start"], ref["end"]


def summary(values):
    if not values:
        return None
    return dict(count=len(values), mean_ms=mean(values), median_ms=median(values),
                p95_ms=sorted(values)[math.ceil(.95 * len(values)) - 1])


def evaluate(timeline, review, kind):
    audio = timeline["audio"]
    if review["sha256"] != audio["sha256"]:
        raise ValueError("Annotation audio SHA-256 differs")
    predictions = [r for r in timeline["records"] if r["kind"] == kind]
    by_span = {key(r): r for r in predictions if r["source"] is not None}
    start_errors, end_errors = [], []
    uncertain = invalid = unmatched = omitted = 0
    previous = 0
    seen = set()
    for r in (r for r in review["annotations"] if r["kind"] == kind):
        if r.get("uncertain"):
            uncertain += 1
            continue
        if r.get("missing_or_repeated") == "omitted":
            omitted += 1
            continue
        field, lo, hi = span = key(r)
        start, end = r["start"], r["end"]
        text = timeline["text"].get(field, "")
        if (span in seen or type(lo) is not int or type(hi) is not int or not 0 <= lo < hi <= len(text)
                or type(start) is not int or type(end) is not int
                or not previous <= start < end <= audio["sample_count"]):
            invalid += 1
            continue
        previous = end
        seen.add(span)
        if span not in by_span:
            unmatched += 1
            continue
        prediction = by_span[span]
        start_errors.append(abs(start - prediction["start"]) * 1000 / audio["sample_rate"])
        end_errors.append(abs(end - prediction["end"]) * 1000 / audio["sample_rate"])
    ref_total = len(start_errors) + unmatched
    return dict(eligible_script_spans=len(predictions), mapped=len(by_span),
                unmapped=len(predictions)-len(by_span),
                mapping_coverage=len(by_span)/len(predictions) if predictions else None,
                ambiguous_mappings=sum(bool(r.get("mapping", {}).get("ambiguous")) for r in predictions),
                uncertain_annotations=uncertain, invalid_annotations=invalid,
                omitted_annotations=omitted, unmatched_references=unmatched, eligible_references=ref_total,
                scored_script_fraction=len(start_errors)/len(predictions) if predictions else None,
                scored_reference_coverage=len(start_errors)/ref_total if ref_total else None,
                start=summary(start_errors), end=summary(end_errors), pooled=summary(start_errors+end_errors))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("annotations", type=Path)
    args = parser.parse_args()
    review = json.loads(args.annotations.read_text(encoding="utf-8-sig"))
    if review["unit"] != "sample":
        raise ValueError("Use integer sample offsets")
    result = {}
    for sample in review["samples"]:
        if sample["id"] not in {"A-native", "B-native"} or sample["id"] in result:
            raise ValueError("Unknown or duplicate sample ID")
        passage = sample["id"][0]
        path = ROOT / "outputs" / f"sample-{passage}-candidate.timeline.json"
        timeline = json.loads(path.read_text(encoding="utf-8"))
        validate(timeline)
        result[sample["id"]] = {kind: evaluate(timeline, sample, kind) for kind in ("word", "phrase")}
    print(json.dumps(result, indent=2))
