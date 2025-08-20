try {
  $r = Invoke-WebRequest -Uri 'http://localhost:3000/assets/models/human_muscles.glb' -Method Head -TimeoutSec 10
  $len = $r.Headers['Content-Length']
  Write-Output ("Status: {0} Length: {1}" -f $r.StatusCode, $len)
} catch {
  Write-Output ("Request failed: {0}" -f $_.Exception.Message)
}
