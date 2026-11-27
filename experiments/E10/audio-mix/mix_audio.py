"""Spec-driven narration / music / SFX mixer using only FFmpeg.

    python mix_audio.py <spec.json>

Spec (paths relative to the spec file):
{
  "narration": "narration.wav",                       # required; never altered, only mixed
  "manifest": "assets/assets-manifest.json",          # provenance; every music/SFX file must be listed with a license
  "music": {"file": "assets/music-pad.wav", "gain_db": 0, "fade_in": 1.5, "fade_out": 2.5,
            "duck": {"threshold": 0.03, "ratio": 8, "attack_ms": 30, "release_ms": 600}},   # optional
  "sfx": [{"file": "assets/pop.wav", "at": 4.375, "gain_db": -18, "why": "ticket"}],   # optional
  "loudness": {"integrated_lufs": -16, "true_peak_db": -1.5},
  "intelligibility_min_lu": 12,                       # narration must be this many LU louder than music+SFX
  "output": "mix.wav",
  "video": {"input": "preview.mp4", "output": "preview-mixed.mp4"}          # optional: copy video stream, add AAC
}
Writes <output> (48 kHz stereo PCM16), <output>.evidence.json and, if requested, the muxed MP4.
"""
import array
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path


def run(args):
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode:
        raise RuntimeError(f"{args[0]} failed: {result.stderr[-1500:]}")
    return result.stdout + result.stderr


