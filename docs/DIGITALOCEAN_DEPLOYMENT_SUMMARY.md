# 📝 Digital Ocean Deployment - Quick Reference

A quick reference guide for deploying and managing SnapList on Digital Ocean.

## 🚀 Deployment Files Created

Your repository now includes these Digital Ocean deployment files:

```
SnapList/
├── .do/
│   ├── app.yaml                    # Main deployment configuration
│   └── deploy.template.yaml        # Template with documentation
├── .github/
│   └── workflows/
│       └── deploy-digitalocean.yml # GitHub Actions CI/CD
├── .dockerignore                   # Docker optimization
├── .env.example                    # Environment variables template
├── deploy-digitalocean.sh          # Deployment helper script
└── docs/
    ├── DIGITAL_OCEAN_DEPLOYMENT.md # Complete deployment guide
    ├── QUICK_START_DIGITALOCEAN.md # 10-minute quick start
    └── DEPLOYMENT_COMPARISON.md    # Platform comparison
```

## ⚡ Quick Deploy (3 Methods)

### Method 1: Dashboard (Easiest) ✅
1. Visit https://cloud.digitalocean.com/apps
2. Click "Create App" → Connect GitHub
3. Select repository and branch
4. Add environment variables
5. Deploy!

**Time**: 10 minutes
**Best for**: First-time deployment

### Method 2: Helper Script
```bash
./deploy-digitalocean.sh
```

**Time**: 5 minutes (if doctl installed)
**Best for**: Command-line users

### Method 3: CLI (Advanced)
```bash
doctl apps create --spec .do/app.yaml
```

**Time**: 2 minutes
**Best for**: Automation and CI/CD

## 📋 Required Environment Variables

### Minimum Required
```bash
DATABASE_URL=postgresql://...        # Auto-injected by DO
JWT_SECRET=<generate>                # 32-byte random hex
SESSION_SECRET=<generate>            # 32-byte random hex
STRIPE_SECRET_KEY=sk_...            # From Stripe dashboard
STRIPE_PUBLISHABLE_KEY=pk_...       # From Stripe dashboard
VITE_STRIPE_PUBLIC_KEY=pk_...       # Same as above
NODE_ENV=production
PORT=5000
```

### Generate Secrets
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔧 Configuration Checklist

Before deploying, update these in `.do/app.yaml`:

- [ ] Change `YOUR_GITHUB_USERNAME/SnapList` to your actual repo
- [ ] Set correct region (nyc, sfo, ams, sgp, lon, fra, tor, blr)
- [ ] Review instance sizes (basic-xxs is fine for start)
- [ ] Commit and push changes to GitHub

## 📊 Cost Breakdown

### Starter Setup (~$20/month)
```
App Instance (Basic):        $5/month
PostgreSQL Database:        $15/month
Bandwidth (1TB):             Free
───────────────────────────────────
Total:                      $20/month

Minus $200 credit = 10 months FREE for new accounts!
```

### Production Setup (~$51/month)
```
App Instances (3x Pro):     $36/month
PostgreSQL (Production):    $15/month
───────────────────────────────────
Total:                      $51/month
```

## 🏗️ Build Configuration

The app uses these commands (configured in `.do/app.yaml`):

```bash
# Build
npm install && npm run build

# Run
npm start

# Port
5000
```

## 🔍 Health Check

The app includes a health check endpoint:

```bash
GET /api/health

# Response (200 OK)
{
  "status": "healthy",
  "timestamp": "2025-10-17T...",
  "uptime": 12345.67,
  "environment": "production"
}

# Response (503 Service Unavailable)
{
  "status": "unhealthy",
  "timestamp": "2025-10-17T...",
  "error": "Database connection failed"
}
```

## 📱 Post-Deployment Tasks

### 1. Verify Deployment
```bash
# Check health
curl https://your-app.ondigitalocean.app/api/health

# Expected: {"status":"healthy",...}
```

### 2. Configure OAuth Redirects
- **Google**: https://your-app.ondigitalocean.app/api/auth/google/callback
- **Facebook**: https://your-app.ondigitalocean.app/api/auth/facebook/callback

### 3. Set Up Stripe Webhook
- **URL**: https://your-app.ondigitalocean.app/api/stripe/webhook
- **Events**: 
  - checkout.session.completed
  - invoice.payment_succeeded
  - customer.subscription.updated
  - customer.subscription.deleted

### 4. Test Core Features
- [ ] User registration
- [ ] User login
- [ ] Create QR code
- [ ] Scan QR code
- [ ] View analytics
- [ ] Subscribe to plan
- [ ] Process payment

## 🔄 Continuous Deployment

### Automatic Deployment (Enabled by Default)
Every push to `main` triggers a new deployment automatically!

