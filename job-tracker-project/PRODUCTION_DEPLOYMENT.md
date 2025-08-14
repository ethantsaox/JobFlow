# JobFlow Production Deployment Guide

This comprehensive guide covers the complete production deployment of JobFlow with enterprise-grade security, monitoring, and CI/CD integration.

## 🎯 Overview

JobFlow is now production-ready with:
- ✅ Multi-stage Docker builds with security hardening
- ✅ Comprehensive security configuration with CSRF protection
- ✅ Structured logging and monitoring infrastructure  
- ✅ Automated CI/CD pipeline with security scanning
- ✅ Database migration management
- ✅ Dependency vulnerability auditing

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- SSL certificates
- Domain with DNS configured

### 1. Clone and Configure
```bash
git clone <your-repo-url>
cd job-tracker-project

# Copy environment templates
cp backend/.env.production.template backend/.env.production
cp frontend/.env.production.template frontend/.env.production
```

### 2. Configure Environment Variables
Edit `backend/.env.production`:
```bash
# Environment
ENVIRONMENT=production

# Database (CRITICAL: Replace with production credentials)
DATABASE_URL=postgresql://your_prod_user:your_secure_password@your_db_host:5432/your_db_name
POSTGRES_USER=your_prod_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=your_db_name

# Redis
REDIS_URL=redis://your_redis_host:6379/0

# Security (CRITICAL: Generate secure keys)
JWT_SECRET_KEY=your-super-secure-jwt-key-at-least-32-characters-long
EXTENSION_SECRET=your-super-secure-extension-key-at-least-32-characters-long

# URLs
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Security
DEBUG=false
ENABLE_CSRF_PROTECTION=true
ENABLE_CORS=true

# Email (Required for password reset)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Generate Secure Keys
```bash
# JWT Secret Key
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"

# Extension Secret
python -c "import secrets; print('EXTENSION_SECRET=' + secrets.token_urlsafe(32))"
```

### 4. Deploy with Docker
```bash
# Production deployment
docker-compose -f docker-compose.production.yml up -d

# Check health
curl https://your-domain.com/health
```

## 🔧 Detailed Configuration

### Database Setup

#### Production Migration
```bash
# Run the production migration script
cd backend
python scripts/run_production_migrations.py
```

The migration script will:
- ✅ Validate production environment
- ✅ Create database backup
- ✅ Run all pending migrations
- ✅ Verify migration success

#### Manual Migration (Alternative)
```bash
# Set environment variables
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export ENVIRONMENT=production

# Run migrations
cd backend
alembic upgrade head
```

### Security Configuration

#### CSRF Protection
Now enabled in production with token validation:
```bash
# In .env.production
ENABLE_CSRF_PROTECTION=true
```

#### CORS Security
Restrictive CORS policy for production:
```bash
# Only allow your domain
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

#### SSL/TLS Setup
```bash
# SSL certificates path
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/key.pem
```

### Docker Production Deployment

#### Backend Container
Multi-stage build with security features:
- Non-root user execution
- Health checks
- Gunicorn with multiple workers
- Secure dependencies installation

#### Frontend Container  
Optimized Nginx deployment:
- Production build optimization
- Security headers
- Gzip compression
- Static asset caching

#### Production Docker Compose
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Include backup service
docker-compose -f docker-compose.production.yml --profile backup up -d

# Include nginx proxy
docker-compose -f docker-compose.production.yml --profile with-proxy up -d
```

## 📊 Monitoring & Logging

### Health Checks
```bash
# Comprehensive health check
curl https://your-domain.com/health

# Application metrics
curl https://your-domain.com/metrics
```

### Logging Configuration
- ✅ Structured JSON logging in production
- ✅ Security-filtered logs (no sensitive data)
- ✅ Log rotation and retention
- ✅ Multiple log levels and destinations

### Monitoring Features
- Real-time health monitoring
- Performance metrics collection
- Request/response tracking
- Error rate monitoring
- Database performance metrics

## 🔍 Security Features

### Implemented Security Measures
1. **Authentication & Authorization**
   - JWT tokens with secure secret keys
   - Token expiration and refresh
   - Password security validation

2. **Network Security**
   - CORS restrictions
   - CSRF protection
   - Rate limiting
   - Security headers

3. **Data Protection**
   - SQL injection prevention
   - XSS protection
   - Input validation
   - Sensitive data filtering in logs

4. **Infrastructure Security**
   - Non-root container execution
   - Dependency vulnerability scanning
   - Security linting and auditing
   - SSL/TLS encryption

### Security Validation
```bash
# Run security audit
python scripts/audit_dependencies.py