def duration(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]).strip())


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def r128(path):
    text = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"])
    summary = text[text.rfind("Summary:"):]
    return dict(integrated=float(re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", summary).group(1).replace("-inf", "-120")),
                true_peak=float(re.search(r"Peak:\s+(-?[\d.]+|-inf) dBFS", summary).group(1).replace("-inf", "-120")))


SYNC_RATE = 8000          # analysis sample rate (Hz)
SYNC_MAX_LAG_MS = 2       # narration in the mix must be within this lag of the source
SYNC_MIN_CORR = 0.95      # and its envelope must match the source this closely


def pcm_mono(path, extra=None):
    """Decode to mono 8 kHz PCM16 (optionally through an extra filter) and return a list of samples."""
    data = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), *(["-af", extra] if extra else []),
                           "-ac", "1", "-ar", str(SYNC_RATE), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    samples = array.array("h"); samples.frombytes(data[: len(data) // 2 * 2])
    if sys.byteorder != "little":
        samples.byteswap()
    return samples


def envelope(samples, frame):
    return [sum(abs(v) for v in samples[i:i + frame]) / frame for i in range(0, len(samples) - frame + 1, frame)]


def corr_at(a, b, lag):
    """Pearson correlation of a[i] with b[i + lag] over the overlap."""
    if lag >= 0:
        x, y = a[: len(a) - lag] if lag else a, b[lag:]
    else:
        x, y = a[-lag:], b[: len(b) + lag]
    n = min(len(x), len(y)); x, y = x[:n], y[:n]
    mx, my = sum(x) / n, sum(y) / n
    sxy = sum((p - mx) * (q - my) for p, q in zip(x, y))
    sxx = sum((p - mx) ** 2 for p in x); syy = sum((q - my) ** 2 for q in y)
    return sxy / (sxx * syy) ** .5 if sxx and syy else 0.0


def sync_check(narration, mix, bed=None):
    """Lag of the narration inside the mix, from amplitude-envelope cross-correlation.

    The music+SFX bed stem (rendered through the identical graph, gain and limiter with the narration muted) is subtracted
    from the mix first, isolating the narration as it was actually mixed. Gain, normalization and limiting change the
    amplitude, not the timing, so the envelope correlation peak gives the offset. Coarse search: 10 ms frames over ±500 ms;
    fine search: 1 ms frames within ±20 ms of the coarse peak.
    """
    source = pcm_mono(narration)
    if bed:
        isolated = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(mix), "-i", str(bed), "-filter_complex",
                                   "[0][1]amerge=inputs=2,pan=mono|c0=0.5*c0+0.5*c1-0.5*c2-0.5*c3", "-ar", str(SYNC_RATE), "-f", "s16le", "-"],
                                  capture_output=True, check=True).stdout
        target = array.array("h"); target.frombytes(isolated[: len(isolated) // 2 * 2])
    else:
        target = pcm_mono(mix)
    coarse_frame, fine_frame = SYNC_RATE // 100, SYNC_RATE // 1000
    ca, cb = envelope(source, coarse_frame), envelope(target, coarse_frame)
    coarse = max(range(-50, 51), key=lambda lag: corr_at(ca, cb, lag))
    fa, fb = envelope(source, fine_frame), envelope(target, fine_frame)
    lags = range(coarse * 10 - 20, coarse * 10 + 21)
    scores = {lag: corr_at(fa, fb, lag) for lag in lags}
    best = max(scores, key=scores.get)
    return dict(method="bed-subtracted envelope cross-correlation" if bed else "envelope cross-correlation",
                lag_ms=best, correlation=round(scores[best], 5), max_lag_ms=SYNC_MAX_LAG_MS, min_correlation=SYNC_MIN_CORR,
                passed=abs(best) <= SYNC_MAX_LAG_MS and scores[best] >= SYNC_MIN_CORR)


def build_graph(spec, base, total, narration_gain=1.0):
    """Return (inputs, filter_complex) mixing narration, ducked music and delayed SFX into [mix]."""
    inputs, chains, mix = [str(base / spec["narration"])], [], []
    chains.append(f"[0:a]aresample=48000,aformat=channel_layouts=stereo,asplit=2[nar][key]")
    mix.append(f"[nar]volume={narration_gain}[narv]")
    if spec.get("music"):
        m = spec["music"]; inputs.append(str(base / m["file"])); i = len(inputs) - 1
        fade_out = m.get("fade_out", 2.0)
        chains.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total},volume={m.get('gain_db', 0)}dB,"
                      f"afade=t=in:d={m.get('fade_in', 1.5)},afade=t=out:st={max(0, total - fade_out)}:d={fade_out}[mus]")
        d = m.get("duck")
        if d:
            chains.append(f"[mus][key]sidechaincompress=threshold={d['threshold']}:ratio={d['ratio']}:attack={d['attack_ms']}:release={d['release_ms']}[musd]")
            music_label = "[musd]"
        else:
            chains.append("[key]anullsink"); music_label = "[mus]"
    else:
        chains.append("[key]anullsink"); music_label = None
    sfx_labels = []
    for k, sfx in enumerate(spec.get("sfx", [])):
        inputs.append(str(base / sfx["file"])); i = len(inputs) - 1
        delay = max(0, round(sfx["at"] * 1000))
        chains.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={sfx.get('gain_db', -18)}dB,adelay={delay}|{delay}[s{k}]")
        sfx_labels.append(f"[s{k}]")
    labels = ["[narv]"] + ([music_label] if music_label else []) + sfx_labels
    graph = ";".join(chains + mix) + f";{''.join(labels)}amix=inputs={len(labels)}:duration=first:dropout_transition=0:normalize=0,atrim=0:{total}[mix]"
    return inputs, graph


def render(spec, base, total, out, narration_gain, loud=None):
    inputs, graph = build_graph(spec, base, total, narration_gain)
    tail = "[mix]"
    if loud:
        graph += (f";[mix]loudnorm=I={loud['target']}:TP={loud['tp']}:LRA=11:measured_I={loud['m']['input_i']}:measured_TP={loud['m']['input_tp']}:"
                  f"measured_LRA={loud['m']['input_lra']}:measured_thresh={loud['m']['input_thresh']}:offset={loud['m']['target_offset']}:linear=true,"
                  f"aresample=48000,alimiter=limit={10 ** (loud['tp'] / 20):.4f}:level=disabled:latency=1[out]")
        tail = "[out]"
    args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for path in inputs:
        args += ["-i", path]
    run(args + ["-filter_complex", graph, "-map", tail, "-ar", "48000", "-c:a", "pcm_s16le", str(out)])


