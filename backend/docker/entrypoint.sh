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

echo "Running migrations and seeding database ..."
php artisan migrate --force

php artisan storage:link || true
php artisan optimize:clear
php artisan optimize

echo "Starting supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
