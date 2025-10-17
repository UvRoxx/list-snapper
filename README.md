# 📱 SnapList - QR Code Management Platform

A modern, full-featured QR code management system with dynamic QR codes, analytics, and subscription-based pricing. Built with React, Node.js, PostgreSQL, and deployed on Digital Ocean.

![SnapList Banner](https://via.placeholder.com/1200x300/4F46E5/FFFFFF?text=SnapList+-+QR+Code+Management)

## ✨ Features

### Core Features
- 🔗 **Dynamic QR Codes**: Create and manage QR codes that can be updated anytime
- 📊 **Analytics Dashboard**: Track scans, locations, devices, and user engagement
- 🎨 **Customization**: Custom colors, logos, and branding for QR codes
- 📱 **Mobile Responsive**: Works perfectly on all devices
- 🌍 **Multi-language Support**: i18n ready (English, French, and more)

### Advanced Features
- 💳 **Stripe Integration**: Subscription-based pricing with Stripe Checkout
- 👥 **User Management**: Full authentication with JWT and sessions
- 🔐 **OAuth Support**: Login with Google and Facebook
- 📈 **Real-time Analytics**: Live tracking of QR code scans
- 🗺️ **Google Maps Integration**: Geocoding and location tracking
- 🛒 **Shopping Cart**: Physical QR code ordering system
- 👨‍💼 **Admin Panel**: Manage users, orders, and QR codes

### Subscription Tiers
- **FREE**: 5 QR codes, basic analytics
- **STANDARD**: 50 QR codes, advanced analytics, custom branding
- **PRO**: Unlimited QR codes, priority support, white-label options

## 🚀 Quick Deploy to Digital Ocean

Deploy your app in just 10 minutes!

### Option 1: One-Click Deploy (Recommended)

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new)

Then:
1. Connect your GitHub repository
2. Add environment variables (see below)
3. Click "Deploy"!

### Option 2: Using the Helper Script

```bash
# Clone the repository
git clone https://github.com/yourusername/SnapList.git
cd SnapList

# Run the deployment helper
./deploy-digitalocean.sh
```

### Option 3: Manual Setup

See our comprehensive [Digital Ocean Deployment Guide](./docs/DIGITAL_OCEAN_DEPLOYMENT.md)

Or our [10-Minute Quick Start](./docs/QUICK_START_DIGITALOCEAN.md)

## 📋 Prerequisites

- **Node.js** 20+ and npm
- **PostgreSQL** database (or use Digital Ocean managed database)
- **Stripe** account for payments
- (Optional) **Google OAuth** credentials
- (Optional) **Facebook OAuth** credentials
- (Optional) **Google Maps API** key

## 🛠️ Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/SnapList.git
cd SnapList
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/snaplist

# Security
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_STANDARD_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Google Maps (Optional)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Environment
NODE_ENV=development
PORT=5000
```

### 4. Set Up Database

```bash
# Push database schema
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5000` in your browser!

## 🏗️ Build for Production

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

## 📦 Project Structure

```
SnapList/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and helpers
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── db.ts            # Database connection
│   ├── storage.ts       # Database operations
│   └── cart.ts          # Shopping cart logic
├── shared/              # Shared code
│   └── schema.ts        # Database schema
├── docs/                # Documentation
├── .do/                 # Digital Ocean config
└── dist/                # Build output
```

## 🌐 Deployment Options

### Digital Ocean (Recommended)
- **Best for**: Full-stack apps with database
- **Cost**: ~$20/month (app + database)
- **Guide**: [Digital Ocean Deployment](./docs/DIGITAL_OCEAN_DEPLOYMENT.md)

### Railway
- **Best for**: Quick deployments with built-in PostgreSQL
- **Cost**: Usage-based pricing
- **Guide**: [Railway Deployment](./docs/DEPLOYMENT.md)

### Vercel
- **Best for**: Frontend-only or serverless
- **Cost**: Free tier available
- **Guide**: [Vercel Deployment](./docs/DEPLOYMENT.md)

### Render
- **Best for**: Full-stack apps, free tier available
- **Cost**: Free tier available
- **Guide**: [Render Deployment](./docs/DEPLOYMENT.md)

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT tokens |
| `SESSION_SECRET` | Yes | Secret for sessions |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret API key |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `VITE_STRIPE_PUBLIC_KEY` | Yes | Stripe public key for frontend |
| `STRIPE_STANDARD_PRICE_ID` | Yes | Stripe price ID for standard plan |
| `STRIPE_PRO_PRICE_ID` | Yes | Stripe price ID for pro plan |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `FACEBOOK_APP_ID` | No | Facebook OAuth app ID |
| `FACEBOOK_APP_SECRET` | No | Facebook OAuth app secret |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Google Maps API key |
| `NODE_ENV` | Yes | Environment (development/production) |
| `PORT` | No | Server port (default: 5000) |

### Generate Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📚 Documentation

- [Digital Ocean Deployment Guide](./docs/DIGITAL_OCEAN_DEPLOYMENT.md) - Complete Digital Ocean setup
- [Quick Start Guide](./docs/QUICK_START_DIGITALOCEAN.md) - Deploy in 10 minutes
- [OAuth Setup Guide](./docs/OAUTH_SETUP_GUIDE.md) - Configure Google/Facebook login
- [Google Maps Setup](./docs/GOOGLE_MAPS_SETUP.md) - Add location features
- [Testing Guide](./docs/TESTING_GUIDE.md) - Test your deployment
- [General Deployment](./docs/DEPLOYMENT.md) - Other deployment options

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Create QR code
- [ ] Scan QR code
- [ ] View analytics
- [ ] Update QR code destination
- [ ] Subscribe to paid plan
- [ ] Process payment
- [ ] View billing history

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/facebook` - Facebook OAuth

