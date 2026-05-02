# Multi-stage build: compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy monorepo files
COPY package*.json ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN npm ci

# Build shared, server, and client
RUN npm run build

# Runtime stage with Chrome/Chromium for Puppeteer
FROM node:20-alpine

WORKDIR /app

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
  chromium \
  noto-sans \
  freetype \
  harfbuzz \
  ca-certificates

# Copy package files
COPY package*.json ./

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/templates ./apps/server/templates
COPY --from=builder /app/apps/server/src/scripts ./apps/server/src/scripts

# Install production dependencies only
RUN npm ci --omit=dev --workspace=packages/shared && \
    npm ci --omit=dev --workspace=apps/server

# Create uploads directory
RUN mkdir -p /app/apps/server/uploads

# Expose port
EXPOSE 5000

# Set working directory to server
WORKDIR /app/apps/server

# Set Chromium executable path for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Start server
CMD ["node", "dist/index.js"]
