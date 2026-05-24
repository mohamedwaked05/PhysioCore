# PhysioCore

A physiotherapy platform connecting clients with clinics.

## Docker Setup

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run locally

```bash
# Copy the env template (secrets already filled for local dev)
cp backend/.env.docker backend/.env.docker.local

# Start all services (first run builds images — takes a few minutes)
docker compose up --build
```

| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:3000    |
| Backend  | http://localhost:8080    |
| Reverb   | ws://localhost:9000      |
| Postgres | localhost:5432           |

### Useful commands

```bash
# Rebuild a single service
docker compose build backend

# Tail logs
docker compose logs -f backend

# Run artisan commands
docker compose exec backend php artisan migrate:status

# Stop and remove volumes (wipes the database)
docker compose down -v
```

### Notes
- `backend/.env.docker` is the local-only env file used by Docker Compose. Do not commit real secrets here.
- Redis runs with password `redispass` — already wired up in `.env.docker`.
- Google OAuth won't work locally unless you update `GOOGLE_REDIRECT_URI` and register `localhost` in the Google Console.
