# E02 — Hardware and local execution assessment

Measured 2026-11-25 in the Codex desktop environment on Windows. **E02 complete for baseline inventory and bounded execution checks; media, TTS, alignment, and GPU compute performance remain untested.** No software or model was installed. Commands used existing PowerShell 5.1, CIM, Git, Python, Node, FFmpeg, and Vulkan utilities. Values are snapshots, not guaranteed capacity. Private paths, machine identifiers, and device UUIDs are omitted.

## Measured system baseline

| Area | Observed result | Method / limitation |
| --- | --- | --- |
| OS | Windows 11 Pro, version `10.0.26300`, build `26300`, 64-bit x64 | `Get-CimInstance Win32_OperatingSystem`; build reports OS version, not app compatibility |
| Shell | Windows PowerShell `5.1.26100.10068` Desktop; Command Prompt callable | `$PSVersionTable`; bounded `cmd.exe /c echo terminal-ok` |
| Workspace | `D:` NTFS | `Get-Volume`; local workspace path excluded from retained machine data |
| CPU | Intel Core i5-1145G7 (11th Gen), 4 physical cores, 8 logical processors; reported max 2611 MHz; load 58% at snapshot | `Win32_Processor`; clock/load are reported snapshots, not sustained speed |
| CPU instruction sets | SSE, AVX, AVX2, and other flags **unknown** | Existing safe system commands did not establish flags; model name is not used as proof |
| RAM | 16 GiB module at reported 3200 MT/s; OS-visible total 15.71 GiB; free 2.50 GiB at first snapshot (2.43 GiB on later snapshot) | `Win32_PhysicalMemory`, `Win32_ComputerSystem`, `Win32_OperatingSystem`; free RAM varies and is much smaller than installed capacity |
| Virtual memory | OS-reported total 29.21 GiB, free 6.85 GiB at first snapshot | `Win32_OperatingSystem`; swapping is not a substitute for model RAM |
| Process limit | No specific per-process cap established; 64-bit OS and Python detected | Do not infer usable model allocation from address width |
| Graphics | Intel Iris Xe integrated GPU, driver `32.0.101.7085`; no dedicated GPU detected by `Win32_VideoController` | WMI device inventory; absence of a detected second adapter is not proof none exists in every configuration |
| GPU memory | WMI `AdapterRAM` reports 2,147,479,552 bytes (~2 GiB), **not treated as dedicated VRAM** on integrated graphics; actual dedicated/shared split unknown | Integrated GPU uses system memory; Windows WMI adapter field is not reliable dedicated VRAM evidence |
| Graphics API | `vulkaninfo --summary` enumerated Intel Iris Xe as integrated, Vulkan instance 1.4.313 and device API 1.4.323; DirectX registry version present but API feature level unverified; OpenGL and compute runtime unverified | Vulkan enumeration is not a render/inference benchmark; loader emitted a nonfatal layer-manifest warning |
| Storage | `D:` 200.0 GiB total, 134.2 GiB free; `C:` 275.1 GiB total, 27.5 GiB free; both NTFS | `Get-Volume`/`Win32_LogicalDisk`, rounded GiB; default temp location is on C:, so temporary headroom is tighter than workspace headroom |

## Existing software inventory

Detection used `Get-Command`, version commands where available, and targeted installed-browser executable metadata. `FOUND` means an executable or script was observed, not that every feature works. `NOT FOUND` means absent from the checked PATH/location, not necessarily absent from the computer.

| Tool | Result and version | Verification / relevant limitation |
| --- | --- | --- |
| Python | FOUND: active `python` 3.14.3; `py` launcher reported 3.14.4 | `python --version`, `py --version`; active Python 3.14.3 lacks pip |
| pip | FOUND: `pip` 26.1.2 bound to Python 3.13; `python -m pip` failed (`No module named pip`) | `pip --version`, `python -m pip --version`; environment mismatch matters for future installs |
| Node.js / npm | FOUND: Node 24.19.0; npm 11.16.0 | `node --version`, `npm --version` |
| Git / PowerShell | FOUND: Git 2.53.0.windows.2; PowerShell 5.1.26100.10068 | Version commands |
| FFmpeg / FFprobe | FOUND: both 9.0.2 Windows build; encoder listing includes `libx264`, `h264_mf`, `h264_qsv`, and AAC | `-version`, `ffmpeg -encoders`; listing does not prove hardware encoder functionality or HD throughput |
| ImageMagick / Blender | `magick` and `blender` NOT FOUND | `Get-Command`; Windows `convert` exists but is not evidence of ImageMagick |
| Ollama | Client FOUND: 0.33.2; no running instance reachable | `ollama --version`; not proof of local model availability |
| AI Python packages | `torch`, `onnxruntime`, Pillow, OpenCV, NumPy, PyYAML not importable in active Python 3.14.3 | `importlib.util.find_spec`; other Python environments were not exhaustively searched |
| GPU utilities | `vulkaninfo` FOUND; `nvidia-smi` and `glxinfo` NOT FOUND | PATH check; no CUDA runtime verified |
| Browsers | Microsoft Edge 158.0.4370.33 and Google Chrome 157.0.8103.79 executable files found | Version metadata only; headless automation or canvas/video export not tested |