def main():
    if sys.argv[1] == "--check-sync":
        # python mix_audio.py --check-sync <narration.wav> <mix.wav> [<bed.wav>]  (validate an existing mix; writes nothing)
        result = sync_check(*sys.argv[2:5])
        print(json.dumps(result))
        sys.exit(0 if result["passed"] else 1)
    spec_path = Path(sys.argv[1]).resolve(); base = spec_path.parent
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    narration = base / spec["narration"]
    out = base / spec["output"]
    manifest = json.loads((base / spec["manifest"]).read_text(encoding="utf-8")) if spec.get("manifest") else {"assets": {}}
    known = {a["sha256"]: a for a in manifest["assets"].values()}
    used = [spec["music"]["file"]] if spec.get("music") else []
    used += [s["file"] for s in spec.get("sfx", [])]
    provenance = {}
    for rel in sorted(set(used)):
        entry = known.get(sha256(base / rel))
        if not entry or not entry.get("license"):
            raise ValueError(f"Asset without verified provenance/license: {rel}")
        provenance[rel] = dict(sha256=entry["sha256"], license=entry["license"], kind=entry["kind"])
    total = duration(narration)
    if spec.get("music") and duration(base / spec["music"]["file"]) < total:
        raise ValueError("Music shorter than narration")
    for s in spec.get("sfx", []):
        if not 0 <= s["at"] < total:
            raise ValueError(f"SFX time outside narration: {s}")
    target, tp = spec["loudness"]["integrated_lufs"], spec["loudness"]["true_peak_db"]
    raw = out.with_suffix(".premix.wav")
    render(spec, base, total, raw, 1.0)
    inputs, graph = build_graph(spec, base, total, 1.0)
    args = ["ffmpeg", "-hide_banner", "-nostats", "-y"] + sum((["-i", p] for p in inputs), [])
    text = run(args + ["-filter_complex", graph + f";[mix]loudnorm=I={target}:TP={tp}:LRA=11:print_format=json[o]", "-map", "[o]", "-f", "null", "-"])
    measured = json.loads(text[text.rfind("{"):text.rfind("}") + 1])
    render(spec, base, total, out, 1.0, dict(target=target, tp=tp, m=measured))
    # Bed-only stem (same graph and ducking, narration muted) to measure speech-to-bed separation.
    bed = out.with_suffix(".bed.wav")
    render(spec, base, total, bed, 0.0, dict(target=target, tp=tp, m=measured))
    raw.unlink()
    gain = target - float(measured["input_i"])
    nar_level = r128(narration)["integrated"] + gain
    mixed, bed_level = r128(out), r128(bed)["integrated"]
    sync = sync_check(narration, out, bed)
    checks = {
        "duration_matches_narration": abs(duration(out) - total) < 0.005,
        "integrated_lufs_within_1lu": abs(mixed["integrated"] - target) <= 1.0,
        "true_peak_below_limit": mixed["true_peak"] <= tp + 0.1,
        "narration_aligned": sync["passed"],
        "speech_over_bed_lu": (nar_level - bed_level) >= spec.get("intelligibility_min_lu", 12),
    }
    evidence = dict(spec=spec_path.name, narration=dict(path=spec["narration"], sha256=sha256(narration), seconds=total),
                    output=dict(path=spec["output"], sha256=sha256(out), seconds=duration(out), **mixed),
                    loudnorm_first_pass=measured, applied_gain_db=gain, narration_lufs_in_mix=nar_level, bed_lufs=bed_level,
                    speech_over_bed_lu=nar_level - bed_level, sync=sync, provenance=provenance, checks=checks)
    if spec.get("video"):
        v = spec["video"]; src, dst = base / v["input"], base / v["output"]
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-i", str(out), "-map", "0:v", "-map", "1:a",
             "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(dst)])
        md5 = lambda p: run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(p), "-map", "0:v", "-c", "copy", "-f", "md5", "-"]).strip()
        probe = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,duration,sample_rate,channels,nb_frames", "-of", "json", str(dst)]))
        decode = run(["ffmpeg", "-hide_banner", "-v", "error", "-i", str(dst), "-f", "null", "-"]).strip()
        checks["video_stream_copied_unchanged"] = md5(src) == md5(dst)
        checks["mp4_decodes"] = not decode
        evidence["video"] = dict(input=v["input"], output=v["output"], sha256=sha256(dst), streams=probe["streams"])
    evidence["passed"] = all(checks.values())
    out.with_suffix(".evidence.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(dict(passed=evidence["passed"], checks=checks, lufs=mixed, speech_over_bed_lu=round(nar_level - bed_level, 1),
                          sync=sync)))
    if not evidence["passed"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