```bash
git add .
git commit -m "Update feature"
git push origin main
# 🚀 Automatically deploys to Digital Ocean!
```

### Manual Deployment Trigger
```bash
# Using doctl
doctl apps create-deployment YOUR_APP_ID

# Using GitHub Actions
# Go to Actions tab → Deploy to Digital Ocean → Run workflow
```

## 📊 Monitoring

### View Logs
```bash
# Runtime logs
doctl apps logs YOUR_APP_ID --type=run --follow

# Build logs
doctl apps logs YOUR_APP_ID --type=build
```

### Dashboard Metrics
- CPU usage
- Memory usage
- Network bandwidth
- Request rate
- Response times

### Set Up Alerts
1. App → Settings → Alerts
2. Enable notifications for:
   - Deployment failures
   - High CPU/Memory
   - App crashes

## 🔄 Update Deployment

### Update Environment Variables
1. App Dashboard → Settings → Environment Variables
2. Edit variables
3. Click "Save" → App auto-redeploys

### Update App Configuration
```bash
# Edit .do/app.yaml
# Then:
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

### Scale Your App
```bash
# Horizontal scaling (more instances)
# Edit .do/app.yaml: instance_count: 3

# Vertical scaling (larger instances)
# Edit .do/app.yaml: instance_size_slug: professional-xs

# Apply changes
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

## 🐛 Troubleshooting

### Build Failed
```bash
# Check logs
doctl apps logs YOUR_APP_ID --type=build

# Common fixes:
# - Verify package.json has all dependencies
# - Check Node version (needs 20+)
# - Ensure build command is correct
```

### App Not Starting
```bash
# Check runtime logs
doctl apps logs YOUR_APP_ID --type=run --follow

# Common fixes:
# - Verify all environment variables are set
# - Check DATABASE_URL is connected
# - Ensure PORT is 5000
```

### Database Connection Issues
```bash
# Verify database is created
doctl databases list

# Check connection string
doctl databases connection YOUR_DB_ID

# Common fixes:
# - Ensure database is in same region
# - Check SSL mode is enabled
# - Verify connection pool settings
```

### 503 Service Unavailable
- Check health endpoint: `/api/health`
- Review runtime logs
- Verify database connectivity
- Check memory usage (may need upgrade)

## 📚 Documentation Links

- **Quick Start**: [QUICK_START_DIGITALOCEAN.md](./QUICK_START_DIGITALOCEAN.md)
- **Full Guide**: [DIGITAL_OCEAN_DEPLOYMENT.md](./DIGITAL_OCEAN_DEPLOYMENT.md)
- **Platform Comparison**: [DEPLOYMENT_COMPARISON.md](./DEPLOYMENT_COMPARISON.md)
- **OAuth Setup**: [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md)

## 🆘 Common Commands

```bash
# Install doctl
brew install doctl  # macOS
# or download from: https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init

# List apps
doctl apps list

# Get app info
doctl apps get YOUR_APP_ID

# View logs
doctl apps logs YOUR_APP_ID --follow

# Restart app
doctl apps update YOUR_APP_ID

# Delete app
doctl apps delete YOUR_APP_ID

# List databases
doctl databases list

# Database backup
doctl databases backup list YOUR_DB_ID
```

## 🎯 Next Steps After Deployment

1. **Custom Domain**
   - Add your domain in Settings
   - Update DNS records
   - SSL auto-configured

2. **Performance Optimization**
   - Enable CDN
   - Add Redis for caching
   - Optimize database queries

3. **Security**
   - Review environment variables
   - Set up monitoring alerts
   - Configure backup schedule

4. **Scaling**
   - Monitor metrics
   - Scale when CPU > 70%
   - Add read replicas for database

5. **Monitoring**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure error tracking (Sentry)
   - Add analytics (Google Analytics, Plausible)

## ✅ Deployment Status Checklist

Use this checklist to verify your deployment:

- [ ] App is accessible via URL
- [ ] Health check returns "healthy"
- [ ] User registration works
- [ ] User login works
- [ ] QR code creation works
- [ ] QR code scanning works
- [ ] Analytics display correctly
- [ ] Stripe checkout works
- [ ] Webhooks are configured
- [ ] OAuth providers work (if configured)
- [ ] Custom domain configured (if desired)
- [ ] SSL certificate active
- [ ] Monitoring alerts configured
- [ ] Backup schedule set

## 🎉 Success!

Your SnapList app is now live on Digital Ocean!

**App URL**: https://snaplist-xxxxx.ondigitalocean.app
**Dashboard**: https://cloud.digitalocean.com/apps

### Share Your Success
- Tweet about your deployment
- Star the repository
- Share with the community

### Need Help?
- Check the docs folder
- Open a GitHub issue
- Join our Discord community

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Tested On**: Digital Ocean App Platform

