# WareFlow — Native Production Deployment Guide

Deploy on Ubuntu 24.04 with Node, Nginx, and PostgreSQL (no Docker).

---

## Prerequisites

- Node 18+, npm
- PostgreSQL 16+
- Nginx
- PM2 (for process management)

```bash
sudo apt update
sudo apt install -y nodejs npm nginx postgresql
sudo npm install -g pm2
```

---

## 1. Clone and Enter Project

```bash
cd /root
git clone <your-repo-url> WareFlow
cd WareFlow
```

---

## 2. Backend Setup

```bash
cd /root/WareFlow/backend
npm install
```

**Create `.env`** (copy from `.env.example` and edit):

```env
DATABASE_URL="postgresql://erpuser:YOUR_PASSWORD@localhost:5432/erpdb"
JWT_SECRET="your-very-long-random-secret-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT="3000"
NODE_ENV="production"
ALLOW_PUBLIC_REGISTRATION="false"
CORS_ORIGIN="https://wareflow.waseemuddin.me"
TRUST_PROXY="true"
HTTP_LOGS="false"
```

**Create DB and user** (if not exists):

```bash
sudo -u postgres psql -c "CREATE USER erpuser WITH PASSWORD 'YOUR_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE erpdb OWNER erpuser;"
```

**Build and migrate:**

```bash
npm run build
npx prisma migrate deploy
```

**Start with PM2:**

```bash
pm2 start dist/server.js --name wareflow-backend
pm2 save
pm2 startup
```

**Verify:**

```bash
curl http://localhost:3000/health
```

---

## 3. Frontend Setup

```bash
cd /root/WareFlow/frontend
npm install
```

**Create `.env.production`** (ensures API uses relative `/api`):

```bash
echo 'VITE_API_URL=/api' > .env.production
```

**Build:**

```bash
npm run build
ls dist/
```

---

## 4. Stop Vite Dev Server

If the dev server (port 5173) is running, stop it:

```bash
lsof -i :5173
kill <PID>
```

---

## 5. Nginx Configuration

Edit your site config:

```bash
sudo nano /etc/nginx/sites-available/wareflow
```

Paste this (update paths/domain if needed):

```nginx
server {
    server_name wareflow.waseemuddin.me;

    # Frontend: static build
    location / {
        root /root/WareFlow/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Health check (backend root route)
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/wareflow.waseemuddin.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wareflow.waseemuddin.me/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = wareflow.waseemuddin.me) {
        return 301 https://$host$request_uri;
    }
    server_name wareflow.waseemuddin.me;
    listen 80;
    return 404;
}
```

**Enable and reload:**

```bash
sudo ln -sf /etc/nginx/sites-available/wareflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Verify Deployment

```bash
# Backend health
curl -s https://wareflow.waseemuddin.me/health

# API (expected 401 without token)
curl -s https://wareflow.waseemuddin.me/api/auth/me
```

Open in browser: https://wareflow.waseemuddin.me

---

## 7. Future Deploys (Update)

```bash
cd /root/WareFlow
git pull

cd backend
npm install
npm run build
npx prisma migrate deploy
pm2 restart wareflow-backend

cd ../frontend
npm install
npm run build
```

---

## 8. Troubleshooting

| Issue | Check |
|-------|--------|
| 502 Bad Gateway | `pm2 status` — backend running? `curl localhost:3000/health` |
| Blank page | `VITE_API_URL=/api` in `.env.production`, rebuild frontend |
| 404 on API | Nginx `location /api/` present, backend on 3000 |
| DB errors | `DATABASE_URL` correct, Postgres running, migrations applied |
