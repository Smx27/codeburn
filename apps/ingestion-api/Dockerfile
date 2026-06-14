FROM node:22-slim AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/ingestion-api/package.json apps/ingestion-api/
COPY packages/analytics-engine/package.json packages/analytics-engine/

RUN npm install --workspace=apps/ingestion-api

COPY apps/ingestion-api/ apps/ingestion-api/
COPY packages/analytics-engine/ packages/analytics-engine/

RUN npm run build --workspace=packages/analytics-engine && \
    npm run build --workspace=apps/ingestion-api

FROM node:22-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/ingestion-api/package.json apps/ingestion-api/
COPY packages/analytics-engine/package.json packages/analytics-engine/

RUN npm install --omit=dev --workspace=apps/ingestion-api && \
    npm install --omit=dev --workspace=packages/analytics-engine

COPY --from=base /app/apps/ingestion-api/dist apps/ingestion-api/dist
COPY --from=base /app/packages/analytics-engine/dist packages/analytics-engine/dist
COPY --from=base /app/apps/ingestion-api/src/database/migrations apps/ingestion-api/dist/database/migrations

WORKDIR /app/apps/ingestion-api
EXPOSE 3001

CMD ["node", "dist/index.js"]
