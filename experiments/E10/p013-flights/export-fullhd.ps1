# P013.6 Full HD export of the flight explainer (private prototype).
# Run from any folder:  powershell -ExecutionPolicy Bypass -File D:\video-creator-skill\experiments\E10\p013-flights\export-fullhd.ps1 -Step All
# Steps: Render (checkpointed frames + MP4 with narration), Mux (attach corrected mix, video stream copy), Validate, All.
# Re-running Render resumes from verified frames in fullhd\frames. Only one renderer may write there (lock file).
param([ValidateSet('Render', 'Mux', 'Validate', 'All')][string]$Step = 'All')
$ErrorActionPreference = 'Stop'
$repo = 'D:\video-creator-skill'
$dir = Join-Path $repo 'experiments\E10\p013-flights'
$out = Join-Path $dir 'fullhd'
$rendered = Join-Path $out 'flights-1080x1920-narration.mp4'
$final = Join-Path $out 'flights-1080x1920-mixed.mp4'
$mix = Join-Path $dir 'audio\flights-mix.wav'
$bed = Join-Path $dir 'audio\flights-mix.bed.wav'
$narration = Join-Path $dir 'narration-DK.wav'
Set-Location $repo
New-Item -ItemType Directory -Force $out | Out-Null

function Invoke-Render {
    $lockPath = Join-Path $out 'render.lock'
    try { $lock = [System.IO.File]::Open($lockPath, 'CreateNew', 'Write', 'None') }
    catch { throw "Another render appears to be using $out (lock: $lockPath). If no render is running, delete the lock file and retry." }
    try {
        # --keys-only is not used: every frame is rendered and checked. Frames are kept for recovery (no --clean-frames).
        & node experiments/E10/p013.1/render.mjs --topic experiments/E10/p013-flights/topic-opening.js `
            --timeline experiments/E10/p013-flights/narration-DK.timeline.json --out $out `
            --name flights-1080x1920-narration.mp4 --scale 1 --fps 30 --quality 95 --crf 18
        if ($LASTEXITCODE -ne 0) { throw "Renderer failed (exit $LASTEXITCODE); re-run -Step Render to resume from verified frames." }
    } finally { $lock.Close(); Remove-Item $lockPath -Force }
}

function Invoke-Mux {
    if (-not (Test-Path $rendered)) { throw "Missing $rendered; run -Step Render first." }
    if (Test-Path $final) { throw "$final already exists; move it aside before muxing again." }
    & ffmpeg -hide_banner -loglevel error -i $rendered -i $mix -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 `
        -shortest -movflags +faststart $final
    if ($LASTEXITCODE -ne 0) { throw 'Mux failed.' }
}

function Invoke-Validate {
    # FFmpeg writes normal diagnostics to stderr; in PowerShell 5.1 'Stop' would turn them into errors, so capture them as text here.
    $ErrorActionPreference = 'Continue'
    $fail = @()
    $probe = & ffprobe -v quiet -count_frames -show_entries 'stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames,sample_rate,channels,duration:format=duration' -of json $final | ConvertFrom-Json
    $v = $probe.streams | Where-Object codec_type -eq 'video'; $a = $probe.streams | Where-Object codec_type -eq 'audio'
    if ($v.codec_name -ne 'h264' -or $v.width -ne 1080 -or $v.height -ne 1920 -or $v.pix_fmt -ne 'yuv420p' -or $v.r_frame_rate -ne '30/1') { $fail += 'video format' }
    if ([int]$v.nb_read_frames -ne 2064) { $fail += "frames=$($v.nb_read_frames)" }
    if ($a.codec_name -ne 'aac' -or [int]$a.channels -ne 2 -or $a.sample_rate -ne '48000') { $fail += 'audio format' }
    foreach ($d in @($v.duration, $a.duration, $probe.format.duration)) { if ([math]::Abs([double]$d - 68.8) -gt 0.04) { $fail += "duration=$d" } }
    $md5 = { param($f) (& ffmpeg -hide_banner -loglevel error -i $f -map 0:v -c copy -f md5 -) }
    if ((& $md5 $rendered) -ne (& $md5 $final)) { $fail += 'video stream changed by mux' }
    $decode = @(& ffmpeg -hide_banner -v error -i $final -f null - 2>&1 | ForEach-Object { "$_" })
    if ($decode) { $fail += 'decode errors' }
    # Loudness and true peak of the delivered AAC (target -16 LUFS +/-1; AAC may add a few tenths of a dB of peak).
    $r128 = (& ffmpeg -hide_banner -nostats -i $final -af ebur128=peak=true -f null - 2>&1 | ForEach-Object { "$_" }) -join "`n"
    $summary = $r128.Substring($r128.LastIndexOf('Summary:'))
    $lufs = [double]([regex]::Match($summary, 'I:\s+(-?[\d.]+) LUFS').Groups[1].Value)
    $peak = [double]([regex]::Match($summary, 'Peak:\s+(-?[\d.]+) dBFS').Groups[1].Value)
    if ([math]::Abs($lufs + 16) -gt 1) { $fail += "loudness=$lufs" }
    if ($peak -gt -1.0) { $fail += "true peak=$peak" }
    # Narration sync: decode the delivered audio and run the P013.5.1 bed-subtracted cross-correlation (2 ms, corr >= 0.95).
    $decoded = Join-Path $out 'final-audio.wav'
    & ffmpeg -hide_banner -loglevel error -y -i $final -map 0:a -c:a pcm_s16le -ar 48000 $decoded
    $sync = & python -I experiments/E10/audio-mix/mix_audio.py --check-sync $narration $decoded $bed
    if ($LASTEXITCODE -ne 0) { $fail += "sync $sync" }
    $report = [ordered]@{ file = $final; width = $v.width; height = $v.height; pix_fmt = $v.pix_fmt; fps = $v.r_frame_rate; frames = $v.nb_read_frames
        video_seconds = $v.duration; audio_seconds = $a.duration; lufs = $lufs; true_peak_dbtp = $peak; sync = ($sync | ConvertFrom-Json); failures = $fail }
    $report | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 (Join-Path $out 'export-validation.json')
    $report | ConvertTo-Json -Depth 4
    if ($fail.Count) { throw "Validation failed: $($fail -join '; ')" }
    'Full HD export validated.'
}

if ($Step -in 'Render', 'All') { Invoke-Render }
if ($Step -in 'Mux', 'All') { Invoke-Mux }
if ($Step -in 'Validate', 'All') { Invoke-Validate }