### QR Code Endpoints

- `GET /api/qr-codes` - List user's QR codes
- `POST /api/qr-codes` - Create new QR code
- `GET /api/qr-codes/:id` - Get QR code details
- `GET /api/qr-codes/:id/analytics` - Get analytics
- `GET /api/qr-codes/:id/download` - Download QR code

### Subscription Endpoints

- `GET /api/subscriptions/tiers` - List available tiers
- `POST /api/subscriptions/create-checkout` - Create Stripe checkout
- `GET /api/billing/subscription` - Get user's subscription
- `POST /api/billing/cancel-subscription` - Cancel subscription

### Health Check

- `GET /api/health` - Health check endpoint

## 🔒 Security

- JWT-based authentication
- Bcrypt password hashing
- HTTPS enforced in production
- CORS configured
- Rate limiting (recommended to add)
- SQL injection prevention via Drizzle ORM
- XSS protection
- CSRF protection

## 📊 Tech Stack

### Frontend
- **React** 18 - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Query** - Data fetching
- **Wouter** - Routing
- **i18next** - Internationalization

### Backend
- **Node.js** 20+ - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Passport** - Authentication
- **Stripe** - Payments

### Infrastructure
- **Digital Ocean** - Hosting (recommended)
- **Neon** - Serverless PostgreSQL (alternative)
- **Vite** - Build tool
- **ESBuild** - Bundler

## 📈 Performance

- Server-side rendering ready
- Image optimization
- Code splitting
- Lazy loading
- Database indexing
- Connection pooling
- CDN support

## 🌍 Internationalization

Currently supports:
- 🇺🇸 English
- 🇫🇷 French

Add more languages by creating translation files in `client/public/locales/`

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Known Issues

See [GitHub Issues](https://github.com/yourusername/SnapList/issues) for current bugs and feature requests.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 👥 Authors

- **Your Name** - Initial work - [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Stripe](https://stripe.com/) for payment processing
- [Digital Ocean](https://www.digitalocean.com/) for hosting
- [QRCode.js](https://github.com/soldair/node-qrcode) for QR code generation

## 📞 Support

- **Documentation**: Check the [docs](./docs/) folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/SnapList/issues)
- **Email**: support@snaplist.com
- **Discord**: [Join our community](https://discord.gg/snaplist)

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Bulk QR code generation
- [ ] Advanced analytics (heatmaps, A/B testing)
- [ ] API access for developers
- [ ] White-label solutions
- [ ] QR code templates library
- [ ] Integration with popular services (Zapier, IFTTT)
- [ ] Team collaboration features
- [ ] Custom domain for QR redirects

## 💰 Pricing

### FREE
- 5 QR codes
- Basic analytics
- Standard support

### STANDARD - $9.99/month
- 50 QR codes
- Advanced analytics
- Custom branding
- Priority support

### PRO - $29.99/month
- Unlimited QR codes
- Full analytics suite
- White-label option
- API access
- Dedicated support

---

Made with ❤️ by the SnapList team

**[Deploy Now](https://cloud.digitalocean.com/apps)** | **[Documentation](./docs/)** | **[Report Bug](https://github.com/yourusername/SnapList/issues)** | **[Request Feature](https://github.com/yourusername/SnapList/issues)**
