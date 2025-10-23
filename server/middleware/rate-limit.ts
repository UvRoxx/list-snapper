import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Create Redis client for rate limiting
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_RATE_LIMIT_DB || '1'), // Use different DB for rate limiting
});

// Default rate limit for general API endpoints
export const defaultRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:default:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Strict rate limit for authentication endpoints
export const authRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Rate limit for user registration
export const signupRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:signup:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  handler: (req, res) => {
    logger.warn(`Signup rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many registration attempts. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Rate limit for email operations
export const emailRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:email:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 emails per hour
  handler: (req, res) => {
    logger.warn(`Email rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Email rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Rate limit for PDF generation (resource intensive)
export const pdfRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:pdf:',
  }),
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 PDFs per 5 minutes
  handler: (req, res) => {
    logger.warn(`PDF generation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'PDF generation rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Rate limit for bulk operations
export const bulkOperationRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:bulk:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 bulk operations per hour
  handler: (req, res) => {
    logger.warn(`Bulk operation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Bulk operation rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Rate limit for Stripe operations
export const stripeRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:stripe:',
  }),
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 Stripe operations per 5 minutes
  handler: (req, res) => {
    logger.warn(`Stripe rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Payment rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Dynamic rate limit based on user role
export function createDynamicRateLimiter(windowMs: number, maxRequests: number, prefix: string) {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: `rate-limit:${prefix}:`,
    }),
    windowMs,
    max: (req: any) => {
      // Admins get higher limits
      if (req.user?.isAdmin) {
        return maxRequests * 2;
      }
      // Pro users get slightly higher limits
      if (req.user?.membership === 'pro') {
        return Math.floor(maxRequests * 1.5);
      }
      // Standard users get default limits
      return maxRequests;
    },
    keyGenerator: (req: any) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.id || req.ip;
    },
    handler: (req, res) => {
      logger.warn(`Dynamic rate limit exceeded for: ${req.user?.id || req.ip}`);
      res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: req.rateLimit?.resetTime,
      });
    },
  });
}

// Apply different rate limits based on endpoint patterns
export function applyRateLimits(app: any) {
  // Auth endpoints
  app.use('/api/login', authRateLimiter);
  app.use('/api/signup', signupRateLimiter);
  app.use('/api/auth/google', authRateLimiter);
  app.use('/api/auth/facebook', authRateLimiter);

  // Email endpoints
  app.use('/api/newsletter/subscribe', emailRateLimiter);
  app.use('/api/admin/orders/:id/email', emailRateLimiter);

  // PDF generation endpoints
  app.use('/api/admin/orders/:id/pdf', pdfRateLimiter);
  app.use('/api/admin/orders/:id/label', pdfRateLimiter);
  app.use('/api/admin/orders/:id/zip', pdfRateLimiter);

  // Bulk operations
  app.use('/api/admin/orders/bulk-export', bulkOperationRateLimiter);

  // Stripe endpoints
  app.use('/api/create-payment-intent', stripeRateLimiter);
  app.use('/api/create-subscription', stripeRateLimiter);
  app.use('/api/manage-billing', stripeRateLimiter);

  // Apply default rate limit to all other endpoints
  app.use('/api/', defaultRateLimiter);

  logger.info('Rate limiting middleware configured');
}