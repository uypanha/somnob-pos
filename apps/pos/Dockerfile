# Multi-stage Dockerfile for Somnob POS PWA
FROM node:20-alpine AS builder

WORKDIR /app

# Install root dependencies
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/pos/package.json ./apps/pos/
COPY apps/backend/package.json ./apps/backend/
COPY apps/admin/package.json ./apps/admin/
COPY apps/customer/package.json ./apps/customer/

RUN npm ci

# Copy shared package and build
COPY packages/shared ./packages/shared
RUN npm --workspace=@somnob/shared run build

# Copy POS app and build
COPY apps/pos ./apps/pos
RUN npm --workspace=@somnob/pos run build

# Stage 2: Nginx Static Server
FROM nginx:1.25-alpine AS runner

COPY --from=builder /app/apps/pos/dist /usr/share/nginx/html
COPY apps/pos/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
