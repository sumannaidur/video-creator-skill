param([ValidateSet('hi-IN','kn-IN','te-IN','ta-IN','en-IN')][string]$Locale,
      [ValidateSet('A','B')][string]$Passage)
$ErrorActionPreference = 'Stop'
$root = 'D:\video-creator-skill-experiments\E03\mithi'
$experiment = $PSScriptRoot
$model = Join-Path $root 'models'
$key = "$Locale-$Passage"
$manifest = Get-Content -Raw (Join-Path $experiment 'model-manifest.json') | ConvertFrom-Json
foreach ($file in $manifest.files) {
    $path = Join-Path $model $file.path
    if ((Get-Item -LiteralPath $path).Length -ne $file.bytes -or
        (Get-FileHash -LiteralPath $path).Hash -ne $file.sha256) {
        throw "Model integrity check failed for $($file.path)"
    }
}
function AvailableGiB { (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1048576 }
$before = AvailableGiB
if ($before -lt 4) { throw "Insufficient RAM before inference: $before GiB available" }
if ((Get-PSDrive D).Free -lt 8GB) { throw 'Insufficient free storage' }
if (Test-Path "$experiment\samples\$key.wav") { throw "Sample already exists: $key" }
$env:PYTHONNOUSERSITE = '1'
$env:TEMP = Join-Path $root 'temp'
$env:TMP = $env:TEMP
$stdout = "$experiment\$key-inference.json"
$stderr = "$experiment\$key-stderr.txt"
$process = Start-Process -FilePath "$root\venv\Scripts\python.exe" -ArgumentList @(
    ('"{0}"' -f "$experiment\synthesize.py"), ('"{0}"' -f $model), $Locale, $Passage
) -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr
$null = $process.Handle
$watch = [Diagnostics.Stopwatch]::StartNew()
$peak = 0L
$minimum = $before
$reason = $null
do {
    $all = @(Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId)
    $ids = [Collections.Generic.HashSet[int]]::new()
    [void]$ids.Add($process.Id)
    do {
        $count = $ids.Count
        foreach ($p in $all) {
            if ($ids.Contains([int]$p.ParentProcessId)) { [void]$ids.Add([int]$p.ProcessId) }
        }
    } while ($ids.Count -gt $count)
    $rss = 0L
    foreach ($id in $ids) {
        $p = Get-Process -Id $id -ErrorAction SilentlyContinue
        if ($p) { $rss += $p.WorkingSet64 }
    }
    $peak = [math]::Max($peak, $rss)
    $available = AvailableGiB
    $minimum = [math]::Min($minimum, $available)
    if ($rss -gt 2GB) { $reason = 'Sampled process tree exceeded 2 GiB' }
    if ($available -lt 2) { $reason = 'Available system RAM fell below 2 GiB' }
    if ($watch.Elapsed.TotalSeconds -ge 180) { $reason = '180-second timeout' }
    if ($reason) {
        foreach ($id in $ids) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
        break
    }
    Start-Sleep -Milliseconds 200
    $process.Refresh()
} while (-not $process.HasExited)
$process.WaitForExit()
[ordered]@{
    locale = $Locale; passage = $Passage; exit_code = $process.ExitCode; stop_reason = $reason
    elapsed_seconds = $watch.Elapsed.TotalSeconds; peak_sampled_tree_bytes = $peak
    available_before_gib = $before; available_min_gib = $minimum; available_after_gib = (AvailableGiB)
} | ConvertTo-Json | Set-Content -Encoding utf8 "$experiment\$key-monitor.json"
if ($reason -or $process.ExitCode -ne 0) { exit 1 }
$validator = Join-Path (Split-Path $experiment) 'kokoro-hindi\validate_audio.py'
& "$root\venv\Scripts\python.exe" $validator "$experiment\samples\$key.wav" |
    Set-Content -Encoding utf8 "$experiment\$key-validation.json"
exit $LASTEXITCODE
