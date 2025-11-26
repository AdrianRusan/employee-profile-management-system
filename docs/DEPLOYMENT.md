# Deployment Guide

This guide covers deploying the Employee Profile Management System to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Vercel Deployment](#vercel-deployment)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Backup & Recovery](#backup--recovery)
9. [Security Checklist](#security-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 20+ (for local builds)
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 14+ database
- (Optional) Redis for rate limiting
- (Optional) Upstash account for serverless Redis

---

## Environment Configuration

### Required Variables

```bash
# Database (required)
DATABASE_URL="postgresql://user:password@host:5432/epms?schema=public"

# Session Security (required - generate with: openssl rand -hex 32)
SESSION_SECRET="your-64-character-hex-string"

# Encryption Key (required - generate with: openssl rand -hex 32)
ENCRYPTION_KEY="your-64-character-hex-string"

# Application URL
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Optional Variables

```bash
# Rate Limiting (recommended for production)
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Error Tracking
SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_AUTH_TOKEN="your-auth-token"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"

# AI Features
HUGGINGFACE_API_KEY="hf_xxx"

# Metrics (protect with token in production)
METRICS_TOKEN="your-secret-metrics-token"

# Logging
LOG_LEVEL="info"  # trace, debug, info, warn, error, fatal
```

### Generating Secrets

```bash
# Generate SESSION_SECRET
openssl rand -hex 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32

# Generate METRICS_TOKEN
openssl rand -base64 32
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE epms;"
psql -U postgres -c "CREATE USER epms_user WITH PASSWORD 'your-password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE epms TO epms_user;"
```

### 2. Run Migrations

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://epms_user:your-password@localhost:5432/epms"

# Run migrations
npx prisma migrate deploy

# (Optional) Seed demo data
npx prisma db seed
```

### 3. Verify Connection

```bash
npx prisma db pull
```

---

## Docker Deployment

### Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd employee-profile-management-system

# 2. Create .env file
cp .env.example .env
# Edit .env with your values

# 3. Start services
docker-compose up -d

# 4. Run migrations
docker-compose exec app npx prisma migrate deploy

# 5. (Optional) Seed data
docker-compose exec app npx prisma db seed
```

### Production Configuration

Create `docker-compose.prod.yml`:

```yaml
services:
  app:
    restart: always
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1'
        reservations:
          memory: 512M
          cpus: '0.5'
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  db:
    restart: always
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 2G
```

Run with:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Health Checks

The Docker image includes health checks:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' epms-app

# View health check logs
docker inspect --format='{{json .State.Health}}' epms-app | jq
```

---

## Kubernetes Deployment

### 1. Create Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: epms
```

### 2. Create Secrets

```bash
kubectl create secret generic epms-secrets \
  --namespace=epms \
  --from-literal=DATABASE_URL='postgresql://...' \
  --from-literal=SESSION_SECRET='...' \
  --from-literal=ENCRYPTION_KEY='...'
```

### 3. Deployment Manifest

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: epms
  namespace: epms
spec:
  replicas: 3
  selector:
    matchLabels:
      app: epms
  template:
    metadata:
      labels:
        app: epms
    spec:
      containers:
      - name: epms
        image: your-registry/epms:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: epms-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

### 4. Service & Ingress

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: epms
  namespace: epms
spec:
  selector:
    app: epms
  ports:
  - port: 80
    targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: epms
  namespace: epms
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: epms-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: epms
            port:
              number: 80
```

### 5. Apply Manifests

```bash
kubectl apply -f k8s/
```

---

## Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Configure environment variables

### 2. Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your PostgreSQL URL |
| `SESSION_SECRET` | Generated secret |
| `ENCRYPTION_KEY` | Generated key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL |

### 3. Build Settings

- Framework: Next.js (auto-detected)
- Build Command: `npx prisma generate && npm run build`
- Output Directory: `.next`

### 4. Database with Vercel Postgres

```bash
# Link Vercel Postgres
vercel link
vercel env pull .env.local

# The DATABASE_URL is automatically set
```

---

## Monitoring & Alerting

### Prometheus Setup

1. Add scrape config:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'epms'
    static_configs:
      - targets: ['epms-app:3000']
    metrics_path: '/api/metrics'
    bearer_token: 'your-metrics-token'
```

2. Key metrics to monitor:

| Metric | Alert Threshold |
|--------|-----------------|
| `http_request_duration_seconds` | p99 > 2s |
| `trpc_errors_total` | rate > 10/min |
| `rate_limit_exceeded_total` | rate > 100/min |
| `db_query_duration_seconds` | p99 > 1s |

### Grafana Dashboard

Import the provided dashboard from `/docs/grafana-dashboard.json`.

### Alerting Rules

```yaml
# alerting-rules.yml
groups:
- name: epms
  rules:
  - alert: HighErrorRate
    expr: rate(trpc_errors_total[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"

  - alert: DatabaseSlow
    expr: histogram_quantile(0.99, rate(db_query_duration_seconds_bucket[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Database queries are slow"
```

---

## Backup & Recovery

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump $DATABASE_URL | gzip > backups/epms_$DATE.sql.gz

# Retention: Keep 30 days
find backups -name "epms_*.sql.gz" -mtime +30 -delete
```

### Restore Procedure

```bash
# 1. Stop application
docker-compose stop app

# 2. Restore database
gunzip -c backups/epms_20240115.sql.gz | psql $DATABASE_URL

# 3. Start application
docker-compose start app
```

### Disaster Recovery

1. Database is replicated to standby
2. Application is stateless - just redeploy
3. Secrets stored in AWS Secrets Manager / HashiCorp Vault
4. Regular backup verification tests

---

## Security Checklist

### Before Going Live

- [ ] All secrets rotated from development values
- [ ] `SESSION_SECRET` is unique and secure (64 chars)
- [ ] `ENCRYPTION_KEY` is unique and secure (64 chars)
- [ ] `NODE_ENV=production` is set
- [ ] HTTPS is enforced
- [ ] Security headers are configured (automatic)
- [ ] Rate limiting is enabled (Upstash recommended)
- [ ] Sentry error tracking is configured
- [ ] Database backups are scheduled
- [ ] Monitoring and alerting is set up
- [ ] Access logs are being collected
- [ ] Audit logging is enabled

### Security Headers (Automatic)

The application automatically sets:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. DATABASE_URL not set or invalid
# 2. Prisma migrations not run
# 3. Port 3000 already in use
```

### Database Connection Issues

```bash
# Test connection
docker-compose exec app npx prisma db pull

# Check PostgreSQL is running
docker-compose ps db
```

### Health Check Failing

```bash
# Check health endpoint directly
curl http://localhost:3000/api/health

# Check database connectivity
curl http://localhost:3000/api/health/ready
```

### High Memory Usage

```bash
# Check container stats
docker stats epms-app

# Consider:
# 1. Reducing QUERY_GC_TIME
# 2. Adding memory limits
# 3. Scaling horizontally
```

### Rate Limiting Issues

```bash
# Check if Upstash is configured
curl -I http://localhost:3000/api/trpc/user.getAll

# Look for X-RateLimit-* headers
# If missing, check UPSTASH_* environment variables
```

---

## Support

For issues:
1. Check [Troubleshooting](#troubleshooting)
2. Search existing [GitHub Issues](https://github.com/your-repo/issues)
3. Open a new issue with logs and environment details
