$out = Resolve-Path .\tmp\dev_out.log
for ($i=0; $i -lt 20; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path $out) {
    $text = Get-Content $out -Raw -ErrorAction SilentlyContinue
    if ($text -match 'Local:' -or $text -match 'Project is running' -or $text -match 'http://localhost') {
      Write-Output 'FOUND LOG MARKER'
      $matches = Select-String -InputObject $text -Pattern 'Local:|Project is running|http://localhost' -AllMatches
      foreach ($m in $matches) { Write-Output $m.Line }
      break
    }
  }
  if ($i -eq 19) { Write-Output 'timeout waiting for dev server log markers' }
}
