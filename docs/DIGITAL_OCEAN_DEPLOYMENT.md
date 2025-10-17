# 🌊 Digital Ocean Deployment Guide for SnapList

Complete guide to deploy your SnapList QR code management app on Digital Ocean's App Platform.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Cost Estimation](#cost-estimation)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ A [Digital Ocean account](https://cloud.digitalocean.com/registrations/new)
- ✅ Your code pushed to a GitHub repository
- ✅ Stripe account with API keys
- ✅ (Optional) Google OAuth credentials
- ✅ (Optional) Facebook OAuth credentials
- ✅ (Optional) Google Maps API key

---

## Quick Start

### Option 1: Deploy via Digital Ocean Dashboard (Recommended)

1. **Login to Digital Ocean**
   - Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"

2. **Connect GitHub Repository**
   - Choose "GitHub" as the source
   - Authorize Digital Ocean to access your repositories
   - Select your SnapList repository
   - Choose the `main` branch

3. **Configure Resources**
   - Digital Ocean will auto-detect your app type
   - Click "Edit Plan" if you want to change instance size
   - Recommended: Basic plan ($5/month for the app)

4. **Add Database**
   - Click "Add Resource" → "Database"
   - Select PostgreSQL version 16
   - Choose a plan (Basic $15/month recommended for production)
   - Database will automatically connect to your app

