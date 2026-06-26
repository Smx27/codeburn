FROM node:22-slim AS base
WORKDIR /app

# 1. Copy root and all workspace package.json files for caching
COPY package.json package-lock.json* ./
COPY apps/ingestion-api/package.json apps/ingestion-api/
COPY packages/analytics-engine/package.json packages/analytics-engine/
COPY packages/auth-shared/package.json packages/auth-shared/

# Install all dependencies (including devDependencies for building)
RUN npm install --workspace=apps/ingestion-api

# 2. Copy the actual source code for all workspaces
COPY apps/ingestion-api/ apps/ingestion-api/
COPY packages/analytics-engine/ packages/analytics-engine/
COPY packages/auth-shared/ packages/auth-shared/

# 3. Build the shared packages first, then the main API
# (Note: If auth-shared doesn't have a build script, you can remove its build command)
RUN npm run build --workspace=packages/auth-shared && \
    npm run build --workspace=packages/analytics-engine && \
    npm run build --workspace=apps/ingestion-api

FROM node:22-slim AS runtime
WORKDIR /app

# 4. Copy package files again for production-only install
COPY package.json package-lock.json* ./
COPY apps/ingestion-api/package.json apps/ingestion-api/
COPY packages/analytics-engine/package.json packages/analytics-engine/
COPY packages/auth-shared/package.json packages/auth-shared/

# Install production dependencies only
RUN npm install --omit=dev --workspace=apps/ingestion-api && \
    npm install --omit=dev --workspace=packages/analytics-engine && \
    npm install --omit=dev --workspace=packages/auth-shared

# 5. Copy compiled build artifacts from the base stage
COPY --from=base /app/apps/ingestion-api/dist apps/ingestion-api/dist
COPY --from=base /app/packages/analytics-engine/dist packages/analytics-engine/dist
COPY --from=base /app/packages/auth-shared/dist packages/auth-shared/dist
COPY --from=base /app/apps/ingestion-api/src/database/migrations apps/ingestion-api/dist/database/migrations

WORKDIR /app/apps/ingestion-api
EXPOSE 3001

CMD ["node", "dist/index.js"]
