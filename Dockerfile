# Multi-stage build: compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy monorepo root files
COPY package*.json ./

# Copy only needed workspaces (shared and server, skip client)
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Install all dependencies
RUN npm ci

# Build shared and server only (skip client build)
RUN npm run build:shared && npm run build:server

# Runtime stage with Chrome/Chromium for Puppeteer
FROM node:20-alpine

WORKDIR /app

# Install Chromium and dependencies for Puppeteer
# Use common Alpine font packages (fontconfig, ttf-dejavu) instead of noto-sans
RUN apk add --no-cache \
  chromium \
  fontconfig \
  ttf-dejavu \
  freetype \
  harfbuzz \
  ca-certificates

# Copy package files for production install
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/server/package.json ./apps/server/package.json

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist
# Copy templates from server build output (created by copyTemplates.mjs)
COPY --from=builder /app/apps/server/dist/templates ./apps/server/templates

# Install production dependencies only
RUN npm ci --omit=dev

# Create uploads directory
RUN mkdir -p ./apps/server/uploads

# Expose port
EXPOSE 5000

# Set environment variables
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Start server
CMD ["node", "apps/server/dist/index.js"]