## Bounded local checks

An existing temporary text file was read/written in the preceding foundation task; no large file was created for E02. For E02, `python -c "s=sum(i*i for i in range(100000)); print(s)"` returned `333328333350000` in 138 ms including process startup. The equivalent Node loop returned the same sum in 132 ms including startup. These 100,000-iteration checks prove process launch and simple CPU execution only. They are **not** TTS, alignment, animation, or encoding benchmarks. FFmpeg/FFprobe version and encoder-list commands succeeded; no media was rendered.

## Provisional resource budgets and constraints

These are **planning estimates, not measurements of actual models or renders**. Given only ~2.4–2.5 GiB free RAM at inspection, first experiments should target ≤1 GiB incremental resident memory, run one heavy stage at a time, and measure peak RAM. A 2–4 GiB process may require closing other applications or more free memory first; do not assume installed 16 GiB is immediately available. Keep an initial working-set allocation on D: within 20–40 GiB: speech model candidates 2–8 GiB, alignment models 1–4 GiB, assets/caches 2–8 GiB, intermediate audio under 2 GiB, frames/temp video 5–15 GiB, final MP4s 1–3 GiB. These ranges overlap and are not additive reservations. Prefer D: for large temporary outputs because C: had only 27.5 GiB free. Measure real sizes in later experiments before adopting budgets.

CPU-only is the required baseline. Keep narration segmented, processing sequential, previews small, final output Full HD, and parallel scene workers bounded by measured RAM. Release model memory between stages and cache reusable assets where rights allow. Optional GPU acceleration requires separate capability and output-quality tests. Do not silently lower required final resolution or voice quality to meet resource limits.

## Workload feasibility classification

No production workload below was run. The status describes **prerequisites only**, not demonstrated output quality or speed.

| Workload | Preliminary status | Evidence / next gate |
| --- | --- | --- |
| Lightweight local TTS | Potentially feasible; benchmark required | CPU and OS verified; model/runtime and naturalness untested |
| Larger multilingual TTS | Resource-constrained; optimization required | ~2.5 GiB free snapshot; model memory unknown |
| CPU speech alignment | Potentially feasible; benchmark required | CPU execution verified; aligner absent/untested |
| Vector/SVG graphics | Environment prerequisite verified | Local files and browser executables present; visual quality untested |
| Canvas graphics / 2D animation | Potentially feasible; benchmark required | Node/browser present; headless/render path untested |
| Browser-based rendering | Potentially feasible; benchmark required | Edge/Chrome installed; process control and export untested |
| Full HD video encoding | Potentially feasible; benchmark required | FFmpeg lists H.264/AAC encoders; E08 must measure actual throughput/integrity |
| Programmatic 3D | Resource-constrained; optimization required | Integrated GPU; Blender absent; quality and render time unknown |
| Local image-generation models | Not recommended for initial CPU baseline | No verified AI runtime/GPU compute, limited available RAM; revisit only with model-specific evidence |

## Next multilingual voice research gate

For Kannada, Hindi, Telugu, Tamil, and Indian English, compare candidate model license and Windows/CPU support before any installation; measure model download size, peak RAM, CPU latency, and real audio quality independently per locale. Start with ≤1 GiB incremental-memory candidates if available, then reassess after freeing RAM. Quantized inference is an option only if a candidate supports it without unacceptable quality loss. Keep model cache on D:, measure remaining temp space, and treat Intel GPU inference as optional/unverified. **No TTS model was researched, selected, installed, or run in E02.**
