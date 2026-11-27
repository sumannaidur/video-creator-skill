param([ValidateSet('A','B')][string]$Passage)
$ErrorActionPreference = 'Stop'
$original = Join-Path $PSScriptRoot '..\..\E03\kokoro-hindi\run_monitored.ps1'
$source = Get-Content -LiteralPath $original -Raw
$source = $source.Replace('"samples\sample-$Passage.wav"', '"samples\sample-$Passage-native.wav"')
$source = $source.Replace('"monitor-$Passage.json"', '"native-monitor-$Passage.json"')
$source = $source.Replace('"temp\sample-$Passage.', '"temp\native-$Passage.')
$source = $source.Replace('$monitor = Join-Path $experiment', '$monitor = Join-Path $captureRoot')
$marker = '$before = (Get-CimInstance'
$start = $source.IndexOf('$args = @(')
$end = $source.IndexOf($marker, $start)
if ($start -lt 0 -or $end -le $start) { throw 'Unexpected Kokoro monitor layout' }
$source = $source.Substring(0, $start) + @'
$output = Join-Path $captureRoot "samples\sample-$Passage-native.wav"
$args = @('-B', (Join-Path $captureRoot 'capture_native_timing.py'), $Passage)

'@ + $source.Substring($end)
$captureRoot = $PSScriptRoot
& ([scriptblock]::Create($source)) -Passage $Passage
exit $LASTEXITCODE
