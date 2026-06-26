FROM node:22-slim AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/dashboard-api/package.json apps/dashboard-api/
COPY packages/analytics-engine/package.json packages/analytics-engine/
COPY packages/auth-shared/package.json packages/auth-shared/

RUN npm install --workspace=apps/dashboard-api

COPY apps/dashboard-api/ apps/dashboard-api/
COPY packages/analytics-engine/ packages/analytics-engine/
COPY packages/auth-shared/ packages/auth-shared/

RUN npm run build --workspace=packages/auth-shared && \
    npm run build --workspace=packages/analytics-engine && \
    npm run build --workspace=apps/dashboard-api

FROM node:22-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/dashboard-api/package.json apps/dashboard-api/
COPY packages/analytics-engine/package.json packages/analytics-engine/
COPY packages/auth-shared/package.json packages/auth-shared/

RUN npm install --omit=dev --workspace=apps/dashboard-api && \
    npm install --omit=dev --workspace=packages/analytics-engine && \
    npm install --omit=dev --workspace=packages/auth-shared

COPY --from=base /app/apps/dashboard-api/dist apps/dashboard-api/dist
COPY --from=base /app/packages/analytics-engine/dist packages/analytics-engine/dist
COPY --from=base /app/packages/auth-shared/dist packages/auth-shared/dist

WORKDIR /app/apps/dashboard-api
EXPOSE 3002

CMD ["node", "dist/index.js"]
