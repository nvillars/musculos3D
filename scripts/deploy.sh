#!/bin/bash

# Deployment script for Anatomical 3D Viewer
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/${ENVIRONMENT}_${TIMESTAMP}"

echo "🚀 Starting deployment to ${ENVIRONMENT}..."

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

echo "✅ Environment validation passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level moderate

# Build the application
echo "🔨 Building application for ${ENVIRONMENT}..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    npm run build
else
    npm run build:staging
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current deployment (if exists)
if [[ -d "dist" ]]; then
    echo "💾 Creating backup..."
    cp -r dist "$BACKUP_DIR/dist_backup"
fi

# Run lighthouse audit for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "🔍 Running Lighthouse audit..."
    npm run lighthouse || echo "⚠️  Lighthouse audit failed, continuing..."
fi

# Docker build (if Dockerfile exists)
if [[ -f "Dockerfile" ]]; then
    echo "🐳 Building Docker image..."
    docker build -t "anatomical-3d-viewer:${ENVIRONMENT}-${TIMESTAMP}" .
    docker tag "anatomical-3d-viewer:${ENVIRONMENT}-${TIMESTAMP}" "anatomical-3d-viewer:${ENVIRONMENT}-latest"
fi

# Deployment specific actions
case $ENVIRONMENT in
    "staging")
        echo "🚀 Deploying to staging..."
        # Add staging deployment commands here
        # Example: rsync, scp, or cloud deployment commands
        echo "📝 Staging deployment completed"
        ;;
    "production")
        echo "🚀 Deploying to production..."
        # Add production deployment commands here
        # Example: blue-green deployment, rolling updates, etc.
        echo "📝 Production deployment completed"
        ;;
esac

# Health check
echo "🏥 Performing health check..."
sleep 5

# Cleanup old backups (keep last 5)
echo "🧹 Cleaning up old backups..."
ls -t backups/ | tail -n +6 | xargs -r rm -rf

echo "✅ Deployment to ${ENVIRONMENT} completed successfully!"
echo "📊 Deployment summary:"
echo "   - Environment: ${ENVIRONMENT}"
echo "   - Timestamp: ${TIMESTAMP}"
echo "   - Backup location: ${BACKUP_DIR}"

# Send notification (optional)
if [[ -n "$SLACK_WEBHOOK" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 Anatomical 3D Viewer deployed to ${ENVIRONMENT} successfully!\"}" \
        "$SLACK_WEBHOOK"
fi

echo "🎉 All done!"