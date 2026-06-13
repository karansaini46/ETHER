# Build stage for client assets
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production run stage
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets
COPY --from=client-builder /app/dist ./dist

# Copy server files
COPY server ./server
COPY tsconfig.json ./
COPY tsconfig.node.json ./

# Expose server port
EXPOSE 3001

# Run server with tsx in production mode
ENV NODE_ENV=production
ENV PORT=3001
CMD ["npx", "tsx", "server/index.ts"]
