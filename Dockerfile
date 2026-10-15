# ==============================================================================
# RULEGUARD AI 2.0 - ENTERPRISE MULTI-STAGE DOCKERFILE
# ==============================================================================

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Backend & Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend static assets into backend public directory
COPY --from=frontend-builder /app/frontend/dist /app/backend/public

EXPOSE 3001

CMD ["npm", "start"]