5. **Set Environment Variables**
   - Click on the app service → "Environment Variables"
   - Add all required variables (see [Environment Variables](#environment-variables) section)

6. **Configure Build Settings**
   - Build Command: `npm install && npm run build`
   - Run Command: `npm start`
   - HTTP Port: `5000`

7. **Deploy**
   - Click "Next" then "Create Resources"
   - Wait 5-10 minutes for initial deployment

### Option 2: Deploy via CLI (Advanced)

```bash
# Install doctl CLI
# macOS
brew install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/latest/download/doctl-*-linux-amd64.tar.gz
tar xf doctl-*-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec .do/app.yaml

# Or update existing app
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

### Option 3: Deploy with GitHub Action (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Digital Ocean

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
      
      - name: Deploy to Digital Ocean
        run: |
          doctl apps create-deployment ${{ secrets.DIGITALOCEAN_APP_ID }}
```

---

## Detailed Setup

### Step 1: Prepare Your Repository

1. **Update `.do/app.yaml`**
   ```bash
   cp .do/deploy.template.yaml .do/app.yaml
   ```

2. **Edit `.do/app.yaml`**
   - Change `YOUR_GITHUB_USERNAME/SnapList` to your actual repo
   - Update region if needed (nyc, sfo, ams, sgp, lon, fra, tor, blr)
   - Adjust instance sizes based on your needs

3. **Commit and push changes**
   ```bash
   git add .do/app.yaml
   git commit -m "Add Digital Ocean deployment configuration"
   git push origin main
   ```

### Step 2: Create App on Digital Ocean

1. **Navigate to App Platform**
   - Go to https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect Repository**
   - Choose "GitHub"
   - Select your repository
   - Choose `main` branch
   - Enable "Autodeploy" to deploy on every push

3. **Review Resources**
   - Digital Ocean will detect Node.js app
   - Click "Edit" to customize build commands if needed

### Step 3: Configure Database

Digital Ocean will create a managed PostgreSQL database:

1. **Database Configuration**
   - Name: `snaplist-db`
   - Engine: PostgreSQL 16
   - Cluster: 1 node (can scale later)
   - Region: Same as your app

2. **Connection**
   - Digital Ocean automatically injects `DATABASE_URL` into your app
   - No manual configuration needed!

### Step 4: Set Environment Variables

Add these in Digital Ocean dashboard under "Environment Variables":

#### Required Variables

```bash
# Security (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-generated-secret-here
SESSION_SECRET=your-generated-secret-here

# Stripe (Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_...
VITE_STRIPE_PUBLIC_KEY=pk_live_or_test_...
STRIPE_STANDARD_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Node
NODE_ENV=production
PORT=5000
```

#### Optional Variables (for OAuth)

```bash
# Google OAuth (Get from https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Facebook OAuth (Get from https://developers.facebook.com/)
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret

# Google Maps (Get from https://console.cloud.google.com/google/maps-apis/)
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### Step 5: Deploy

1. **Initial Deployment**
   - Click "Create Resources"
   - Wait 5-10 minutes for build and deployment
   - Monitor logs in the "Runtime Logs" section

2. **Check Deployment**
   - Once deployed, you'll get a URL like: `https://snaplist-xxxxx.ondigitalocean.app`
   - Click on it to verify your app is running

---

## Environment Variables

### How to Set Environment Variables

**In Digital Ocean Dashboard:**
1. Go to your app
2. Click "Settings" tab
3. Scroll to "App-Level Environment Variables"
4. Click "Edit"
5. Add variables as `KEY=value` pairs
6. Mark sensitive ones as "Secret"
7. Save and redeploy

**Variable Scopes:**
- **RUN_TIME**: Available during app execution
- **BUILD_TIME**: Available during build process
- **RUN_AND_BUILD_TIME**: Available in both

### Generate Secure Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database URL Format

Digital Ocean auto-injects this, but if needed manually:

```
postgresql://username:password@host:port/database?sslmode=require
```

---

## Database Setup

### Automatic Migration

The app automatically runs migrations on startup. No manual intervention needed!

### Manual Migration (if needed)

```bash
# Connect to your app's console
doctl apps list
doctl apps logs YOUR_APP_ID

# Or use Digital Ocean console
# Click "Console" tab in your app dashboard

# Run migration
npm run db:push
```

### Database Access

**Connection String:**
- Available in app environment as `DATABASE_URL`
- View in Dashboard: App → Settings → DATABASE_URL

**Database Console:**
1. Go to your app dashboard
2. Click "Database" tab
3. Click "Connection Details"
4. Use these to connect with tools like pgAdmin, DBeaver, or psql

**Command Line:**
```bash
# Get connection string
doctl databases connection YOUR_DB_ID

# Connect directly
psql "postgresql://user:pass@host:port/db?sslmode=require"
```

---

## Post-Deployment

### 1. Custom Domain Setup

1. **Add Domain in Digital Ocean**
   - Go to App → Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `snaplist.com`)

2. **Update DNS Records**
   - Add CNAME record in your DNS provider:
     ```
     Type: CNAME
     Name: @ (or subdomain)
     Value: [provided by Digital Ocean]
     TTL: 3600
     ```

3. **Enable SSL**
   - Digital Ocean automatically provisions SSL certificates
   - Wait 5-10 minutes for DNS propagation

### 2. Configure OAuth Redirect URIs

Update redirect URIs in your OAuth provider:

**Google OAuth:**
- Go to https://console.cloud.google.com/
- APIs & Services → Credentials
- Edit your OAuth 2.0 Client
- Add Authorized redirect URI:
  ```
  https://your-app-domain.com/api/auth/google/callback
  https://snaplist-xxxxx.ondigitalocean.app/api/auth/google/callback
  ```

**Facebook OAuth:**
- Go to https://developers.facebook.com/
- Your App → Settings → Basic
- Add your app domain
- Settings → Advanced → OAuth Redirect URIs:
  ```
  https://your-app-domain.com/api/auth/facebook/callback
  ```

### 3. Configure Stripe Webhook

1. **Go to Stripe Dashboard**
   - https://dashboard.stripe.com/webhooks

2. **Add Endpoint**
   - URL: `https://your-app-domain.com/api/stripe/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

3. **Copy Webhook Secret**
   - Copy the `whsec_...` secret
   - Add to Digital Ocean as `STRIPE_WEBHOOK_SECRET`

### 4. Set Up Monitoring

**Enable Alerts:**
1. Go to App → Settings → Alerts
2. Enable alerts for:
   - Deployment failures
   - High CPU usage
   - High memory usage
   - App crashes

**View Metrics:**
- Dashboard shows CPU, Memory, Bandwidth usage
- Click "Metrics" tab for detailed graphs

### 5. Enable Auto-Deploy

- Already enabled if you checked "Autodeploy" during setup
- Every push to `main` branch triggers a new deployment
- View deployment history in "Activity" tab

---

## Troubleshooting

### Build Failures

**Check Build Logs:**
1. Go to App dashboard
2. Click "Activity" tab
3. Click on failed deployment
4. View build logs

**Common Issues:**

1. **Missing Dependencies**
   ```
   Error: Cannot find module 'xyz'
   ```
   **Fix:** Ensure `package.json` includes all dependencies

2. **Build Command Fails**
   ```
   npm ERR! Missing script: "build"
   ```
   **Fix:** Verify build commands in `.do/app.yaml`

3. **Out of Memory**
   ```
   JavaScript heap out of memory
   ```
   **Fix:** Increase instance size or add build optimization

### Runtime Errors

**Check Runtime Logs:**
```bash
# Via CLI
doctl apps logs YOUR_APP_ID --type=run

# Or in Dashboard → Runtime Logs tab
```

**Common Issues:**

1. **Database Connection Failed**
   ```
   Error: Connection refused
   ```
   **Fix:** Ensure database is created and `DATABASE_URL` is set

2. **Environment Variables Missing**
   ```
   Error: STRIPE_SECRET_KEY must be set
   ```
   **Fix:** Add missing variables in Settings → Environment Variables

3. **Port Binding Error**
   ```
   Error: EADDRINUSE: port already in use
   ```
   **Fix:** Ensure app listens on `process.env.PORT || 5000`

### Performance Issues

1. **Slow Response Times**
   - Check instance size (upgrade if needed)
   - Review database performance metrics
   - Add caching layer if needed

2. **High Memory Usage**
   - Review logs for memory leaks
   - Consider upgrading instance size
   - Optimize database queries

### Database Issues

1. **Connection Pool Exhausted**
   ```
   Error: Connection pool exhausted
   ```
   **Fix:** 
   - Increase database connection limit
   - Review connection handling in code
   - Consider connection pooling optimizations

2. **Slow Queries**
   - Review database metrics
   - Add indexes where needed
   - Optimize N+1 queries

### Debug Mode

Enable detailed logging:

```bash
# Add to Environment Variables
DEBUG=*
LOG_LEVEL=debug
```

---

## Cost Estimation

### Basic Setup (Suitable for Testing/Small Production)

| Resource | Plan | Cost |
|----------|------|------|
| App (Basic) | 1 vCPU, 512 MB RAM | $5/month |
| Database (Dev) | 1 GB RAM, 10 GB disk | $15/month |
| Bandwidth | 1 TB included | Free |
| **Total** | | **~$20/month** |

### Production Setup (Recommended)

| Resource | Plan | Cost |
|----------|------|------|
| App (Professional) | 1 vCPU, 2 GB RAM | $12/month |
| Database (Basic) | 1 GB RAM, 25 GB disk | $15/month |
| Additional App Instances | 2x Professional | $24/month |
| Bandwidth | 1 TB included | Free |
| **Total** | | **~$51/month** |

### Enterprise Setup

| Resource | Plan | Cost |
|----------|------|------|
| App (Professional) | 2 vCPU, 4 GB RAM | $24/month |
| Database (Production) | 2 GB RAM, 50 GB disk | $60/month |
| Additional App Instances | 3x Professional | $72/month |
| Load Balancer | Included | Free |
| **Total** | | **~$156/month** |

### Cost Optimization Tips

1. **Start Small**: Begin with Basic setup and scale as needed
2. **Monitor Usage**: Use Digital Ocean metrics to optimize
3. **Shared Database**: Use one database for multiple apps
4. **Auto-Scaling**: Enable only when needed
5. **Dev/Staging**: Use separate, smaller instances

---

## Scaling

### Horizontal Scaling

**Add More App Instances:**
1. Go to App → Settings
2. Under "Resources", edit your service
3. Increase "Instance Count"
4. Save and deploy

Digital Ocean automatically load balances between instances!

### Vertical Scaling

**Upgrade Instance Size:**
1. Go to App → Settings
2. Edit your service
3. Choose larger instance size:
   - Basic: xxs, xs, s, m
   - Professional: xs, s, m, l, xl, 2xl
4. Save and deploy

**Upgrade Database:**
1. Go to Databases
2. Click your database
3. Settings → Resize
4. Choose new plan
5. Apply (brief downtime during resize)

### Auto-Scaling (Professional Plans)

Enable automatic scaling based on metrics:
1. Professional plan required
2. Set min and max instances
3. Configure scaling triggers:
   - CPU usage > 80%
   - Memory usage > 80%
   - Request rate

---

## Monitoring & Maintenance

### Health Checks

The app includes a health check endpoint:
- URL: `/api/health`
- Configured in `.do/app.yaml`
- Digital Ocean monitors this automatically

### Metrics Dashboard

View in Digital Ocean dashboard:
- CPU usage
- Memory usage
- Network bandwidth
- Request rate
- Error rate

### Logging

**Access Logs:**
```bash
# Runtime logs
doctl apps logs YOUR_APP_ID --type=run --follow

# Build logs
doctl apps logs YOUR_APP_ID --type=build

# Or use Dashboard → Runtime Logs tab
```

### Backups

**Database Backups:**
- Digital Ocean automatically backs up databases
- Daily backups retained for 7 days
- Manual backups available anytime

**Create Manual Backup:**
1. Go to Databases
2. Click your database
3. Backups tab → Create Backup

**Restore Backup:**
1. Backups tab → Click backup
2. Click "Restore"
3. Choose to restore to existing or new database

---

## CI/CD Integration

### Automatic Deployments

Already enabled! Every push to `main` triggers deployment.

**Disable Auto-Deploy:**
1. Go to App → Settings
2. Source → Edit
3. Uncheck "Autodeploy"

### Branch-Based Deployments

Deploy different branches to different apps:

```yaml
# .do/staging.yaml
name: snaplist-staging
github:
  branch: staging
# ... rest of config
```

Deploy:
```bash
doctl apps create --spec .do/staging.yaml
```

### GitHub Actions Integration

See [Option 3](#option-3-deploy-with-github-action-cicd) above for full CI/CD pipeline.

---

## Security Best Practices

1. **Use Secrets for Sensitive Data**
   - Mark all API keys as "Secret" in environment variables
   - Never commit secrets to Git

2. **Enable SSL/TLS**
   - Automatically enabled by Digital Ocean
   - Renews automatically

3. **Database Security**
   - Use connection pooling
   - Enable SSL mode for database connections
   - Restrict database access to app only

4. **Regular Updates**
   - Keep dependencies updated
   - Monitor for security vulnerabilities
   - Enable Dependabot on GitHub

5. **Monitoring**
   - Set up alerts for unusual activity
   - Monitor logs regularly
   - Use rate limiting for APIs

---

## Additional Resources

### Digital Ocean Documentation
- [App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Database Docs](https://docs.digitalocean.com/products/databases/)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)

### SnapList Documentation
- [Main README](../README.md)
- [OAuth Setup](./OAUTH_SETUP_GUIDE.md)
- [Google Maps Setup](./GOOGLE_MAPS_SETUP.md)
- [Testing Guide](./TESTING_GUIDE.md)

### Support
- [Digital Ocean Community](https://www.digitalocean.com/community)
- [Digital Ocean Support](https://www.digitalocean.com/support/)

---

## Next Steps

After successful deployment:

1. ✅ Configure custom domain
2. ✅ Set up OAuth providers
3. ✅ Configure Stripe webhooks
4. ✅ Enable monitoring alerts
5. ✅ Test all features
6. ✅ Set up staging environment
7. ✅ Configure backups
8. ✅ Update documentation

---

**🎉 Congratulations!** Your SnapList app is now running on Digital Ocean!

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section or open an issue on GitHub.

