FROM node:22-slim AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/dashboard-web/package.json apps/dashboard-web/

RUN npm install --workspace=apps/dashboard-web

COPY apps/dashboard-web/ apps/dashboard-web/

RUN npm run build --workspace=apps/dashboard-web

FROM node:22-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/dashboard-web/package.json apps/dashboard-web/

RUN npm install --omit=dev --workspace=apps/dashboard-web

COPY --from=base /app/apps/dashboard-web/.next apps/dashboard-web/.next
COPY --from=base /app/apps/dashboard-web/public apps/dashboard-web/public
COPY --from=base /app/apps/dashboard-web/next.config.js apps/dashboard-web/
COPY --from=base /app/apps/dashboard-web/package.json apps/dashboard-web/

WORKDIR /app/apps/dashboard-web
EXPOSE 3000

CMD ["npx", "next", "start"]
