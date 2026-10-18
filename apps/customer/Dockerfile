# Multi-stage Dockerfile for Somnob Customer Mobile Web (Next.js 14 Standalone)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/customer/package.json ./apps/customer/
COPY apps/backend/package.json ./apps/backend/
COPY apps/pos/package.json ./apps/pos/
COPY apps/admin/package.json ./apps/admin/

RUN npm ci

# Copy shared library and build
COPY packages/shared ./packages/shared
RUN npm --workspace=@somnob/shared run build

# Copy customer app and build Next.js
COPY apps/customer ./apps/customer
RUN npm --workspace=@somnob/customer run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

USER node

# Copy standalone build and static files
COPY --chown=node:node --from=builder /app/apps/customer/.next/standalone ./
COPY --chown=node:node --from=builder /app/apps/customer/.next/static ./apps/customer/.next/static

EXPOSE 3002

CMD ["node", "apps/customer/server.js"]
