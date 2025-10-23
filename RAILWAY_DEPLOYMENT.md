# 🚂 Railway Deployment Guide for SnapList

## Quick Deploy in 5 Minutes! ⚡

### Step 1: Fork or Clone Repository
```bash
git clone https://github.com/yourusername/snaplist.git
cd snaplist
```

### Step 2: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### Step 3: Deploy to Railway

#### Option A: Deploy from GitHub (Recommended)
1. In Railway dashboard, click "New Project"
2. Choose "Deploy from GitHub repo"
3. Select your SnapList repository
4. Railway will automatically detect and deploy!

#### Option B: Deploy via CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Deploy
railway up
```

### Step 4: Add PostgreSQL Database
1. In Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway automatically sets DATABASE_URL

### Step 5: Set Environment Variables
In Railway dashboard → Variables tab, add:

```env
# Required Variables (Copy from .env.railway)
JWT_SECRET=<generate-secure-string>
SESSION_SECRET=<generate-secure-string>

# Stripe (Get from stripe.com/dashboard)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# AWS SES (Get from AWS Console)
AWS_REGION=ca-central-1
AWS_SES_ACCESS_KEY_ID=<your-key>
AWS_SES_SECRET_ACCESS_KEY=<your-secret>
EMAIL_FROM=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

### Step 6: Deploy & Access
1. Railway will automatically build and deploy
2. Click on your service → Settings → Domains
3. Generate a domain or add custom domain
4. Your app is live at: `https://your-app.up.railway.app`

---

## 🎯 Post-Deployment Checklist

- [ ] ✅ Database connected (check logs)
- [ ] ✅ Admin account created
- [ ] ✅ Stripe webhooks configured
- [ ] ✅ AWS SES verified email addresses
- [ ] ✅ Test order creation
- [ ] ✅ Test PDF generation
- [ ] ✅ Test email sending

---

## 🔑 First Admin Setup

1. **Create Admin Account**:
   - Sign up at `/signup`
   - In Railway → Database → Query
   - Run: `UPDATE users SET "isAdmin" = true WHERE email = 'your@email.com';`

2. **Access Admin Dashboard**:
   - Navigate to `/admin`
   - Login with admin account
   - Configure settings at `/admin/settings`

---

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL is set
railway variables

# Restart service
railway restart
```

### Build Failures
```bash
# Check build logs
railway logs

# Clear cache and rebuild
railway up --no-cache
```

### Email Not Sending
- Verify AWS SES credentials
- Check sender email is verified in AWS SES
- For production: Request AWS SES production access

---

## 📊 Monitoring

- **Logs**: Railway Dashboard → Deployments → View Logs
- **Metrics**: Railway Dashboard → Metrics tab
- **Database**: Railway Dashboard → Database → Data tab

---

## 🎉 That's It!

Your SnapList app is now live on Railway! Total deployment time: ~5 minutes

**Next Steps**:
1. Configure admin settings at `/admin/settings`
2. Add products and create QR codes
3. Test the complete order flow
4. Share with your client!

---

## 💰 Railway Pricing

- **Hobby Plan**: $5/month (includes $5 usage)
- **Pro Plan**: $20/month (includes $20 usage)
- Database: ~$5-10/month for small apps
- **Total**: ~$10-15/month for production app

---

## 🔗 Quick Links

- Railway Dashboard: [railway.app/dashboard](https://railway.app/dashboard)
- SnapList Admin: `https://your-app.up.railway.app/admin`
- Support: [railway.app/help](https://railway.app/help)