# Multi-stage build for smaller production image
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules (including build tools)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev \
    libffi-dev \
    openssl-dev

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --include=dev

# Build native modules
RUN npm rebuild

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install only runtime dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev \
    libffi-dev \
    openssl-dev

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Build native modules for production
RUN npm rebuild

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create necessary directories
RUN mkdir -p logs uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/ollama/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
