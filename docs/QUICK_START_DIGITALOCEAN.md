# 🚀 Quick Start: Deploy to Digital Ocean in 10 Minutes

Get your SnapList QR code management app running on Digital Ocean in just a few minutes!

## Prerequisites

- [ ] Digital Ocean account ([Sign up here](https://cloud.digitalocean.com/registrations/new))
- [ ] GitHub account with your code pushed
- [ ] Stripe account with test API keys

## Step 1: Prepare Your Repository (2 minutes)

1. **Update the configuration file**
   ```bash
   # Edit .do/app.yaml
   # Change: YOUR_GITHUB_USERNAME/SnapList
   # To: youractualusername/SnapList
   ```

2. **Commit and push**
   ```bash
   git add .do/app.yaml
   git commit -m "Configure for Digital Ocean"
   git push origin main
   ```

## Step 2: Create App on Digital Ocean (3 minutes)

1. **Go to App Platform**
   - Visit: https://cloud.digitalocean.com/apps
   - Click **"Create App"**

2. **Connect GitHub**
   - Select **GitHub** as source
   - Authorize Digital Ocean
   - Choose your **SnapList** repository
   - Select **main** branch
   - Enable **"Autodeploy"**

3. **Review Configuration**
   - Digital Ocean will auto-detect Node.js
   - Confirm these settings:
     - Build Command: `npm install && npm run build`
     - Run Command: `npm start`
     - HTTP Port: `5000`

4. **Add Database**
   - Click **"Add Resource"** → **"Database"**
   - Select **PostgreSQL 16**
   - Choose plan (Basic is fine for testing)
   - Database will auto-connect to your app

## Step 3: Set Environment Variables (3 minutes)

In the Digital Ocean dashboard, add these environment variables:

### Security Secrets
```bash
# Generate these first:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_SECRET=<generated-secret>
SESSION_SECRET=<generated-secret>
```

### Stripe Keys
```bash
# Get from: https://dashboard.stripe.com/apikeys

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### Stripe Price IDs
```bash
# Get from: https://dashboard.stripe.com/products

STRIPE_STANDARD_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

### Basic Settings
```bash
NODE_ENV=production
PORT=5000
```

## Step 4: Deploy! (2 minutes)

1. **Create Resources**
   - Click **"Next"** → **"Create Resources"**
   - Wait 5-10 minutes for initial deployment

2. **Monitor Progress**
   - Watch the build logs in real-time
   - Green checkmark = successful deployment!

3. **Get Your URL**
   - Your app will be live at: `https://snaplist-xxxxx.ondigitalocean.app`
   - Click the URL to test!

## Step 5: Test Your App (2 minutes)

1. **Visit your URL**
2. **Register a new account**
3. **Login**
4. **Create a QR code** (test mode, no payment needed)
5. **Scan the QR code** to verify it works

## ✅ Done!

Your app is now live on Digital Ocean! 🎉

## Next Steps (Optional)

### Add Custom Domain
1. Go to App → Settings → Domains
2. Add your domain
3. Update DNS with provided CNAME
4. SSL automatically enabled!

### Enable OAuth (Optional)
- [Google OAuth Setup](./OAUTH_SETUP_GUIDE.md)
- Add redirect URI: `https://your-domain.com/api/auth/google/callback`

### Configure Stripe Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Copy webhook secret
4. Add to Digital Ocean as `STRIPE_WEBHOOK_SECRET`

### Monitor Your App
- View logs: App → Runtime Logs
- Check metrics: App → Metrics
- Set alerts: App → Settings → Alerts

## Troubleshooting

### Build Failed?
- Check build logs in Digital Ocean dashboard
- Verify all files are pushed to GitHub
- Ensure `package.json` has correct scripts

### App Not Starting?
- Check runtime logs
- Verify all environment variables are set
- Ensure `DATABASE_URL` is connected

### Can't Connect to Database?
- Verify database is created
- Check database connection in Settings
- Database URL should be auto-injected

### Need More Help?
- [Full Deployment Guide](./DIGITAL_OCEAN_DEPLOYMENT.md)
- [Troubleshooting Section](./DIGITAL_OCEAN_DEPLOYMENT.md#troubleshooting)
- [Digital Ocean Support](https://www.digitalocean.com/support/)

## Cost Summary

| Resource | Plan | Cost |
|----------|------|------|
| App | Basic | $5/month |
| Database | Dev/Basic | $15/month |
| **Total** | | **~$20/month** |

First $200 free with Digital Ocean credit for new accounts!

---

**🎉 Congratulations!** Your SnapList app is now running on Digital Ocean!

Need help? Check the [full deployment guide](./DIGITAL_OCEAN_DEPLOYMENT.md) or open an issue on GitHub.

