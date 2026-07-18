# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve Backend & Frontend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN npm install --prefix backend --only=production
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY eng.traineddata ./

ENV PORT=8080
EXPOSE 8080
CMD ["node", "backend/server.js"]
