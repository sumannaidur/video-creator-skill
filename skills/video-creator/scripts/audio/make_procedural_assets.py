"""Generate original procedural audio assets with FFmpeg (lavfi) and write a provenance manifest.

No third-party samples are used; every asset is synthesized from the exact command recorded in the manifest.
Packaged from experiments/E10/audio-mix/make_procedural_assets.py (P014.3C); synthesis commands unchanged.
Usage: python make_procedural_assets.py <out_dir> [--music-seconds 70] [--overwrite]   (out_dir must be outside the Skill package)
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

LICENSE = "Original procedural audio synthesized in this project with FFmpeg lavfi; no third-party samples or recordings."

# Four-chord pad (Cmaj7, Am7, Fmaj7, G6), 4 s per chord, soft attack/release at each change so frequency switches are silent.
CHORDS = [[130.81, 261.63, 329.63, 493.88], [110.0, 261.63, 220.0, 392.0], [87.31, 174.61, 220.0, 329.63], [98.0, 196.0, 246.94, 329.63]]


def pick(k):
    a, b, c, d = (ch[k] for ch in CHORDS)
    return f"if(eq(s,0),{a},if(eq(s,1),{b},if(eq(s,2),{c},{d})))"


def pad_expr():
    env = "(1-exp(-mod(t,4)*2.5))*min(1,(4-mod(t,4))/0.6)"
    notes = "+".join(f"{amp}*sin(2*PI*{pick(k)}*t)" for k, amp in enumerate([0.16, 0.10, 0.09, 0.07]))
    # aevalsrc has no variables; substitute the chord index s inline.
    return f"({notes})*{env}*(0.85+0.15*sin(2*PI*0.2*t))".replace("s,", "floor(mod(t,16)/4),")


def assets(music_seconds):
    pad = pad_expr()
    return {
        "music-pad": dict(kind="music", seconds=music_seconds, args=[
            "-f", "lavfi", "-i", f"aevalsrc='{pad}|{pad}':s=48000:d={music_seconds}",
            "-af", "lowpass=f=2200,aecho=0.8:0.6:120|190:0.25|0.18,volume=-6dB"]),
        "whoosh": dict(kind="sfx", seconds=0.7, args=[
            "-f", "lavfi", "-i", "anoisesrc=color=pink:sample_rate=48000:duration=0.7:seed=7",
            "-af", "bandpass=f=1400:width_type=h:w=1800,afade=t=in:d=0.32:curve=exp,afade=t=out:st=0.32:d=0.38:curve=exp,pan=stereo|c0=c0|c1=c0,volume=-4dB"]),
        "pop": dict(kind="sfx", seconds=0.18, args=[
            "-f", "lavfi", "-i", "aevalsrc='0.5*sin(2*PI*660*t)*exp(-t*38)+0.25*sin(2*PI*1320*t)*exp(-t*60)|0.5*sin(2*PI*660*t)*exp(-t*38)+0.25*sin(2*PI*1320*t)*exp(-t*60)':s=48000:d=0.18"]),
        "rumble": dict(kind="sfx", seconds=3.5, args=[
            "-f", "lavfi", "-i", "anoisesrc=color=brown:sample_rate=48000:duration=3.5:seed=11",
            "-af", "lowpass=f=260,afade=t=in:d=1.2,afade=t=out:st=2.0:d=1.5,pan=stereo|c0=c0|c1=c0,volume=-2dB"]),
        "chime": dict(kind="sfx", seconds=1.8, args=[
            "-f", "lavfi", "-i", "aevalsrc='(0.3*sin(2*PI*523.25*t)+0.22*sin(2*PI*659.25*t)+0.18*sin(2*PI*783.99*t))*exp(-t*2.2)|(0.3*sin(2*PI*523.25*t)+0.22*sin(2*PI*659.25*t)+0.18*sin(2*PI*783.99*t))*exp(-t*2.2)':s=48000:d=1.8"]),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("out_dir", type=Path)
    parser.add_argument("--music-seconds", type=float, default=70.0)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    if args.out_dir.resolve().is_relative_to(Path(__file__).resolve().parents[2]):
        raise SystemExit("Generated assets must live outside the Skill package")
    existing = [p for p in [args.out_dir / "assets-manifest.json", *(args.out_dir / f"{n}.wav" for n in assets(1))] if p.exists()]
    if existing and not args.overwrite:
        raise SystemExit(f"Assets already exist ({existing[0]}); pass --overwrite to regenerate them")
    args.out_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"license_policy": LICENSE, "generator": "FFmpeg lavfi", "assets": {}}
    for name, spec in assets(args.music_seconds).items():
        path = args.out_dir / f"{name}.wav"
        command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *spec["args"], "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(path)]
        subprocess.run(command, check=True)
        manifest["assets"][name] = dict(file=path.name, kind=spec["kind"], seconds=spec["seconds"], license=LICENSE,
                                        sha256=hashlib.sha256(path.read_bytes()).hexdigest(), command=command[:-1] + ["<file>"])
    (args.out_dir / "assets-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v["sha256"][:12] for k, v in manifest["assets"].items()}))


if __name__ == "__main__":
    main()
