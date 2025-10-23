# 🛍️ SnapList - E-Commerce Platform with Admin Dashboard

Complete e-commerce platform with QR code ordering, comprehensive admin dashboard, and automated order fulfillment. Production-ready with 322+ tests.

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![React](https://img.shields.io/badge/React-18+-cyan)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-orange)
![Tests](https://img.shields.io/badge/Tests-322%20passing-brightgreen)

## 🚀 Quick Deploy to Railway (5 minutes!)

```bash
# Deploy with Railway CLI
railway login
railway init
railway up
```

See **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** for step-by-step instructions.

## ✨ Key Features

### 📊 **Admin Dashboard** (`/admin`)
- **User Management**: Filter by country, language, membership status
- **Order Management**: Status tracking, bulk exports, PDF generation
- **Real-time Metrics**: Users, orders, QR codes, revenue
- **Settings Panel**: Email, shipping, QR styling, Stripe configuration

### 📄 **PDF Generation System**
- **Smart Layouts**: Auto-adjusts based on order size
- **Small Orders (≤10)**: 2x2 grid with delivery address
- **Large Orders (>10)**: Multi-page 2x3 grid
- **Delivery Labels**: 100mm x 150mm shipping labels
- **Bulk Export**: ZIP files with all PDFs

### 🛍️ **E-Commerce Features**
- QR code product ordering
- Shopping cart functionality
- Stripe payment integration
- Membership tiers (Free, Standard, Pro)
- Multi-country support (Canada, US, UK)

### 📧 **Email Automation**
- Order confirmations
- Status updates (5 stages)
- Welcome emails
- Newsletter subscriptions
- AWS SES integration

## 📋 What's Included

✅ **Complete Admin Dashboard** - User & order management
✅ **PDF Generation** - Orders & delivery labels
✅ **Email System** - AWS SES automated emails
✅ **Payment Processing** - Stripe integration
✅ **322+ Tests** - 95% backend, 85% frontend coverage
✅ **Production Ready** - Error handling, logging, security

## 🚀 Deployment

### Railway (Recommended - 5 minutes)
1. Push to GitHub
2. Connect Railway to repo
3. Add PostgreSQL
4. Set environment variables
5. Deploy!

**Full Guide**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

### Required Environment Variables
```env
# Database (Railway provides automatically)
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-here
SESSION_SECRET=your-secret-here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS SES
AWS_REGION=ca-central-1
AWS_SES_ACCESS_KEY_ID=...
AWS_SES_SECRET_ACCESS_KEY=...
EMAIL_FROM=noreply@yourdomain.com
```

See [.env.railway](./.env.railway) for complete list.

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Access at http://localhost:5000

## 🧪 Testing

```bash
# Run all tests (322+)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📁 Project Structure

```
snaplist/
├── client/               # React frontend
│   └── src/
│       ├── pages/        # Page components
│       │   ├── admin.tsx         # Admin dashboard
│       │   └── admin-settings.tsx # Admin settings
│       └── components/   # UI components
├── server/               # Express backend
│   ├── routes.ts         # API endpoints
│   ├── pdf-generator.ts  # PDF generation
│   ├── zip-generator.ts  # ZIP packaging
│   └── email-simple.ts   # Email service
├── tests/                # 322+ test cases
└── shared/               # Shared types
```

## 📚 Documentation

- **[CLIENT_PRESENTATION.md](./CLIENT_PRESENTATION.md)** - Complete feature overview
- **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** - Railway deployment guide
- **[TEST_SUMMARY.md](./TEST_SUMMARY.md)** - Test documentation
- **[tests/README.md](./tests/README.md)** - Testing guide

## 💰 Estimated Costs

- **Railway Hosting**: ~$10-15/month
- **Database**: Included with Railway
- **Emails**: AWS SES ~$0.10/1000 emails
- **Total**: ~$10-20/month

## 🎯 Ready for Production

✅ **100% Functional** - All features working
✅ **Fully Tested** - 322+ passing tests
✅ **Production Ready** - Error handling, logging
✅ **Easy Deploy** - 5-minute Railway setup
✅ **Client Ready** - Professional admin dashboard

## 📞 Next Steps

1. **Deploy to Railway** (5 minutes)
2. **Configure Stripe** for payments
3. **Setup AWS SES** for emails
4. **Create admin account**
5. **Start accepting orders!**

---

**Status**: ✅ Production Ready | **Tests**: 322 Passing | **Coverage**: 90%+

Built with TypeScript, React, PostgreSQL, and tested with 322+ test cases.