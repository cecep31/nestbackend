# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files for better caching
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bunx prisma generate && bun run build

# Production stage
FROM oven/bun:1-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Install production dependencies
COPY package.json ./
RUN bun install --production --frozen-lockfile && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/generated ./generated

USER nestjs
EXPOSE 3001

CMD ["bun", "dist/main.js"]
