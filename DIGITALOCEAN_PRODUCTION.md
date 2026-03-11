# DigitalOcean Production Deployment

This guide deploys the app on a DigitalOcean Droplet using Docker Compose.

## 1) Provision droplet

- Ubuntu 22.04+
- Minimum: 2 vCPU / 4 GB RAM
- Open inbound ports: `22`, `80`, `443`

## 2) Install runtime dependencies

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin ufw
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

Re-login after adding your user to the docker group.

## 3) Copy project to server

```bash
git clone <your-repo-url> side-gig
cd side-gig
```

## 4) Configure production env

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and set secure values:

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN` (your HTTPS domain)

## 5) Launch production stack

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Check:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
```

## 6) Domain + TLS

Use DigitalOcean Load Balancer or Nginx/Caddy in front for HTTPS.

- Point domain A record to droplet IP.
- Terminate TLS with Let's Encrypt.
- Keep port 80 redirecting to 443.

## 7) Verify deployment

```bash
curl http://<server-ip>/      # frontend HTML
curl http://<server-ip>/api/auth/me
curl http://<server-ip>/health
```

## 8) Update deploys

```bash
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## 9) Backups and monitoring

- Enable DigitalOcean automated backups.
- Use managed PostgreSQL if possible for stronger durability.
- Ship logs to a centralized service.

