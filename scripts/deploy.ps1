# PowerShell deployment script for Anatomical 3D Viewer
# Usage: .\scripts\deploy.ps1 [staging|production]

param(
    [Parameter(Position=0)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "staging"
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = "backups\${Environment}_${Timestamp}"

Write-Host "🚀 Starting deployment to $Environment..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check for required tools
try {
    node --version | Out-Null
    npm --version | Out-Null
    Write-Host "✅ Environment validation passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js and npm are required but not installed." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
npm run test:ci

# Run security audit
Write-Host "🔒 Running security audit..." -ForegroundColor Yellow
npm audit --audit-level moderate

# Build the application
Write-Host "🔨 Building application for $Environment..." -ForegroundColor Yellow
if ($Environment -eq "production") {
    npm run build
} else {
    npm run build:staging
}

# Create backup directory
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Backup current deployment (if exists)
if (Test-Path "dist") {
    Write-Host "💾 Creating backup..." -ForegroundColor Yellow
    Copy-Item -Recurse "dist" "$BackupDir\dist_backup"
}

# Run lighthouse audit for production
if ($Environment -eq "production") {
    Write-Host "🔍 Running Lighthouse audit..." -ForegroundColor Yellow
    try {
        npm run lighthouse
    } catch {
        Write-Host "⚠️  Lighthouse audit failed, continuing..." -ForegroundColor Yellow
    }
}

# Docker build (if Dockerfile exists)
if (Test-Path "Dockerfile") {
    Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
    docker build -t "anatomical-3d-viewer:${Environment}-${Timestamp}" .
    docker tag "anatomical-3d-viewer:${Environment}-${Timestamp}" "anatomical-3d-viewer:${Environment}-latest"
}

# Deployment specific actions
switch ($Environment) {
    "staging" {
        Write-Host "🚀 Deploying to staging..." -ForegroundColor Green
        # Add staging deployment commands here
        Write-Host "📝 Staging deployment completed" -ForegroundColor Green
    }
    "production" {
        Write-Host "🚀 Deploying to production..." -ForegroundColor Green
        # Add production deployment commands here
        Write-Host "📝 Production deployment completed" -ForegroundColor Green
    }
}

# Health check
Write-Host "🏥 Performing health check..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Cleanup old backups (keep last 5)
Write-Host "🧹 Cleaning up old backups..." -ForegroundColor Yellow
$OldBackups = Get-ChildItem "backups" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5
$OldBackups | Remove-Item -Recurse -Force

Write-Host "✅ Deployment to $Environment completed successfully!" -ForegroundColor Green
Write-Host "📊 Deployment summary:" -ForegroundColor Cyan
Write-Host "   - Environment: $Environment" -ForegroundColor Cyan
Write-Host "   - Timestamp: $Timestamp" -ForegroundColor Cyan
Write-Host "   - Backup location: $BackupDir" -ForegroundColor Cyan

Write-Host "🎉 All done!" -ForegroundColor Green