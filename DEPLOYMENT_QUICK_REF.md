# 🚀 Production Deployment Quick Reference

## One-Command Deployment

```bash
# Copy this entire command to deploy:
cp .env.production .env.production.backup && \
./deploy.sh build && \
./deploy.sh start && \
./deploy.sh status
```

## Essential Commands

```bash
# Full deployment
./deploy.sh deploy

# View status
./deploy.sh status

# View logs
./deploy.sh logs              # All logs
./deploy.sh logs backend      # Backend only
./deploy.sh logs frontend     # Frontend only

# Manage services
./deploy.sh start             # Start all
./deploy.sh stop              # Stop all
./deploy.sh restart           # Restart all

# Database
./deploy.sh migrate           # Run migrations
./deploy.sh backup            # Backup database

# Maintenance
./deploy.sh clean             # Remove containers
./deploy.sh prune             # Remove unused images
```

## Configuration Checklist

```bash
# Before deploying, update .env.production:
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_urlsafe(32))">
DATABASE_URL=<your-managed-db-url>
REDIS_URL=<your-managed-redis-url>
ALLOWED_ORIGINS=https://yourdomain.com
ENVIRONMENT=production
DEBUG=false
```

## Cloud Platform URLs

| Platform | Setup Time | Cost | Link |
|----------|-----------|------|------|
| DigitalOcean Apps | 2 min | $5+/mo | https://www.digitalocean.com/products/app-platform |
| DigitalOcean Droplets | 5 min | $4+/mo | https://www.digitalocean.com/pricing/droplets |
| Railway | 3 min | Pay-as-you-go | https://railway.app |
| AWS EC2 | 10 min | Variable | https://aws.amazon.com/ec2 |

## Health Check URLs

After deployment, verify:

```bash
# Frontend
curl http://yourdomain.com/

# Backend API
curl http://yourdomain.com/api/v1/health

# WebSocket (requires wscat)
wscat -c wss://yourdomain.com/api/v1/ws/devices
```

## Environment Variables Summary

```env
# Security
SECRET_KEY=<secure-token>
ENVIRONMENT=production
DEBUG=false

# Database (use managed service)
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db

# Cache (use managed service)
REDIS_URL=redis://:pass@host:6379

# CORS
ALLOWED_ORIGINS=https://domain.com,https://www.domain.com

# Frontend
VITE_API_URL=https://yourdomain.com/api/v1
VITE_WS_URL=wss://yourdomain.com/api/v1/ws/devices
```

## Monitoring

```bash
# Real-time container stats
docker stats

# Service status
./deploy.sh status

# Recent logs
docker-compose -f docker-compose.prod.yml logs --tail=50

# Database connections
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d human_guard_ai -c "SELECT * FROM pg_stat_activity;"
```

## Troubleshooting

| Issue | Command |
|-------|---------|
| Backend not starting | `./deploy.sh logs backend` |
| API not responding | `curl http://localhost:8000/health` |
| Database error | `docker-compose -f docker-compose.prod.yml ps` |
| WebSocket failing | Check nginx logs: `./deploy.sh logs frontend` |
| Out of memory | `docker stats` → Scale up instance |

## Backup & Recovery

```bash
# Automatic backup
./deploy.sh backup

# List backups
ls -la backups/

# Restore (manual)
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres human_guard_ai < backups/backup_YYYYMMDD_HHMMSS.sql
```

## Security Hardening Checklist

- [ ] Use managed database (not localhost)
- [ ] Use managed Redis (not localhost)
- [ ] Enable HTTPS/SSL
- [ ] Update ALLOWED_ORIGINS
- [ ] Generate strong SECRET_KEY
- [ ] Set DEBUG=false
- [ ] Configure firewall rules
- [ ] Enable automated backups
- [ ] Set up monitoring alerts
- [ ] Use strong database password
- [ ] Use strong Redis password
- [ ] Enable container restart policies

## Performance Tuning

| Setting | Current | Tuning |
|---------|---------|--------|
| Gunicorn Workers | 4 | (CPU cores × 2) + 1 |
| Timeout | 120s | Increase if needed |
| Nginx Workers | auto | Monitor with `top` |
| Database Connections | 5 | Increase if bottleneck |
| Redis Connections | 5 | Increase if bottleneck |

## Files Reference

```
Core Deployment:
├── docker-compose.prod.yml    # Production stack
├── .env.production            # Configuration
├── deploy.sh                  # Automation script

Backend:
├── backend/Dockerfile         # Backend image
├── backend/app/main.py        # Security config
├── backend/.env.example       # Env template

Frontend:
├── FRONTEND/Dockerfile        # Frontend image
├── FRONTEND/nginx.conf        # Web server config
├── src/api/client.ts          # API client

Documentation:
├── PRODUCTION_README.md       # Full guide
├── PRODUCTION_CHECKLIST.md    # Verification
├── DEPLOYMENT_QUICK_REF.md    # This file
```

## Support Commands

```bash
# Export logs for support
docker-compose -f docker-compose.prod.yml logs > deployment-support.log

# System info
docker --version
docker-compose --version
uname -a

# Verify configuration
cat .env.production | grep -E "ENVIRONMENT|DEBUG|ALLOWED"

# Test backend
curl -v http://localhost:8000/
curl -v http://localhost:8000/health

# Test frontend
curl -v http://localhost/
curl -v http://localhost/api/v1/health
```

## Links & Resources

- 📖 Full Guide: [PRODUCTION_README.md](PRODUCTION_README.md)
- ✅ Checklist: [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
- 🐳 Docker: [https://docs.docker.com/](https://docs.docker.com/)
- 🚀 FastAPI: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
- ⚛️  React/Vite: [https://vitejs.dev/](https://vitejs.dev/)
- 🔒 Security: [https://cheatsheetseries.owasp.org/](https://cheatsheetseries.owasp.org/)

---

**Ready to go live?** 🚀

```bash
./deploy.sh deploy
```

Good luck! 🎉
