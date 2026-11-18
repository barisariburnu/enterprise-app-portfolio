# Stage 1: Dependencies
FROM oven/bun:1@sha256:1d22548f177f4ff38e0c15baa3c2c46c6c2060ba2d1bc573bb4720b407548f1d AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install

# Stage 2: Builder
FROM oven/bun:1@sha256:1d22548f177f4ff38e0c15baa3c2c46c6c2060ba2d1bc573bb4720b407548f1d AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN bun run db:generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1@sha256:1d22548f177f4ff38e0c15baa3c2c46c6c2060ba2d1bc573bb4720b407548f1d AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user (Debian-compatible)
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh

# Ensure db directory exists and set permissions
RUN mkdir -p /app/db && chown -R nextjs:nodejs /app

USER nextjs

COPY --from=builder /app/src/lib/monitoring.cjs ./src/lib/monitoring.cjs
COPY --from=builder /app/scripts/monitoring-check.mjs ./scripts/monitoring-check.mjs
COPY --from=builder /app/node_modules/@sentry ./node_modules/@sentry
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run db push on startup, then start the app
CMD ["sh", "entrypoint.sh"]

# Immutable runtime identity is added after expensive install/build layers.
ARG MONITORING_SOURCE_REVISION
RUN test "${#MONITORING_SOURCE_REVISION}" -eq 40 && case "$MONITORING_SOURCE_REVISION" in *[!0-9a-f]*) exit 35 ;; esac
ENV SENTRY_RELEASE=enterprise-app-portfolio@${MONITORING_SOURCE_REVISION}
LABEL org.opencontainers.image.revision="${MONITORING_SOURCE_REVISION}"
