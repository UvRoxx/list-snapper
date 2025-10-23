import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { Express } from 'express';
import { logger } from '../utils/logger';

// Initialize Sentry
export function initSentry(app: Express) {
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // Express integration
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      // Profiling
      nodeProfilingIntegration(),
      // Additional integrations
      new Sentry.Integrations.OnUncaughtException({
        onFatalError: (error) => {
          logger.error('Fatal error occurred:', error);
          process.exit(1);
        },
      }),
      new Sentry.Integrations.OnUnhandledRejection({
        mode: 'strict',
      }),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Filter out non-critical errors in development
      if (process.env.NODE_ENV !== 'production') {
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return null; // Don't send client errors in development
          }
        }
      }

      return event;
    },
  });

  // Request handler creates a separate execution context
  app.use(Sentry.Handlers.requestHandler());

  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  logger.info('Sentry monitoring initialized');
}

// Error handler must be before any other error middleware
export function setupSentryErrorHandler(app: Express) {
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 400
      if (error.status && error.status >= 400) {
        return true;
      }
      // Capture all errors without status code
      if (!error.status) {
        return true;
      }
      return false;
    },
  }));
}

// Custom error tracking functions
export function captureException(error: Error, context?: any) {
  logger.error('Capturing exception:', error, context);
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: any) {
  logger.info(`Capturing message (${level}):`, message, context);
  Sentry.captureMessage(message, level, {
    extra: context,
  });
}

// Track user context
export function setUserContext(user: any) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email,
    ip_address: user.lastIp,
    segment: user.membership || 'free',
  });
}

// Clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    op,
    name,
  });
}

// Custom breadcrumbs for debugging
export function addBreadcrumb(message: string, category: string, data?: any) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now(),
  });
}

// Monitor database queries
export function monitorDatabaseQuery(query: string, duration: number, error?: Error) {
  const span = Sentry.getCurrentHub().getScope()?.getSpan()?.startChild({
    op: 'db.query',
    description: query,
  });

  if (error) {
    span?.setStatus('internal_error');
    captureException(error, { query, duration });
  } else {
    span?.setStatus('ok');
  }

  span?.finish();

  // Add breadcrumb for debugging
  addBreadcrumb('Database query', 'database', {
    query,
    duration,
    success: !error,
  });
}

// Monitor external API calls
export function monitorApiCall(url: string, method: string, statusCode: number, duration: number) {
  const span = Sentry.getCurrentHub().getScope()?.getSpan()?.startChild({
    op: 'http.client',
    description: `${method} ${url}`,
  });

  span?.setHttpStatus(statusCode);
  span?.finish();

  // Add breadcrumb
  addBreadcrumb('API call', 'http', {
    url,
    method,
    statusCode,
    duration,
  });

  // Capture errors for failed API calls
  if (statusCode >= 500) {
    captureMessage(`External API error: ${method} ${url} returned ${statusCode}`, 'error', {
      url,
      method,
      statusCode,
      duration,
    });
  }
}

// Monitor email queue
export function monitorEmailQueue(jobId: string, status: 'success' | 'failure', error?: Error) {
  addBreadcrumb('Email job', 'email', {
    jobId,
    status,
    error: error?.message,
  });

  if (error) {
    captureException(error, {
      jobId,
      type: 'email_queue',
    });
  }
}

// Monitor PDF generation
export function monitorPdfGeneration(orderId: string, duration: number, error?: Error) {
  const span = Sentry.getCurrentHub().getScope()?.getSpan()?.startChild({
    op: 'pdf.generate',
    description: `Generate PDF for order ${orderId}`,
  });

  if (error) {
    span?.setStatus('internal_error');
    captureException(error, {
      orderId,
      duration,
      type: 'pdf_generation',
    });
  } else {
    span?.setStatus('ok');
  }

  span?.finish();
}

// Monitor bulk operations
export function monitorBulkOperation(operation: string, itemCount: number, duration: number, failures: number = 0) {
  addBreadcrumb('Bulk operation', 'bulk', {
    operation,
    itemCount,
    duration,
    failures,
    successRate: ((itemCount - failures) / itemCount * 100).toFixed(2) + '%',
  });

  if (failures > 0) {
    captureMessage(`Bulk operation had ${failures} failures`, 'warning', {
      operation,
      itemCount,
      failures,
      duration,
    });
  }
}

// Create middleware to track user in Sentry
export function sentryUserMiddleware(req: any, res: any, next: any) {
  if (req.user) {
    setUserContext(req.user);
  }
  next();
}