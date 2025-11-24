# =============================================================================
# Multi-stage Dockerfile for NestJS Backend Application
# Uses Bun as the runtime and package manager
# =============================================================================

# -----------------------------------------------------------------------------
# Build Stage: Compile and build the application
# -----------------------------------------------------------------------------
FROM oven/bun:alpine AS builder

# Metadata
LABEL maintainer="pilput"

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build the application
RUN bun run build

# -----------------------------------------------------------------------------
# Production Stage: Run the application
# -----------------------------------------------------------------------------
FROM oven/bun:alpine

# Metadata
LABEL maintainer="pilput"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install production dependencies and clean up
RUN bun install --production --frozen-lockfile && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy built application and generated files from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/generated ./generated

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Start the application
CMD ["bun", "dist/src/main.js"]
