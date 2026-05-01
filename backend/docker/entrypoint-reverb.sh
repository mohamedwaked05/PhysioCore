#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
until php -r "new PDO('pgsql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');" 2>/dev/null; do
  sleep 2
done
echo "PostgreSQL is ready."

echo "Waiting for Redis..."
until php -r "
\$r = new Redis();
\$r->connect('${REDIS_HOST}', ${REDIS_PORT});
\$r->auth('${REDIS_PASSWORD}');
" 2>/dev/null; do
  sleep 2
done
echo "Redis is ready."

php artisan optimize:clear
php artisan optimize

echo "Starting Reverb..."
exec php artisan reverb:start \
  --host="${REVERB_SERVER_HOST:-0.0.0.0}" \
  --port="${REVERB_SERVER_PORT:-8080}" \
  --no-interaction
