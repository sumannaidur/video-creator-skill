param([ValidateSet('A','B')][string]$Passage)
$ErrorActionPreference = 'Stop'
$repo = 'D:\video-creator-skill'
$root = 'D:\video-creator-skill-experiments\E03'
$experiment = Join-Path $repo 'experiments\E03\kokoro-hindi'
$python = Join-Path $root 'venv\Scripts\python.exe'
$model = Join-Path $root 'models\kokoro-v1.0.onnx'
$voices = Join-Path $root 'models\voices-v1.0.bin'
$output = Join-Path $experiment "samples\sample-$Passage.wav"
$metadata = Join-Path $experiment "sample-$Passage.json"
$monitor = Join-Path $experiment "monitor-$Passage.json"
$stdout = Join-Path $root "temp\sample-$Passage.stdout.log"
$stderr = Join-Path $root "temp\sample-$Passage.stderr.log"
$env:ONNX_PROVIDER = 'CPUExecutionProvider'
$env:OMP_NUM_THREADS = '4'
$env:HF_HUB_OFFLINE = '1'
$env:UV_OFFLINE = '1'
$args = @(
    (Join-Path $experiment 'synthesize.py'), '--passage', $Passage,
    '--model', $model, '--voices', $voices,
    '--dataset', (Join-Path $repo 'experiments\E03\evaluation-dataset\hi-IN.json'),
    '--output', $output, '--metadata', $metadata
)
$before = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1048576
if ($before -lt 2) { throw 'Less than 2 GiB of system memory is available before launch' }
if (Test-Path -LiteralPath $output) { throw "Sample already exists: $output" }
$manifest = Get-Content -Raw (Join-Path $experiment 'model-manifest.json') | ConvertFrom-Json
foreach ($asset in @($manifest.model, $manifest.voices)) {
    $file = Join-Path $root "models\$($asset.filename)"
    if ((Get-Item -LiteralPath $file).Length -ne $asset.bytes -or
        (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $asset.sha256) {
        throw "Asset integrity check failed: $($asset.filename)"
    }
}
$process = Start-Process -FilePath $python -ArgumentList $args -WorkingDirectory $repo -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
$null = $process.Handle
$watch = [System.Diagnostics.Stopwatch]::StartNew()
$peak = 0L
$lowestAvailableGiB = $before
$reason = $null
do {
    $all = @(Get-CimInstance Win32_Process)
    $ids = [System.Collections.Generic.HashSet[int]]::new()
    [void]$ids.Add([int]$process.Id)
    do {
        $previous = $ids.Count
        foreach ($item in $all) {
            if ($ids.Contains([int]$item.ParentProcessId)) { [void]$ids.Add([int]$item.ProcessId) }
        }
    } while ($ids.Count -gt $previous)
    $rss = 0L
    foreach ($id in $ids) {
        $active = Get-Process -Id $id -ErrorAction SilentlyContinue
        if ($active) { $rss += $active.WorkingSet64 }
    }
    if ($rss -gt $peak) { $peak = $rss }
    $available = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1048576
    if ($available -lt $lowestAvailableGiB) { $lowestAvailableGiB = $available }
    if ($rss -gt 1GB) { $reason = 'process-tree resident memory exceeded 1 GiB' }
    if ($available -lt 1) { $reason = 'available system memory fell below 1 GiB' }
    if ($watch.Elapsed.TotalSeconds -gt 180) { $reason = '180-second timeout' }
    if ($reason) {
        foreach ($id in $ids) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
        break
    }
    Start-Sleep -Milliseconds 250
    $process.Refresh()
} while (-not $process.HasExited)
$process.WaitForExit()
$after = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1048576
$result = [ordered]@{
    passage = $Passage
    exit_code = $process.ExitCode
    stop_reason = $reason
    elapsed_seconds = [math]::Round($watch.Elapsed.TotalSeconds, 3)
    peak_sampled_process_tree_resident_bytes = $peak
    available_gib_before = [math]::Round($before, 3)
    available_gib_lowest_sampled = [math]::Round($lowestAvailableGiB, 3)
    available_gib_after = [math]::Round($after, 3)
}
$result | ConvertTo-Json | Set-Content -Path $monitor -Encoding utf8
$result | ConvertTo-Json
if ($reason -or $process.ExitCode -ne 0) { exit 1 }
