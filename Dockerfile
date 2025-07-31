# ========================================
# Multi-stage Dockerfile for NestJS + Prisma
# ========================================

# ----------------------------------------
# Stage 1: Dependencies
# ----------------------------------------
FROM node:18-alpine AS dependencies

# Set working directory
WORKDIR /app

# Install system dependencies needed for native packages
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Generate Prisma client
RUN yarn prisma generate

# ----------------------------------------
# Stage 2: Build
# ----------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Install only production dependencies
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

# ----------------------------------------
# Stage 3: Production
# ----------------------------------------
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Copy additional necessary files
COPY --chown=nestjs:nodejs src/i18n ./dist/i18n

# Switch to non-root user
USER nestjs

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version || exit 1

# Start the application
CMD ["node", "dist/main"]