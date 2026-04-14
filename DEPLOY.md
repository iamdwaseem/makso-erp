# Deploying WareFlow (Docker)

## What you get

- **PostgreSQL 16** with persistent volume  
- **Node API** on port `4000` inside the network (host port `BACKEND_PORT`, default `3000`)  
- **Nginx** serving the Vite build and proxying **`/api/*`** to the backend (host port `FRONTEND_PORT`, default `80`)

The SPA is built with `VITE_API_URL=/api` so the browser calls the **same origin**; nginx forwards `/api` to the API container.

### CORS and DigitalOcean (or any public host)

Browsers talk to **`https://your-domain/api/...`** (same host as the SPA). You do **not** need `http://localhost:4000` in the frontend env: that value gets baked into the JS bundle and will **fail** from users’ machines (wrong host + CORS).

- Keep **`VITE_API_URL=/api`** for the Docker/nginx layout.
- If you ever split the API to another subdomain, set **`VITE_API_URL=https://api.your-domain.com`** and set backend **`CORS_ORIGIN`** to your SPA origin (e.g. `https://your-domain.com`).

The app also **ignores** localhost `VITE_API_URL` in production builds and falls back to `/api`, so a mis-set DO “build environment” is less likely to break deploys.

## One-time setup

1. Copy the environment template and edit secrets:

   ```bash
   cp env.deploy.example .env
   ```

2. In `.env`, set at least:

   - **`POSTGRES_PASSWORD`** — strong password  
   - **`DATABASE_URL`** — must match Postgres user/db/password; **hostname must be `db`** (the Compose service name), e.g.  
     `postgresql://erpuser:YOUR_PASSWORD@db:5432/erpdb`  
   - **`JWT_SECRET`** — long random string (used to sign JWTs)

3. Build and start:

   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env up --build -d
   ```

   Or from the repo root:

   ```bash
   npm run deploy:up
   ```

4. Open **http://localhost** (or your server’s IP) if `FRONTEND_PORT=80`. If port 80 is busy, set `FRONTEND_PORT=8080` in `.env` and use `http://localhost:8080`.

5. **First user:** With an empty database, the first registered user becomes **ADMIN** on the default organization (see `auth.controller`). Set `ALLOW_PUBLIC_REGISTRATION=true` temporarily if you rely on self-serve signup, or keep it `false` and seed users via a secure path.

## Migrations

The API container runs **`prisma migrate deploy`** on start (`backend` `package.json` `start` script). New releases that include migrations apply automatically on container start.

## Health checks

- API: `GET http://<host>:<BACKEND_PORT>/health` (JSON, includes DB ping)  
- Through nginx: `GET /api/...` is proxied; there is no `/health` on nginx unless you add a route.

## TLS / reverse proxy

Put **Caddy**, **Traefik**, or **nginx** in front of the `frontend` service (port 80) for HTTPS. Set:

- **`TRUST_PROXY=true`** (already set in Compose) so Express trusts `X-Forwarded-*`  
- **`CORS_ORIGIN`** to your public origin(s) if the browser ever calls the API on a different host than the SPA

## Stop

```bash
docker compose -f docker-compose.prod.yml down
# or: npm run deploy:down
```

Data is kept in the `postgres_data` volume unless you `docker compose down -v`.
