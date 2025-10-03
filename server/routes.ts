import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { UAParser } from "ua-parser-js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertQrCodeSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

// Configure Passport with Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Check if email is available
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email provided by Google'), null);
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email,
          password: await bcrypt.hash(nanoid(32), 10), // Random password for OAuth users
          firstName: profile.name?.givenName || profile.displayName || '',
          lastName: profile.name?.familyName || ''
        });

        // Create default FREE membership
        await storage.createUserMembership({
          userId: user.id,
          tierName: 'FREE',
          isActive: true,
          expiresAt: null
        });
      }
      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// Configure Passport with Facebook OAuth
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'displayName']
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Check if user exists
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email provided by Facebook'), null);
      }

      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email,
          password: await bcrypt.hash(nanoid(32), 10), // Random password for OAuth users
          firstName: profile.name?.givenName || profile.displayName || '',
          lastName: profile.name?.familyName || ''
        });

        // Create default FREE membership
        await storage.createUserMembership({
          userId: user.id,
          tierName: 'FREE',
          isActive: true,
          expiresAt: null
        });
      }
      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// Middleware to verify JWT token
const authenticateToken = (req: any, res: Response, next: any) => {
  // Check Authorization header first, then fall back to cookie
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  // If no token in header, check cookie
  if (!token && req.cookies) {
    token = req.cookies['auth-token'];
  }

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware to verify admin access
const authenticateAdmin = async (req: any, res: Response, next: any) => {
  try {
    const user = await storage.getUser(req.user.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Error verifying admin status" });
  }
};

// Generate unique short code
const generateShortCode = async (): Promise<string> => {
  let shortCode;
  let exists = true;
  
  while (exists) {
    shortCode = nanoid(8);
    const existing = await storage.getQrCodeByShortCode(shortCode);
    exists = !!existing;
  }
  
  return shortCode!;
};

// Parse device info from user agent
const parseDeviceInfo = (userAgent: string) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    deviceType: result.device.type || 'desktop',
    browser: result.browser.name || 'Unknown',
    operatingSystem: result.os.name || 'Unknown'
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Passport
  app.use(passport.initialize());
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Create default FREE membership
      const membership = await storage.createUserMembership({
        userId: user.id,
        tierName: 'FREE',
        isActive: true,
        expiresAt: null
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '24h'
      });

      // Set HttpOnly cookie for security
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          membership: {
            tierName: membership.tierName,
            isActive: membership.isActive,
            expiresAt: membership.expiresAt
          }
        } 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '24h'
      });

      // Get user's membership
      const membership = await storage.getUserMembership(user.id);

      // Set HttpOnly cookie for security
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          membership: membership ? {
            tierName: membership.tierName,
            isActive: membership.isActive,
            expiresAt: membership.expiresAt
          } : null
        } 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's membership
      const membership = await storage.getUserMembership(req.user.userId);

      res.json({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        isAdmin: user.isAdmin,
        savedAddress: user.savedAddress,
        membership: membership ? {
          tierName: membership.tierName,
          isActive: membership.isActive,
          expiresAt: membership.expiresAt
        } : null
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    // Clear the auth-token cookie
    res.clearCookie('auth-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.json({ message: "Logged out successfully" });
  });

  // Google OAuth routes
  app.get("/api/auth/google",
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false 
    })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=auth_failed' }),
    async (req: any, res) => {
      try {
        const user = req.user;
        const membership = await storage.getUserMembership(user.id);

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
          expiresIn: '24h'
        });

        // Set HttpOnly cookie for security
        res.cookie('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Redirect to dashboard
        res.redirect('/dashboard');
      } catch (error: any) {
        res.redirect('/login?error=auth_failed');
      }
    }
  );

  // Facebook OAuth routes
  app.get("/api/auth/facebook",
    passport.authenticate('facebook', { 
      scope: ['email'],
      session: false 
    })
  );

  app.get("/api/auth/facebook/callback",
    passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=auth_failed' }),
    async (req: any, res) => {
      try {
        const user = req.user;
        const membership = await storage.getUserMembership(user.id);

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
          expiresIn: '24h'
        });

        // Set HttpOnly cookie for security
        res.cookie('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Redirect to dashboard
        res.redirect('/dashboard');
      } catch (error: any) {
        res.redirect('/login?error=auth_failed');
      }
    }
  );

  app.post("/api/users/save-address", authenticateToken, async (req: any, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }

      await storage.updateUser(req.user.userId, { savedAddress: address });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // QR Code routes
  app.get("/api/qr-codes", authenticateToken, async (req: any, res) => {
    try {
      const qrCodes = await storage.getUserQrCodes(req.user.userId);
      res.json(qrCodes);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/qr-codes/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const qrCode = await storage.getQrCode(id);
      
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }
      
      // Verify the QR code belongs to the authenticated user
      if (qrCode.userId !== req.user.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(qrCode);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/qr-codes", authenticateToken, async (req: any, res) => {
    try {
      const qrCodeData = insertQrCodeSchema.parse(req.body);
      const shortCode = await generateShortCode();
      
      const qrCode = await storage.createQrCode({
        ...qrCodeData,
        userId: req.user.userId,
        shortCode
      });

      res.json(qrCode);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/qr-codes/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = insertQrCodeSchema.partial().parse(req.body);
      
      // If destination URL is being changed, save the current URL to history
      if (updates.destinationUrl) {
        const currentQrCode = await storage.getQrCode(id);
        if (currentQrCode && currentQrCode.destinationUrl !== updates.destinationUrl) {
          await storage.createQrCodeUrlHistory(id, currentQrCode.destinationUrl);
        }
      }
      
      const qrCode = await storage.updateQrCode(id, updates);
      res.json(qrCode);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/qr-codes/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteQrCode(id);
      res.json({ message: "QR code deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/qr-codes/:id/analytics", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const analytics = await storage.getQrCodeAnalytics(id);
      res.json(analytics);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/qr-codes/:id/url-history", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getQrCodeUrlHistory(id);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/analytics", authenticateToken, async (req: any, res) => {
    try {
      const { timeRange } = req.query;
      const analytics = await storage.getUserAnalytics(req.user.userId, timeRange as string);
      res.json(analytics);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/qr-codes/:id/download", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const qrCode = await storage.getQrCode(id);
      
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }

      const fullUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/r/${qrCode.shortCode}`;
      const qrDataUrl = await QRCode.toDataURL(fullUrl, {
        color: {
          dark: qrCode.customColor || '#000000',
          light: qrCode.customBgColor || '#FFFFFF'
        },
        width: 512
      });

      res.json({ dataUrl: qrDataUrl });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Public QR redirect endpoint
  app.get("/r/:shortCode", async (req, res) => {
    try {
      const { shortCode } = req.params;
      const qrCode = await storage.getQrCodeByShortCode(shortCode);
      
      if (!qrCode || !qrCode.isActive) {
        return res.status(404).send("QR code not found or inactive");
      }

      // Track the scan
      const userAgent = req.get('User-Agent') || '';
      const deviceInfo = parseDeviceInfo(userAgent);
      
      await storage.createQrCodeScan({
        qrCodeId: qrCode.id,
        ipAddress: req.ip || null,
        userAgent,
        country: null,
        city: null,
        ...deviceInfo
      });

      // Increment scan count
      await storage.incrementQrCodeScans(qrCode.id);

      // Redirect to destination
      res.redirect(qrCode.destinationUrl);
    } catch (error: any) {
      res.status(500).send("Internal server error");
    }
  });

  // Subscription routes
  app.get("/api/subscriptions/tiers", async (req, res) => {
    try {
      const tiers = await storage.getMembershipTiers();
      res.json(tiers);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/subscriptions/create-checkout", authenticateToken, async (req: any, res) => {
    try {
      const { tierName } = req.body;
      
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get tier pricing from database
      const tiers = await storage.getMembershipTiers();
      const tier = tiers.find(t => t.name === tierName);
      
      if (!tier || !tier.stripePriceId) {
        return res.status(400).json({ message: "Invalid tier" });
      }

      let customerId = user.stripeCustomerId;
      
      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(user.id, customerId);
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: tier.stripePriceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Orders routes
  app.post("/api/orders/calculate-price", authenticateToken, async (req, res) => {
    try {
      const { productType, size, quantity } = req.body;
      
      // Simple pricing logic - replace with actual Printify API calls
      let basePrice = 0;
      if (productType === 'sticker') {
        basePrice = size === 'small' ? 0.5 : size === 'medium' ? 1.0 : 1.5;
      } else if (productType === 'yard_sign') {
        basePrice = 12.99;
      }

      const total = basePrice * quantity;
      res.json({ total: total.toFixed(2) });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/orders", authenticateToken, async (req: any, res) => {
    try {
      const orderData = insertOrderSchema.extend({
        stripePaymentIntentId: z.string().optional()
      }).parse(req.body);
      
      const order = await storage.createOrder({
        ...orderData,
        userId: req.user.userId
      });

      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/orders", authenticateToken, async (req: any, res) => {
    try {
      const orders = await storage.getUserOrders(req.user.userId);
      res.json(orders);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stripe payment intent for one-time payments
  app.post("/api/create-payment-intent", authenticateToken, async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe webhooks
  app.post("/api/webhooks/stripe", async (req, res) => {
    // Handle Stripe webhooks for subscription updates
    res.json({ received: true });
  });

  // Admin routes
  app.get("/api/admin/users", authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/qr-codes", authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const qrCodes = await storage.getAllQrCodes();
      res.json(qrCodes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/orders", authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/stats", authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/orders/:id", authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const order = await storage.updateOrder(id, updates);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
