#!/bin/sh
set -e

echo "Running database migrations..."
node dist/database/migrate.js

echo "Starting Ingestion API..."
exec node dist/index.js
