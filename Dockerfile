# Build stage
ARG BUN_VERSION=1
FROM oven/bun:${BUN_VERSION}-alpine AS builder

LABEL maintainer="pilput"

WORKDIR /app

# Copy package files for better caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bunx prisma generate

RUN bun run build

# Production stage
FROM oven/bun:${BUN_VERSION}-alpine

LABEL maintainer="pilput"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Install production dependencies
COPY package.json ./
RUN bun install --production --frozen-lockfile && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy built application and necessary files
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/generated ./generated

USER nestjs
EXPOSE 3001

CMD ["bun", "dist/main.js"]
