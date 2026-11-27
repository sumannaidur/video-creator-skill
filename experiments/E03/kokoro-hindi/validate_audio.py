"""Verify the WAV with FFprobe, a full FFmpeg decode, and PCM statistics."""

import argparse
import array
import json
import subprocess
import wave
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("wav", type=Path)
args = parser.parse_args()

probe = json.loads(subprocess.check_output([
    "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(args.wav)
]))
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-xerror", "-i", str(args.wav),
                "-f", "null", "-"], check=True)
with wave.open(str(args.wav), "rb") as wav:
    samples = array.array("h", wav.readframes(wav.getnframes()))
    if wav.getsampwidth() != 2 or wav.getnchannels() != 1 or wav.getframerate() != 24000:
        raise ValueError("Expected mono 24 kHz PCM16")
    duration = wav.getnframes() / wav.getframerate()
if not samples or not any(samples) or duration <= 0:
    raise ValueError("Silent or empty WAV")
print(json.dumps({
    "duration_seconds": duration,
    "peak_pcm": max(map(abs, samples)),
    "pcm_samples_at_rails": sum(value in (-32768, 32767) for value in samples),
    "probe": probe,
}, indent=2))
