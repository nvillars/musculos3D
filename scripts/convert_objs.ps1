param(
    [int]$limit = 10
)

# Convert first N OBJ files from the extracted folder into GLB using obj2gltf (npx)
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\convert_objs.ps1 -limit 20

Write-Host "convert_objs.ps1: starting (limit=$limit)"

# Check Node
try {
    $node = & node -v 2>$null
} catch {
    Write-Host "Node.js not found in PATH. Please install Node.js (https://nodejs.org/) and try again." -ForegroundColor Red
    exit 2
}

# Check npx
try {
    $npxVer = & npx --version 2>$null
} catch {
    Write-Host "npx not available. Please ensure npm >=5.2 or use Node.js that provides npx." -ForegroundColor Red
    exit 3
}

$src = Join-Path $PSScriptRoot '..\assets\models\_tmp\partof_BP3D_4.0_obj_99'
$dst = Join-Path $PSScriptRoot '..\assets\models\_glb_tmp'
New-Item -ItemType Directory -Path $dst -Force | Out-Null

$objs = Get-ChildItem -Path $src -Filter *.obj -File | Sort-Object Length -Descending | Select-Object -First $limit

if (-not $objs) {
    Write-Host "No OBJ files found in $src" -ForegroundColor Yellow
    exit 1
}

foreach ($f in $objs) {
    Write-Host "Converting: $($f.Name)" -ForegroundColor Cyan
    $out = Join-Path $dst ($f.BaseName + '.glb')
    # Use npx --yes to fetch and run obj2gltf; --binary outputs a .glb
    $rc = & npx --yes obj2gltf -i "$($f.FullName)" -o "$out" --binary
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Conversion failed for $($f.Name) (exit $LASTEXITCODE)" -ForegroundColor Red
    } else {
        Write-Host "-> Generated: $out" -ForegroundColor Green
    }
}

Write-Host "Conversion pass complete. Generated files:"
Get-ChildItem -Path $dst | Select-Object Name,Length | Format-Table -AutoSize
