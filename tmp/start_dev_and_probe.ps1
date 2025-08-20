# Start dev server with logs and probe common ports
$cwd = Get-Location
$stdout = Join-Path $cwd 'tmp\dev_out.log'
$stderr = Join-Path $cwd 'tmp\dev_err.log'
if (Test-Path $stdout) { Remove-Item $stdout -Force }
if (Test-Path $stderr) { Remove-Item $stderr -Force }
$proc = Start-Process npm -ArgumentList 'run','dev' -WorkingDirectory $cwd -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
Write-Output "Started npm run dev, PID=$($proc.Id)"
Start-Sleep -Seconds 6
Write-Output '--- STDOUT tail ---'
if (Test-Path $stdout) { Get-Content $stdout -Tail 200 -ErrorAction SilentlyContinue } else { Write-Output 'no stdout yet' }
Write-Output '--- STDERR tail ---'
if (Test-Path $stderr) { Get-Content $stderr -Tail 200 -ErrorAction SilentlyContinue } else { Write-Output 'no stderr yet' }
Write-Output '--- Checking ports ---'
$ports = @(8080,9000,3000,8081,5173)
foreach ($p in $ports) {
  Write-Output "Checking http://localhost:$p/assets/models/human_muscles.glb"
  try {
    $r = Invoke-WebRequest -Uri ("http://localhost:{0}/assets/models/human_muscles.glb" -f $p) -Method Head -TimeoutSec 3
  Write-Output ("{0}: {1}" -f $p, $r.StatusCode)
  } catch {
  Write-Output ("{0}: not responding" -f $p)
  }
}
