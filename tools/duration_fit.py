"""P024.14A: fit per-voice narration duration estimators from retained segment caches (E30-E38) and report held-out error.

Features are measured before synthesis: speech characters (letters and marks, no spaces or punctuation), words, and
pauses (commas and similar = minor, sentence ends = major). Model per voice: seconds = lead + c*chars + p*minor + q*major.
Validation: leave-one-project-out per voice (segments of the held-out project never inform its own estimate), plus a
whole-script check (sum of segments) against each project's measured total.
"""
import glob, json, os, re, sys, unicodedata, wave
from collections import defaultdict

# P026.6C: moved to tools/. The inputs are the experiments' narration segment caches (git-ignored, maintainer-local);
# pass their folder with VC_EXPERIMENTS (default <repo>/experiments). Refit duration-rates.json from new evidence.
ROOT = os.environ.get("VC_EXPERIMENTS") or os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "experiments")


def features(text):
    chars = sum(1 for ch in text if unicodedata.category(ch)[0] in "LM")
    words = len(text.split())
    major = len(re.findall(r"[.!?।॥]+(?=\s|$)", text))
    minor = len(re.findall(r"[,;:—–]", text))
    return chars, words, minor, major


def collect():
    rows = []
    for nar in glob.glob(os.path.join(ROOT, "E3[0-9]", "**", "narration"), recursive=True):
        proj = os.path.dirname(nar)
        try:
            cfg = json.load(open(os.path.join(proj, "project.json"), encoding="utf-8"))["config"]["effective"]
        except (OSError, KeyError, ValueError):
            continue
        exp = os.path.relpath(proj, ROOT).split(os.sep)[0]
        for txt in glob.glob(os.path.join(nar, "segments", "*.txt")):
            wav = txt[:-4] + ".wav"
            if not os.path.exists(wav):
                continue
            with wave.open(wav) as w:
                sec = w.getnframes() / w.getframerate()
            text = open(txt, encoding="utf-8").read().strip()
            rows.append(dict(exp=exp, voice=f"{cfg['narration']['provider']}/{cfg['narration']['voice']}", locale=cfg["locale"], text=text, sec=sec, f=features(text)))
    return rows


def fit(rows):
    """Least squares for [1, chars, minor, major] with a small ridge to keep sparse pause terms sane."""
    import itertools
    X = [[1.0, r["f"][0], r["f"][2], r["f"][3]] for r in rows]
    y = [r["sec"] for r in rows]
    n = 4
    A = [[sum(x[i] * x[j] for x in X) + (0.5 if i == j and i > 1 else 0) for j in range(n)] for i in range(n)]
    b = [sum(x[i] * t for x, t in zip(X, y)) for i in range(n)]
    for c in range(n):  # Gaussian elimination
        p = max(range(c, n), key=lambda r: abs(A[r][c]))
        A[c], A[p], b[c], b[p] = A[p], A[c], b[p], b[c]
        for r in range(n):
            if r != c and A[c][c]:
                k = A[r][c] / A[c][c]
                A[r] = [a - k * q for a, q in zip(A[r], A[c])]
                b[r] -= k * b[c]
    return [b[i] / A[i][i] if A[i][i] else 0.0 for i in range(n)]


def predict(m, f):
    return m[0] + m[1] * f[0] + m[2] * f[2] + m[3] * f[3]


def main():
    rows = collect()
    by_voice = defaultdict(list)
    for r in rows:
        by_voice[r["voice"]].append(r)
    report = {"segments": len(rows), "voices": {}}
    for v, rs in sorted(by_voice.items()):
        exps = sorted({r["exp"] for r in rs})
        model = fit(rs)
        held = []
        for e in exps:
            train = [r for r in rs if r["exp"] != e]
            if len(train) < 4:
                continue
            m = fit(train)
            held += [abs(predict(m, r["f"]) - r["sec"]) / r["sec"] for r in rs if r["exp"] == e]
        mape = lambda e: round(sum(e) / len(e), 3) if e else None
        loso = lambda unit: [abs(r["f"][unit] / (sum(q["f"][unit] for q in rs if q is not r) / sum(q["sec"] for q in rs if q is not r)) - r["sec"]) / r["sec"] for r in rs]
        rate_lopo = []
        for e in exps:
            tr = [r for r in rs if r["exp"] != e]
            if tr:
                c = sum(r["f"][0] for r in tr) / sum(r["sec"] for r in tr)
                rate_lopo += [abs(r["f"][0] / c - r["sec"]) / r["sec"] for r in rs if r["exp"] == e]
        wpm = [r["f"][1] / r["sec"] * 60 for r in rs]
        cps = sum(r["f"][0] for r in rs) / sum(r["sec"] for r in rs)
        naive_err = [abs(r["f"][1] / (sum(wpm) / len(wpm)) * 60 - r["sec"]) / r["sec"] for r in rs]   # in-sample words/min
        report["voices"][v] = {
            "locale": rs[0]["locale"], "segments": len(rs), "projects": exps,
            "model": {"lead_s": round(model[0], 3), "s_per_char": round(model[1], 4), "minor_pause_s": round(model[2], 3), "major_pause_s": round(model[3], 3)},
            "chars_per_s": round(cps, 2), "words_per_min": round(sum(wpm) / len(wpm), 1),
            "heldout_segment_mape": round(sum(held) / len(held), 3) if held else None, "heldout_n": len(held),
            "insample_wordcount_mape": round(sum(naive_err) / len(naive_err), 3),
            "loso_rate_chars_mape": mape(loso(0)), "loso_rate_words_mape": mape(loso(1)), "lopo_rate_chars_mape": mape(rate_lopo) if len(exps) > 1 else None,
        }
    json.dump(report, sys.stdout, indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
