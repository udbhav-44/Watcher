# syntax=docker/dockerfile:1.7

# ============ builder ============
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

RUN npx prisma generate

COPY tsconfig.json next.config.mjs postcss.config.mjs ./
COPY src ./src
COPY public ./public

# Placeholders satisfy the Zod env validator during `next build`'s page-data
# collection. Real values come from compose at runtime; ENV in this builder
# stage does NOT propagate to the runner stage.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TMDB_API_KEY=build-time-placeholder
ENV ADMIN_INTERNAL_KEY=build-time-placeholder-min-16-chars
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV ENABLE_DATABASE=true
RUN npm run build

# ============ runner ============
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Standalone server bundle (minimal node_modules baked in)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/system/readiness || exit 1

CMD ["node", "server.js"]

# ============ migrate ============
# One-shot image for `streaming-migrate` compose service. Needs full Prisma CLI
# transitive deps (e.g. effect); partial copies from runner break migrate deploy.
# Build: docker build --target migrate -t streaming-migrate:v1 .
FROM node:20-alpine AS migrate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]