# Check for vulnerabilities
cd backend && pip-audit
cd frontend && npm audit
```

## 🚥 CI/CD Pipeline

### GitHub Actions Workflow
Automated pipeline includes:
- ✅ Security scanning (Trivy, dependency audit)
- ✅ Code quality checks (linting, type checking)
- ✅ Automated testing (unit, integration)
- ✅ Docker image building and scanning
- ✅ Automated deployment to staging/production

### Setup CI/CD
1. Configure GitHub secrets:
   ```
   PRODUCTION_HOST=your-server-ip
   PRODUCTION_USER=deploy-user
   PRODUCTION_SSH_KEY=your-ssh-private-key
   SLACK_WEBHOOK=your-slack-webhook
   ```

2. Enable GitHub Actions in repository settings

3. Push to `main` branch triggers production deployment

### Pre-commit Hooks
```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run all hooks
pre-commit run --all-files
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Domain DNS configured
- [ ] SSL certificates obtained
- [ ] Database server prepared
- [ ] Redis server configured
- [ ] Environment variables set
- [ ] Backup strategy implemented

### Security Validation
- [ ] JWT secrets generated (32+ characters)
- [ ] Database credentials secure
- [ ] CORS origins restricted to your domain
- [ ] CSRF protection enabled
- [ ] Debug mode disabled
- [ ] Security audit passed

### Infrastructure
- [ ] Docker images built and scanned
- [ ] Health checks responding
- [ ] Monitoring configured
- [ ] Log aggregation setup
- [ ] Backup verification
- [ ] Disaster recovery plan

### Post-Deployment
- [ ] Functionality testing complete
- [ ] Performance benchmarks met
- [ ] Security scanning passed
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team training completed

## 🛠️ Maintenance & Operations

### Regular Maintenance Tasks
```bash
# Update dependencies (weekly)
python scripts/audit_dependencies.py

# Database backup (daily via cron)
docker-compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql

# Log rotation (automatic)
# Logs automatically rotate at 100MB with 5 backups

# Security scanning (weekly)
docker run --rm -v $(pwd):/app aquasec/trivy fs /app
```

### Scaling Considerations
```bash
# Scale backend workers
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# Add load balancer
# Configure nginx-proxy service in docker-compose.production.yml
```

### Troubleshooting
```bash
# Check application logs
docker-compose logs backend
docker-compose logs frontend

# Database connection test
docker-compose exec backend python -c "
from app.core.database import engine
with engine.connect() as conn:
    print('Database connected successfully')
"

# Redis connection test  
docker-compose exec redis redis-cli ping
```

## 🔗 Additional Resources

### Documentation Files
- `SECURITY.md` - Detailed security documentation
- `.github/workflows/ci-cd.yml` - Complete CI/CD pipeline
- `scripts/audit_dependencies.py` - Dependency security scanner
- `nginx-proxy.conf` - Production nginx configuration

### Monitoring Endpoints
- `/health` - Comprehensive health check
- `/metrics` - Application performance metrics  
- `/` - API status and version

### Support & Maintenance
- Monitor GitHub Actions for deployment status
- Check Slack notifications for alerts
- Review security audit reports weekly
- Update dependencies monthly

---

## 🎉 Congratulations!

Your JobFlow application is now deployed with enterprise-grade security and monitoring. The comprehensive setup includes:

- 🔒 **Security**: CSRF protection, secure CORS, vulnerability scanning
- 📊 **Monitoring**: Health checks, metrics, structured logging
- 🚀 **Performance**: Multi-stage Docker builds, caching, optimization
- 🔄 **Automation**: CI/CD pipeline, dependency management, security scanning
- 📋 **Operations**: Backup strategy, maintenance scripts, troubleshooting guides

Your production deployment is secure, scalable, and maintainable! 🚀