# Multi-stage Dockerfile for Somnob Backend (NestJS 10 + Prisma)
FROM node:20-alpine AS builder

WORKDIR /app

# OpenSSL needed for Prisma CLI in Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy dependency manifests
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY apps/pos/package.json ./apps/pos/
COPY apps/admin/package.json ./apps/admin/
COPY apps/customer/package.json ./apps/customer/

RUN npm ci

# Copy shared library and build
COPY packages/shared ./packages/shared
RUN npm --workspace=@somnob/shared run build

# Copy backend source & Prisma schema
COPY apps/backend ./apps/backend

# Generate Prisma client and build NestJS
RUN npm --workspace=@somnob/backend run db:generate
RUN npm --workspace=@somnob/backend run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=4000

# Non-root user for security hardening
USER node

# Copy dependencies and compiled outputs
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --chown=node:node --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --chown=node:node --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --chown=node:node --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --chown=node:node --from=builder /app/apps/backend/package.json ./apps/backend/package.json

WORKDIR /app/apps/backend

EXPOSE 4000

CMD ["node", "dist/main"]
