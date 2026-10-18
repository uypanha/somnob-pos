# Multi-stage Dockerfile for Somnob Admin (Next.js 14 Standalone)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin/package.json ./apps/admin/
COPY apps/backend/package.json ./apps/backend/
COPY apps/pos/package.json ./apps/pos/
COPY apps/customer/package.json ./apps/customer/

RUN npm ci

# Copy shared library and build
COPY packages/shared ./packages/shared
RUN npm --workspace=@somnob/shared run build

# Copy admin source and build Next.js
COPY apps/admin ./apps/admin
RUN npm --workspace=@somnob/admin run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER node

# Copy standalone build and static files
COPY --chown=node:node --from=builder /app/apps/admin/.next/standalone ./
COPY --chown=node:node --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static

EXPOSE 3000

CMD ["node", "apps/admin/server.js"]
