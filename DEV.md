# Development Guide

## Prerequisites

- **Node.js** 20.x
- **Docker** (Colima or Docker Desktop)
- **mkcert** - for local SSL certificates
- **dnsmasq** - for local `.dev` domain resolution

## Quick Start

### Local Development (without Docker)

```bash
# Install all dependencies
npm run install:all

# Start both services
npm run dev

# Or separately
npm run dev:backend   # Port 3001
npm run dev:frontend  # Port 3000
```

### Docker Development (Recommended)

Full stack with SSL, PostgreSQL, and domain-based routing.

## Docker Setup

### 1. DNS Configuration

dnsmasq resolves `*.kotobgy.dev` to `127.0.0.1`:

```bash
# Install dnsmasq (if not installed)
brew install dnsmasq

# Add kotobgy.dev resolution
echo 'address=/kotobgy.dev/127.0.0.1' | sudo tee /usr/local/etc/dnsmasq.d/kotobgy.conf

# Create resolver directory
sudo mkdir -p /etc/resolver
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/dev

# Restart dnsmasq
sudo brew services restart dnsmasq

# Flush DNS cache
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

### 2. SSL Certificates

mkcert generates trusted local SSL certificates:

```bash
# Install mkcert (if not installed)
brew install mkcert
mkcert -install

# Generate certificates for kotobgy.dev
mkcert kotobgy.dev api.kotobgy.dev "*.kotobgy.dev"
```

This creates:
- `kotobgy.dev+2.pem` - Certificate
- `kotobgy.dev+2-key.pem` - Private key

### 3. Environment Variables

Copy and configure environment:

```bash
cp .env.docker .env
```

Edit `.env` with your values:

```env
NODE_ENV=production
API_PREFIX=api/v1

DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password_here
DATABASE_NAME=kotobgy

JWT_SECRET=your-super-secret-key-min-32-chars-change-this
JWT_EXPIRATION=7d

DEFAULT_LANGUAGE=ar
```

### 4. Start Docker

```bash
# Start Colima (if using Colima)
colima start

# Build and start all services
docker compose up --build -d
```

### 5. Verify Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | https://kotobgy.dev | React SPA |
| Backend API | https://api.kotobgy.dev | NestJS API |
| API Docs | https://api.kotobgy.dev/api/docs | Swagger UI |
| PostgreSQL | localhost:5432 | Database |

## Docker Architecture

```
Client Request → https://kotobgy.dev:443
                        │
                        ▼
              ┌─────────────────┐
              │  nginx-proxy    │ ← mkcert SSL termination
              │  (SSL :443)     │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
   kotobgy.dev   api.kotobgy.dev   (wildcard)
         │             │
         ▼             ▼
   ┌──────────┐  ┌──────────┐
   │ frontend │  │ backend  │
   │  :80     │  │  :3001   │
   └──────────┘  └────┬─────┘
                      │
                      ▼
               ┌──────────┐
               │ postgres │ ← named volume: kotobgy-db
               │  :5432   │
               └──────────┘
```

### Services

| Service | Image | Description |
|---------|-------|-------------|
| `postgres` | postgres:16-alpine | PostgreSQL database with named volume |
| `backend` | node:20-alpine | NestJS API (multi-stage build) |
| `frontend` | node:20-alpine + nginx:alpine | React SPA served by nginx |
| `proxy` | nginx:alpine | SSL termination and reverse proxy |

### Volumes

- `kotobgy-db` - PostgreSQL data (persistent)

### Networks

- `kotobgy-network` - Bridge network for inter-service communication

## Common Commands

### Docker Compose

```bash
# Start all services
docker compose up -d

# Build and start
docker compose up --build -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Restart a service
docker compose restart backend
```

### Database

```bash
# Connect to PostgreSQL
docker exec -it kotobgy-postgres psql -U postgres -d kotobgy

# Run migrations (inside backend container)
docker exec -it kotobgy-backend node dist/main.js migration:run

# Or run locally against Docker DB
DATABASE_HOST=localhost npm run migration:run
```

### Debugging

```bash
# Check container status
docker ps

# Check container health
docker inspect kotobgy-postgres | grep -A 10 Health

# Execute command in container
docker exec -it kotobgy-backend sh

# View nginx config
docker exec kotobgy-proxy cat /etc/nginx/conf.d/default.conf
```

## Port Conflicts

### Valet Conflict

If Laravel Valet is running on port 443:

```bash
# Stop Valet
valet stop

# Restart Kotobgy Docker
docker compose restart proxy
```

### Port 3001 in Use

```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>
```

## File Structure

```
book-fair/
├── docker-compose.yml        # Main orchestration
├── .env.docker               # Environment template
├── kotobgy.dev+2.pem         # SSL certificate
├── kotobgy.dev+2-key.pem     # SSL private key
├── proxy/
│   └── nginx.conf            # Reverse proxy config
├── backend/
│   ├── Dockerfile            # Multi-stage Node build
│   └── .dockerignore         # Build exclusions
└── frontend/
    ├── Dockerfile            # Multi-stage build with nginx
    ├── nginx.conf            # SPA routing + API proxy
    └── .dockerignore         # Build exclusions
```

## Production Considerations

This Docker setup is for **development only**. For production:

1. Use environment variables from secrets manager
2. Use proper SSL certificates (Let's Encrypt)
3. Add health checks and restart policies
4. Configure proper CORS origins
5. Use managed PostgreSQL service
6. Add monitoring and logging
7. Configure rate limiting at infrastructure level
8. Use CDN for static assets

## Troubleshooting

### DNS Not Resolving

```bash
# Verify dnsmasq is running
pgrep dnsmasq

# Test resolution
nslookup kotobgy.dev 127.0.0.1

# Restart dnsmasq
sudo brew services restart dnsmasq
```

### SSL Certificate Errors

```bash
# Reinstall mkcert CA
mkcert -install

# Regenerate certificates
mkcert kotobgy.dev api.kotobgy.dev "*.kotobgy.dev"

# Restart proxy
docker compose restart proxy
```

### Database Connection Issues

```bash
# Check PostgreSQL is healthy
docker ps | grep postgres

# Check logs
docker logs kotobgy-postgres

# Verify network connectivity
docker exec kotobgy-backend ping postgres
```

### Frontend Not Loading

```bash
# Check frontend build
docker logs kotobgy-frontend

# Check proxy routing
docker logs kotobgy-proxy

# Verify nginx config
docker exec kotobgy-proxy nginx -t
```
