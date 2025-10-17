import type { Express, Request, Response } from "express";
import express from "express";
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
import { storage as cartStorage } from "./cart";
import { insertUserSchema, loginSchema, insertQrCodeSchema, insertOrderSchema, insertCartItemSchema } from "@shared/schema";
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
          stickerCredits: 0,
          creditsResetAt: null,
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
          stickerCredits: 0,
          creditsResetAt: null,
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
  
  // Health check endpoint for Digital Ocean and other monitoring services
  app.get("/api/health", async (req, res) => {
    try {
      // Check database connectivity
      await storage.getUsers(); // Simple query to verify DB is accessible
      
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
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
        stickerCredits: 0,
        creditsResetAt: null,
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

  // Get plan limits and usage
  app.get("/api/plan-limits", authenticateToken, async (req: any, res) => {
    try {
      const userMembership = await storage.getUserMembership(req.user.userId);
      const tiers = await storage.getMembershipTiers();
      
      // Default to FREE tier if no membership found
      const tierName = userMembership?.tierName || 'FREE';
      const tier = tiers.find(t => t.name === tierName);
      
      if (!tier) {
        return res.status(500).json({ message: "Unable to determine plan tier" });
      }
      
      const qrCodeCount = await storage.getUserQrCodeCount(req.user.userId);
      const stickerCredits = await storage.getStickerCredits(req.user.userId);
      
      res.json({
        tierName: tier.name,
        displayName: tier.displayName,
        maxQrCodes: tier.maxQrCodes, // null means unlimited
        currentQrCodes: qrCodeCount,
        canCreateMore: tier.maxQrCodes === null || qrCodeCount < tier.maxQrCodes,
        stickerCredits: stickerCredits,
        hasAnalytics: tier.hasAnalytics,
        hasCustomBranding: tier.hasCustomBranding,
        hasApiAccess: tier.hasApiAccess,
        hasWhiteLabel: tier.hasWhiteLabel
      });
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
      
      // Check user's plan limits before creating
      const userMembership = await storage.getUserMembership(req.user.userId);
      const tiers = await storage.getMembershipTiers();
      
      // Default to FREE tier if no membership found
      const tierName = userMembership?.tierName || 'FREE';
      const tier = tiers.find(t => t.name === tierName);
      
      if (!tier) {
        return res.status(500).json({ message: "Unable to determine plan tier" });
      }
      
      // Check if user has reached their plan limit (use efficient count method)
      const qrCodeCount = await storage.getUserQrCodeCount(req.user.userId);
      
      // If maxQrCodes is null, it means unlimited (PRO plan)
      if (tier.maxQrCodes !== null && qrCodeCount >= tier.maxQrCodes) {
        return res.status(403).json({ 
          message: `You've reached your plan limit of ${tier.maxQrCodes} QR codes. Please upgrade to create more.`,
          limit: tier.maxQrCodes,
          current: qrCodeCount,
          tierName: tier.name
        });
      }
      
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

      // Return QR data along with custom text and position for client-side rendering
      res.json({ 
        dataUrl: qrDataUrl,
        customText: qrCode.customText,
        textPosition: qrCode.textPosition || 'bottom'
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // API endpoint to get redirect info (used by branded redirect page)
  app.get("/api/redirect-info/:shortCode", async (req, res) => {
    try {
      const { shortCode } = req.params;
      const qrCode = await storage.getQrCodeByShortCode(shortCode);
      
      if (!qrCode || !qrCode.isActive) {
        return res.status(404).json({ message: "QR code not found or inactive" });
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

      // Return QR code info for branded redirect page
      res.json({
        name: qrCode.name,
        destinationUrl: qrCode.destinationUrl,
        shortCode: qrCode.shortCode
      });
    } catch (error: any) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Direct upgrade endpoint - called after payment success
  app.post("/api/upgrade-user-tier", authenticateToken, async (req: any, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      console.log('🔄 Manual tier upgrade requested for payment:', paymentIntentId);
      
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No subscription found" });
      }

      // Get subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      const priceId = subscription.items.data[0].price.id;
      
      // Find the tier
      const tiers = await storage.getMembershipTiers();
      const tier = tiers.find(t => t.stripePriceId === priceId);
      
      if (!tier) {
        return res.status(404).json({ message: "Tier not found" });
      }

      // Update membership
      const existingMembership = await storage.getUserMembership(user.id);
      
      if (existingMembership) {
        await storage.updateUserMembership(user.id, { tierName: tier.name as any });
      } else {
        await storage.createUserMembership({
          userId: user.id,
          tierName: tier.name as any,
          isActive: true,
          stickerCredits: tier.name === 'STANDARD' ? 25 : tier.name === 'PRO' ? 100 : 0,
          creditsResetAt: (tier.name === 'STANDARD' || tier.name === 'PRO') ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          expiresAt: null
        });
      }
      
      console.log(`🎉 MANUALLY UPGRADED ${user.email} to ${tier.name}!`);
      
      res.json({ 
        success: true, 
        tier: tier.name,
        message: "Tier upgraded successfully" 
      });
    } catch (error: any) {
      console.error('Manual upgrade error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Simple webhook handler 
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
    console.log('Webhook received - raw body type:', typeof req.body);
    res.json({ received: true });
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

  // Check and update subscription status (useful for testing without webhooks)
  app.post("/api/subscriptions/check-status", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No subscription found" });
      }

      // Retrieve subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['latest_invoice.payment_intent']
      });
      
      console.log('Checking subscription status:', {
        id: subscription.id,
        status: subscription.status,
        customerId: subscription.customer
      });

      // If subscription is incomplete, try to activate it with the payment method from setup intent
      if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
        console.log('Subscription is incomplete, checking for completed setup intents...');
        
        // Check for successful setup intents
        const setupIntents = await stripe.setupIntents.list({
          customer: user.stripeCustomerId!,
          limit: 10,
        });
        
        const successfulSetup = setupIntents.data.find(si => 
          si.status === 'succeeded' && 
          si.metadata?.subscription_id === subscription.id &&
          si.payment_method
        );
        
        if (successfulSetup) {
          console.log('Found successful setup intent with payment method:', successfulSetup.payment_method);
          
          try {
            const paymentMethodId = successfulSetup.payment_method as string;
            
            // Set this as the default payment method on the subscription
            console.log('Updating subscription with payment method...');
            const updatedSub = await stripe.subscriptions.update(subscription.id, {
              default_payment_method: paymentMethodId,
            });
            
            console.log('Subscription updated, new status:', updatedSub.status);
            
            // If still incomplete, manually pay the first invoice
            if (updatedSub.status === 'incomplete') {
              const latestInvoice = await stripe.invoices.retrieve(updatedSub.latest_invoice as string);
              
              if (latestInvoice && !(latestInvoice as any).paid) {
                console.log('Paying first invoice with payment method...');
                await stripe.invoices.pay(latestInvoice.id, {
                  payment_method: paymentMethodId,
                });
              }
              
              // Re-retrieve after payment
              const finalSub = await stripe.subscriptions.retrieve(subscription.id);
              console.log('Final subscription status:', finalSub.status);
              
              if (finalSub.status === 'active') {
                const priceId = finalSub.items.data[0].price.id;
                const tiers = await storage.getMembershipTiers();
                const tier = tiers.find(t => t.stripePriceId === priceId);
                
                if (tier) {
                  const existingMembership = await storage.getUserMembership(user.id);
                  
                  // Grant sticker credits based on tier
                  const creditsToGrant = tier.name === 'STANDARD' ? 25 : tier.name === 'PRO' ? 100 : 0;
                  
                  if (existingMembership) {
                    await storage.updateUserMembership(user.id, { tierName: tier.name as any });
                  } else {
                    await storage.createUserMembership({
                      userId: user.id,
                      tierName: tier.name as any,
                      isActive: true,
                      stickerCredits: creditsToGrant,
                      creditsResetAt: creditsToGrant > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
                      expiresAt: null
                    });
                  }
                  
                  // Add credits if upgrading
                  if (creditsToGrant > 0 && existingMembership) {
                    await storage.addStickerCredits(user.id, creditsToGrant);
                  }
                  
                  console.log(`✅ Activated ${tier.name} membership for ${user.email} with ${creditsToGrant} credits`);
                  
                  return res.json({ 
                    success: true, 
                    tier: tier.name,
                    status: finalSub.status 
                  });
                }
              }
            }
          } catch (activationError: any) {
            console.error('Error activating subscription:', activationError.message);
            return res.json({ 
              success: false, 
              status: subscription.status,
              message: `Error: ${activationError.message}` 
            });
          }
        }
        
        return res.json({ 
          success: false, 
          status: subscription.status,
          message: "Waiting for payment method setup to complete." 
        });
      }

      if (subscription.status === 'active' || subscription.status === 'trialing') {
        // Get the tier from the subscription
        const priceId = subscription.items.data[0].price.id;
        const tiers = await storage.getMembershipTiers();
        const tier = tiers.find(t => t.stripePriceId === priceId);
        
        if (tier) {
          // Check if user already has a membership
          const existingMembership = await storage.getUserMembership(user.id);
          
          if (existingMembership) {
            await storage.updateUserMembership(user.id, { tierName: tier.name as any });
            console.log(`✅ Updated user ${user.email} membership to ${tier.name}`);
          } else {
            const creditsToGrant = tier.name === 'STANDARD' ? 25 : tier.name === 'PRO' ? 100 : 0;
            await storage.createUserMembership({
              userId: user.id,
              tierName: tier.name as any,
              isActive: true,
              stickerCredits: creditsToGrant,
              creditsResetAt: creditsToGrant > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
              expiresAt: null
            });
            console.log(`✅ Created user ${user.email} membership for ${tier.name}`);
          }
          
          res.json({ 
            success: true, 
            tier: tier.name,
            status: subscription.status 
          });
        } else {
          res.status(404).json({ message: "Tier not found for this subscription" });
        }
      } else {
        res.json({ 
          success: false, 
          status: subscription.status,
          message: "Subscription is not active yet" 
        });
      }
    } catch (error: any) {
      console.error('Error checking subscription status:', error);
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

      // Create subscription with proper payment behavior for immediate payment
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: tier.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card']
        },
        expand: ['latest_invoice.payment_intent'],
        collection_method: 'charge_automatically',
      });

      console.log('Subscription created:', {
        id: subscription.id,
        status: subscription.status
      });

      const invoice = subscription.latest_invoice as any;
      
      if (!invoice) {
        return res.status(500).json({ message: "Failed to create invoice" });
      }

      let clientSecret: string;
      
      // Check if invoice has payment intent
      if (invoice.payment_intent?.client_secret) {
        clientSecret = invoice.payment_intent.client_secret;
        console.log('Using existing payment intent:', invoice.payment_intent.id);
      } else {
        // Create payment intent manually for this invoice
        console.log('Creating payment intent for invoice amount:', invoice.amount_due);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: invoice.amount_due,
          currency: invoice.currency,
          customer: customerId,
          payment_method_types: ['card'],
          metadata: {
            subscription_id: subscription.id,
            invoice_id: invoice.id,
          },
        });
        
        clientSecret = paymentIntent.client_secret!;
        console.log('Created payment intent:', paymentIntent.id);
      }

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
      });
    } catch (error: any) {
      console.error('Error creating subscription checkout:', error);
      res.status(400).json({ message: error.message || "Failed to create subscription" });
    }
  });

  // Get user's invoices from Stripe
  app.get("/api/billing/invoices", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.stripeCustomerId) {
        return res.json({ invoices: [] });
      }

      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 100,
      });

      res.json({ 
        invoices: invoices.data.map(inv => ({
          id: inv.id,
          number: inv.number,
              amount: inv.amount_due / 100,
              currency: inv.currency.toUpperCase(),
              status: inv.status,
              created: inv.created,
              paid: (inv as any).paid,
              invoicePdf: inv.invoice_pdf,
              hostedInvoiceUrl: inv.hosted_invoice_url,
        }))
      });
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get subscription details with payment method
  app.get("/api/billing/subscription", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['default_payment_method']
      });

      const membership = await storage.getUserMembership(user.id);
      const tierName = membership?.tierName || 'FREE';

      const paymentMethod = subscription.default_payment_method as any;

      res.json({ 
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: (subscription as any).current_period_end,
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
          tierName,
          paymentMethod: paymentMethod ? {
            brand: paymentMethod.card?.brand,
            last4: paymentMethod.card?.last4,
            expMonth: paymentMethod.card?.exp_month,
            expYear: paymentMethod.card?.exp_year,
          } : null
        }
      });
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Cancel subscription
  app.post("/api/billing/cancel-subscription", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription" });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      res.json({ 
        success: true,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        currentPeriodEnd: (subscription as any).current_period_end
      });
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Reactivate subscription
  app.post("/api/billing/reactivate-subscription", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription" });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      res.json({ 
        success: true,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
      });
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Upgrade subscription tier (Standard → Pro with proration)
  app.post("/api/subscriptions/upgrade", authenticateToken, async (req: any, res) => {
    try {
      const { newTierName } = req.body;
      const user = await storage.getUser(req.user.userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription to upgrade" });
      }

      const tiers = await storage.getMembershipTiers();
      const newTier = tiers.find(t => t.name === newTierName);
      
      if (!newTier || !newTier.stripePriceId) {
        return res.status(400).json({ message: "Invalid tier" });
      }

      // Update Stripe subscription with proration
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [{
          id: (await stripe.subscriptions.retrieve(user.stripeSubscriptionId)).items.data[0].id,
          price: newTier.stripePriceId,
        }],
        proration_behavior: 'always_invoice',
      });

      // Update membership tier
      await storage.updateUserMembership(user.id, { tierName: newTier.name as any });
      
      // Grant sticker credits for new tier
      const creditsToGrant = newTier.name === 'STANDARD' ? 25 : newTier.name === 'PRO' ? 100 : 0;
      if (creditsToGrant > 0) {
        await storage.addStickerCredits(user.id, creditsToGrant);
      }

      console.log(`✅ Upgraded ${user.email} to ${newTier.name} with ${creditsToGrant} credits`);

      res.json({ 
        success: true,
        tier: newTier.name,
        credits: creditsToGrant
      });
    } catch (error: any) {
      console.error('Error upgrading subscription:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Cart routes
  app.get("/api/cart", authenticateToken, async (req: any, res) => {
    try {
      const cartItems = await cartStorage.getUserCartItems(req.user.userId);
      res.json(cartItems);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/cart", authenticateToken, async (req: any, res) => {
    try {
      const cartData = insertCartItemSchema.parse(req.body);
      const cartItem = await cartStorage.addToCart({
        ...cartData,
        userId: req.user.userId
      });
      res.json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/cart/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const updated = await cartStorage.updateCartItemQuantity(id, req.user.userId, quantity);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cart/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      await cartStorage.removeFromCart(id, req.user.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cart", authenticateToken, async (req: any, res) => {
    try {
      await cartStorage.clearCart(req.user.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/cart/count", authenticateToken, async (req: any, res) => {
    try {
      const count = await cartStorage.getCartItemCount(req.user.userId);
      res.json({ count });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Orders routes
  app.post("/api/orders/calculate-price", authenticateToken, async (req, res) => {
    try {
      const { productType, size, quantity } = req.body;
      
      // Simple pricing logic for stickers
      const basePrice = size === 'small' ? 0.5 : size === 'medium' ? 1.0 : 1.5;
      const total = basePrice * quantity;
      res.json({ total: total.toFixed(2) });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/orders", authenticateToken, async (req: any, res) => {
    try {
      const orderData = insertOrderSchema.extend({
        stripePaymentIntentId: z.string().optional(),
        useCredits: z.boolean().optional()
      }).parse(req.body);
      
      // Check if using credits
      if (orderData.useCredits && orderData.productType === 'sticker') {
        const credits = await storage.getStickerCredits(req.user.userId);
        const quantity = orderData.quantity;
        
        if (credits >= quantity) {
          // Use credits, skip payment
          await storage.useStickerCredits(req.user.userId, quantity);
          console.log(`✅ Used ${quantity} sticker credits for order`);
        } else {
          return res.status(400).json({ 
            message: `Insufficient credits. You have ${credits} but need ${quantity}.` 
          });
        }
      }
      
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

  app.put("/api/orders/:id/status", authenticateToken, authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/orders", authenticateToken, authenticateAdmin, async (req: any, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe payment intent for one-time payments
  app.post("/api/create-payment-intent", authenticateToken, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      console.log('Creating payment intent for amount:', amountInCents, 'cents ($' + amount + ')');
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
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
