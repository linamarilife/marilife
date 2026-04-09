# Multi-stage build for production
FROM node:20-alpine AS deps

WORKDIR /app

# Install system dependencies required for Prisma
RUN apk add --no-cache openssl ca-certificates

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies for build (including devDependencies)
RUN npm ci

# Generate Prisma client with proper OpenSSL configuration
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
RUN npx prisma generate

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install system dependencies for production (Prisma engine)
RUN apk add --no-cache openssl ca-certificates

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files for production dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma

# Set permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(e=>process.exit(1))"

# Start the application
CMD ["npm", "start"]