● PhysioCore — Production Stack Reference
                                                                                                                                                                       
  Backend Versions (Exact / Locked)
                                                                                                                                                                         ┌──────────────────────────────────┬──────────┬────────────────┐
  │             Package              │ Required │ Locked Version │                                                                                                     
  ├──────────────────────────────────┼──────────┼────────────────┤
  │ PHP                              │ ^8.2     │ min 8.2        │
  ├──────────────────────────────────┼──────────┼────────────────┤
  │ Laravel Framework                │ ^12.0    │ v12.56.0       │
  ├──────────────────────────────────┼──────────┼────────────────┤
  │ Laravel Reverb (WebSocket)       │ ^1.10    │ v1.10.0        │
  ├──────────────────────────────────┼──────────┼────────────────┤
  │ Laravel Sanctum (API auth)       │ ^4.3     │ v4.3.1         │
  ├──────────────────────────────────┼──────────┼────────────────┤
  │ Laravel Socialite (Google OAuth) │ ^5.26    │ v5.26.0        │
  ├──────────────────────────────────┼──────────┼────────────────┤
  │ Predis (Redis client)            │ *        │ v3.4.2         │
  ├──────────────────────────────────┼──────────┼────────────────┤
  │ Laravel Tinker                   │ ^2.10.1  │ —              │
  └──────────────────────────────────┴──────────┴────────────────┘

  Frontend Versions (package.json)

  ┌───────────────────────────────────────┬─────────┐
  │                Package                │ Version │
  ├───────────────────────────────────────┼─────────┤
  │ React                                 │ ^19.2.4 │
  ├───────────────────────────────────────┼─────────┤
  │ React DOM                             │ ^19.2.4 │
  ├───────────────────────────────────────┼─────────┤
  │ React Router DOM                      │ ^7.13.2 │
  ├───────────────────────────────────────┼─────────┤
  │ Axios                                 │ ^1.14.0 │
  ├───────────────────────────────────────┼─────────┤
  │ Laravel Echo                          │ ^2.3.4  │
  ├───────────────────────────────────────┼─────────┤
  │ Pusher JS (Echo transport for Reverb) │ ^8.5.0  │
  ├───────────────────────────────────────┼─────────┤
  │ react-scripts (CRA build tool)        │ 5.0.1   │
  └───────────────────────────────────────┴─────────┘

  ---
  Services & Ports

  ┌──────────────────┬────────────────────┬────────────────────────────────────┐
  │     Service      │        Port        │               Notes                │
  ├──────────────────┼────────────────────┼────────────────────────────────────┤
  │ Laravel API      │ 80 / 443 via Nginx │ PHP-FPM behind Nginx               │
  ├──────────────────┼────────────────────┼────────────────────────────────────┤
  │ PostgreSQL       │ 5432               │ Already in use locally             │
  ├──────────────────┼────────────────────┼────────────────────────────────────┤
  │ Redis            │ 6379               │ DB 0 = queue/default, DB 1 = cache │
  ├──────────────────┼────────────────────┼────────────────────────────────────┤
  │ Reverb WebSocket │ 8080 (internal)    │ Proxied through Nginx on 443       │
  ├──────────────────┼────────────────────┼────────────────────────────────────┤
  │ AI Microservice  │ 8001 (internal)    │ Python/FastAPI — localhost only    │
  └──────────────────┴────────────────────┴────────────────────────────────────┘

  ---
  Production .env (full)

  APP_NAME=PhysioCore
  APP_ENV=production
  APP_DEBUG=false
  APP_URL=https://yourdomain.com

  APP_LOCALE=en
  APP_FALLBACK_LOCALE=en

  BCRYPT_ROUNDS=12

  LOG_CHANNEL=stack
  LOG_STACK=single
  LOG_LEVEL=error

  # PostgreSQL (same driver you already use locally)
  DB_CONNECTION=pgsql
  DB_HOST=127.0.0.1
  DB_PORT=5432
  DB_DATABASE=physiocore
  DB_USERNAME=your_db_user
  DB_PASSWORD=your_db_password

  # Sessions via Redis
  SESSION_DRIVER=redis
  SESSION_LIFETIME=120
  SESSION_ENCRYPT=false
  SESSION_PATH=/
  SESSION_DOMAIN=.yourdomain.com

  # Broadcasting via Reverb
  BROADCAST_CONNECTION=reverb

  # Queue via Redis (NOT database)
  QUEUE_CONNECTION=redis

  # Cache via Redis (NOT database)
  CACHE_STORE=redis

  # Redis
  REDIS_CLIENT=predis
  REDIS_HOST=127.0.0.1
  REDIS_PASSWORD=null
  REDIS_PORT=6379
  REDIS_DB=0
  REDIS_CACHE_DB=1

  # Reverb WebSocket
  # Internal server listens on 8080, clients connect via wss on 443 through Nginx
  REVERB_APP_ID=your_app_id
  REVERB_APP_KEY=your_app_key
  REVERB_APP_SECRET=your_app_secret
  REVERB_HOST=yourdomain.com
  REVERB_PORT=443
  REVERB_SCHEME=https
  REVERB_SERVER_HOST=0.0.0.0
  REVERB_SERVER_PORT=8080

  # Mail (configure with your provider)
  MAIL_MAILER=smtp
  MAIL_HOST=your_smtp_host
  MAIL_PORT=587
  MAIL_USERNAME=your_mail_user
  MAIL_PASSWORD=your_mail_password
  MAIL_FROM_ADDRESS="noreply@yourdomain.com"
  MAIL_FROM_NAME="PhysioCore"

  # Google OAuth
  GOOGLE_CLIENT_ID=your_google_client_id
  GOOGLE_CLIENT_SECRET=your_google_client_secret
  GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

  # Frontend (for CORS)
  FRONTEND_URL=https://yourapp.vercel.app

  ---
  VPS — Packages to Install (Nginx)

  # PHP 8.2 + required extensions
  apt install php8.2-fpm php8.2-pgsql php8.2-redis php8.2-mbstring \
              php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath php8.2-intl

  # PostgreSQL
  apt install postgresql postgresql-client

  # Redis
  apt install redis-server

  # Nginx
  apt install nginx

  # Supervisor (keep queue worker + Reverb alive)
  apt install supervisor

  # Composer
  curl -sS https://getcomposer.org/installer | php
  mv composer.phar /usr/local/bin/composer

  ---
  Supervisor — 3 Processes to Keep Alive

  Queue Worker (/etc/supervisor/conf.d/physiocore-queue.conf):
  [program:physiocore-queue]
  command=php /var/www/physiocore/artisan queue:work redis --tries=3 --timeout=90
  directory=/var/www/physiocore
  user=www-data
  autostart=true
  autorestart=true
  redirect_stderr=true
  stdout_logfile=/var/log/physiocore-queue.log

  Reverb WebSocket Server (/etc/supervisor/conf.d/physiocore-reverb.conf):
  [program:physiocore-reverb]
  command=php /var/www/physiocore/artisan reverb:start --host=0.0.0.0 --port=8080
  directory=/var/www/physiocore
  user=www-data
  autostart=true
  autorestart=true
  redirect_stderr=true
  stdout_logfile=/var/log/physiocore-reverb.log

  AI Microservice (/etc/supervisor/conf.d/physiocore-ai.conf):
  [program:physiocore-ai]
  command=/var/www/physiocore/ai-service/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001
  directory=/var/www/physiocore/ai-service
  user=www-data
  autostart=true
  autorestart=true
  redirect_stderr=true
  stdout_logfile=/var/log/physiocore-ai.log
  environment=AI_API_KEY="%(ENV_AI_SERVICE_API_KEY)s"

  ---
  Nginx Config

  server {
      listen 443 ssl;
      server_name yourdomain.com;
      root /var/www/physiocore/public;
      index index.php;

      ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

      # Laravel API
      location / {
          try_files $uri $uri/ /index.php?$query_string;
      }

      location ~ \.php$ {
          fastcgi_pass unix:/run/php/php8.2-fpm.sock;
          fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
          include fastcgi_params;
      }

      # Reverb WebSocket — proxy internal :8080 to wss://yourdomain.com/app
      location /app {
          proxy_pass http://127.0.0.1:8080;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "Upgrade";
          proxy_set_header Host $host;
      }
  }

  server {
      listen 80;
      server_name yourdomain.com;
      return 301 https://$host$request_uri;
  }

  ---
  Vercel (Frontend)

  Vercel supports CRA (react-scripts) natively. Set these in your Vercel project environment variables:

  REACT_APP_API_URL=https://yourdomain.com/api
  REACT_APP_REVERB_HOST=yourdomain.com
  REACT_APP_REVERB_PORT=443
  REACT_APP_REVERB_SCHEME=https
  REACT_APP_REVERB_APP_KEY=your_app_key

  Then update your frontend Echo/Axios config to read from process.env.REACT_APP_* instead of hardcoded localhost values.

  ---
  Laravel Deploy Commands (run once on VPS)

  composer install --no-dev --optimize-autoloader
  php artisan key:generate
  php artisan migrate --force
  php artisan config:cache
  php artisan route:cache
  php artisan event:cache
  php artisan storage:link
  supervisorctl reread && supervisorctl update && supervisorctl start all
