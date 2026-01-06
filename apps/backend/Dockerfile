# Multi-stage build for NestJS application
FROM node:20.18.0-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start development server
CMD ["pnpm", "run", "start:dev"]

# Production build stage
FROM base AS build

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:20.18.0-alpine AS production

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 3001

# Start production server
CMD ["pnpm", "run", "start:prod"]

