# Multi-stage build for Anatomical 3D Viewer
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install production dependencies
RUN apk add --no-cache \
    tini \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S anatomical -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy built application from builder stage
COPY --from=builder --chown=anatomical:nodejs /app/dist ./dist
COPY --from=builder --chown=anatomical:nodejs /app/server ./server
COPY --from=builder --chown=anatomical:nodejs /app/deploy ./deploy
COPY --from=builder --chown=anatomical:nodejs /app/public ./public
COPY --from=builder --chown=anatomical:nodejs /app/assets ./assets

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R anatomical:nodejs /app

# Switch to non-root user
USER anatomical

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "server/production-server.js"]