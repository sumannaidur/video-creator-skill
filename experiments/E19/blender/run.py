"""Launch headless Blender for scene.py and measure wall time and peak RAM (Windows process counters; no extra packages).
Usage: python run.py --out DIR --res 540x960 --frames 27-34 --samples 32 --tag bench   -> DIR/<tag>-run.json
Peak RAM is Blender's peak working set (process RAM). Shared iGPU memory used by the driver is not included.
"""
import ctypes
import ctypes.wintypes as wt
import json
import os
import subprocess
import sys
import time

BLENDER = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
HERE = os.path.dirname(os.path.abspath(__file__))


class PMC(ctypes.Structure):
    _fields_ = [("cb", wt.DWORD), ("PageFaultCount", wt.DWORD), ("PeakWorkingSetSize", ctypes.c_size_t), ("WorkingSetSize", ctypes.c_size_t),
                ("QuotaPeakPagedPoolUsage", ctypes.c_size_t), ("QuotaPagedPoolUsage", ctypes.c_size_t), ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
                ("QuotaNonPagedPoolUsage", ctypes.c_size_t), ("PagefileUsage", ctypes.c_size_t), ("PeakPagefileUsage", ctypes.c_size_t)]


def peak(handle):
    c = PMC()
    c.cb = ctypes.sizeof(c)
    ok = ctypes.windll.psapi.GetProcessMemoryInfo(wt.HANDLE(int(handle)), ctypes.byref(c), c.cb)
    return (c.PeakWorkingSetSize, c.PeakPagefileUsage) if ok else (None, None)


args = sys.argv[1:]
opt = dict(zip(args[::2], args[1::2]))
out, tag = os.path.abspath(opt["--out"]), opt.get("--tag", "f")
opt["--out"] = out
args = [x for kv in opt.items() for x in kv]
os.makedirs(out, exist_ok=True)
cmd = [BLENDER, "-b", "--factory-startup", "--python", os.path.join(HERE, "scene.py"), "--", *args]
t0 = time.perf_counter()
p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
first = None
log = []
best = (0, 0)
for line in p.stdout:
    log.append(line.rstrip())
    if line.startswith("FRAME") and first is None:
        first = time.perf_counter() - t0
    ws, pf = peak(p._handle)
    if ws:
        best = (max(best[0], ws), max(best[1], pf))
p.wait()
ws, pf = peak(p._handle)
if ws:
    best = (max(best[0], ws), max(best[1], pf))
wall = time.perf_counter() - t0
res = {"returncode": p.returncode, "wall_s": round(wall, 2), "launch_to_first_frame_done_s": round(first, 2) if first else None,
       "peak_working_set_mib": round(best[0] / 2 ** 20, 1), "peak_commit_mib": round(best[1] / 2 ** 20, 1), "cmd": cmd[1:]}
with open(os.path.join(out, f"{tag}-run.json"), "w", encoding="utf-8") as fh:
    json.dump(res, fh, indent=2)
with open(os.path.join(out, f"{tag}-blender.log"), "w", encoding="utf-8") as fh:
    fh.write("\n".join(log))
print(json.dumps(res))
print("\n".join([l for l in log if any(k in l for k in ("Error", "error", "Traceback", "FRAME", "DONE"))][-30:]))
