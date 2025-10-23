import type { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { initSentry, setupSentryErrorHandler } from '../monitoring/sentry';
import { applyRateLimits } from '../middleware/rate-limit';
import { setupBullBoard } from '../monitoring/bull-board';
import { logger, stream } from '../utils/logger';

// Production middleware configuration
export function configureProductionMiddleware(app: Express) {
  // Initialize Sentry first to catch all errors
  initSentry(app);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Compression
  app.use(compression({
    level: 6,
    threshold: 100 * 1024, // Only compress responses > 100KB
    filter: (req, res) => {
      // Don't compress server-sent events
      if (res.getHeader('Content-Type') === 'text/event-stream') {
        return false;
      }
      // Use compression's default filter function
      return compression.filter(req, res);
    },
  }));

  // HTTP request logging
  app.use(morgan('combined', {
    stream,
    skip: (req, res) => {
      // Skip health check logging
      return req.url === '/health' || req.url === '/ready';
    },
  }));

  // Apply rate limiting
  applyRateLimits(app);

  // Setup Bull Board for queue monitoring
  setupBullBoard(app);

  logger.info('Production middleware configured');
}

// Error handling middleware (should be last)
export function configureErrorHandling(app: Express) {
  // Sentry error handler
  setupSentryErrorHandler(app);

  // Custom error handler
  app.use((err: any, req: any, res: any, next: any) => {
    // Log error
    logger.error('Unhandled error:', err);

    // Set default error values
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Send error response
    res.status(status).json({
      error: message,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: err.stack,
      }),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
    });
  });
}

// Health check endpoints
export function configureHealthChecks(app: Express) {
  // Basic health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Detailed health check
  app.get('/ready', async (req, res) => {
    try {
      const checks = await performHealthChecks();
      const allHealthy = Object.values(checks).every((check: any) => check.status === 'ok');

      res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        checks,
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      });
    }
  });
}

// Perform health checks
async function performHealthChecks() {
  const checks: Record<string, any> = {};

  // Database check
  try {
    const { storage } = require('../storage');
    await storage.db.select().from('users').limit(1);
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: (error as Error).message,
    };
  }

  // Redis check
  try {
    const Redis = require('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
    await redis.ping();
    await redis.quit();
    checks.redis = { status: 'ok' };
  } catch (error) {
    checks.redis = {
      status: 'error',
      message: (error as Error).message,
    };
  }

  // Email queue check
  try {
    const { getQueueStatus } = require('../queues/email.queue');
    const queueStatus = await getQueueStatus();
    checks.emailQueue = {
      status: 'ok',
      ...queueStatus,
    };
  } catch (error) {
    checks.emailQueue = {
      status: 'error',
      message: (error as Error).message,
    };
  }

  // Memory check
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
  const heapPercentage = (heapUsedMB / heapTotalMB) * 100;

  checks.memory = {
    status: heapPercentage > 90 ? 'warning' : 'ok',
    heapUsedMB: Math.round(heapUsedMB),
    heapTotalMB: Math.round(heapTotalMB),
    percentage: Math.round(heapPercentage),
  };

  return checks;
}

// Graceful shutdown
export function setupGracefulShutdown(server: any) {
  let isShuttingDown = false;

  async function shutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info('Graceful shutdown initiated...');

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    try {
      // Close email queue
      const { closeEmailQueue } = require('../queues/email.queue');
      await closeEmailQueue();
      logger.info('Email queue closed');

      // Close database connections
      const { storage } = require('../storage');
      await storage.db.destroy();
      logger.info('Database connections closed');

      // Flush Sentry events
      const Sentry = require('@sentry/node');
      await Sentry.close(2000);
      logger.info('Sentry events flushed');

      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  // Handle shutdown signals
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    shutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    shutdown();
  });
}