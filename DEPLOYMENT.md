# 🚀 SnapList Deployment Guide

## Current Issue Fix

Your site at https://listsnapper.webisoft.app/ is showing code instead of the website because of incorrect Vercel configuration.

## ✅ Quick Fix Steps

### 1. **Update Your Repository**
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push
```

### 2. **Update Vercel Settings**

Go to your Vercel dashboard for this project and:

**Build & Development Settings:**
- **Build Command:** `npm run build:client`
- **Output Directory:** `dist/public`
- **Install Command:** `npm install`

**Environment Variables (Add these in Vercel dashboard):**
```
DATABASE_URL=your-neon-connection-string
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_STANDARD_PRICE_ID=price_1SD9ShDtmSuWvYXlHQLZbM77
STRIPE_PRO_PRICE_ID=price_1SD9T7DtmSuWvYXlQhTn40Oj
VITE_STRIPE_PUBLIC_KEY=pk_test_...
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
NODE_ENV=production
```

### 3. **Redeploy**
Click "Redeploy" in Vercel dashboard.

## Alternative: Deploy to Railway (Recommended for Full-Stack)

Railway handles full-stack apps better than Vercel:

1. **Go to:** https://railway.app
2. **Connect GitHub repo**
3. **Add same environment variables**
4. **Deploy automatically**

## Alternative: Deploy to Render

1. **Go to:** https://render.com
2. **Create Web Service from GitHub**
3. **Build Command:** `npm run build`
4. **Start Command:** `npm start`

## 🔧 What Each Platform Handles

**Vercel:** 
- ✅ Great for frontend
- ⚠️ Serverless functions (more complex for full-stack)

**Railway:** 
- ✅ Perfect for full-stack apps
- ✅ Built-in PostgreSQL
- ✅ Simple deployment

**Render:**
- ✅ Good for full-stack
- ✅ Simple configuration
- ✅ Free tier available

## 📝 Production Checklist

- ✅ Client builds correctly (`npm run build:client`)
- ✅ Environment variables configured
- ✅ Database connected (Neon)
- ✅ Stripe keys added
- ✅ OAuth redirect URIs updated for production domain
- ✅ `.gitignore` excludes sensitive files

## 🎯 Recommended: Use Railway

Railway is the easiest for your type of full-stack app:

1. Push to GitHub
2. Connect to Railway
3. Add environment variables
4. Deploy!

Your app will be live in minutes with proper server + client serving.
