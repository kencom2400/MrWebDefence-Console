# Multi-stage build for NestJS application
FROM node:20.18.0-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Set working directory to project root
WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package configuration
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (this will install dependencies for all workspace packages including backend)
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
WORKDIR /app/apps/backend

# Copy source code (this is often overridden by volume mounts in dev, but good for completeness)
COPY apps/backend .

# Expose port
EXPOSE 3001

# Start development server
CMD ["pnpm", "run", "start:dev"]

# Production build stage
FROM base AS build
WORKDIR /app/apps/backend

# Copy source code
COPY apps/backend .

# Build application
RUN pnpm run build

# Production stage
FROM node:20.18.0-alpine AS production

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files (root and backend)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
# Note: We need to copy to the correct location in the new structure
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set working directory to backend
WORKDIR /app/apps/backend

# Expose port
EXPOSE 3001

# Start production server
CMD ["node", "dist/main"]
