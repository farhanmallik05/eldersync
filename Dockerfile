# -------------------------------------------------------------
# ElderSync — Multi-Stage Production Container for Cloud Run
# PromptWars × Catalyst Round 2
# -------------------------------------------------------------

# Stage 1: Build Frontend SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend Server
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy backend production dependencies & compiled server
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy compiled frontend assets to frontend/dist for unified serving
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080

CMD ["node", "backend/dist/server.js"]
