param(
    [int]$limit = 0
)

Write-Host "merge_glbs.ps1: starting (limit=$limit)"
$srcDir = Join-Path $PSScriptRoot '..\assets\models\_glb_tmp'
$dstFile = Join-Path $PSScriptRoot '..\assets\models\human_muscles.glb'
$tempDir = Join-Path $PSScriptRoot '..\assets\models\_glb_merge_tmp'
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$glbs = Get-ChildItem -Path $srcDir -Filter *.glb -File | Sort-Object Name
if ($limit -gt 0) { $glbs = $glbs | Select-Object -First $limit }

if (-not $glbs) {
    Write-Host "No GLB files found in $srcDir" -ForegroundColor Yellow
    exit 1
}

# Build merge command: list inputs then output
$inputFiles = ($glbs | ForEach-Object { '"' + $_.FullName + '"' }) -join ' '
$cmd = "npx --yes @gltf-transform/cli merge $inputFiles " + '"' + $dstFile + '"'
Write-Host "Running: $cmd"
Invoke-Expression $cmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "Merge failed (exit $LASTEXITCODE)" -ForegroundColor Red
    exit 2
}

Write-Host "Merge complete. Output: $dstFile"
Get-Item $dstFile | Select-Object FullName,Length | Format-List
