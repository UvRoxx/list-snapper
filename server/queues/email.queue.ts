import Bull from 'bull';
import { sendEmail, sendOrderStatusEmail, sendWelcomeEmail, sendNewsletterConfirmation } from '../email';
import { logger } from '../utils/logger';

// Create email queue with Redis connection
export const emailQueue = new Bull('email-queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 seconds
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep failed jobs for debugging
  },
});

// Email job types
export enum EmailJobType {
  ORDER_STATUS = 'order-status',
  WELCOME = 'welcome',
  NEWSLETTER = 'newsletter',
  CUSTOM = 'custom',
}

// Job data interfaces
interface OrderStatusEmailJob {
  type: EmailJobType.ORDER_STATUS;
  orderId: string;
  orderNumber: string;
  email: string;
  customerName?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

interface WelcomeEmailJob {
  type: EmailJobType.WELCOME;
  email: string;
  name?: string;
}

interface NewsletterEmailJob {
  type: EmailJobType.NEWSLETTER;
  email: string;
}

interface CustomEmailJob {
  type: EmailJobType.CUSTOM;
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type EmailJobData = OrderStatusEmailJob | WelcomeEmailJob | NewsletterEmailJob | CustomEmailJob;

// Process email jobs
emailQueue.process(async (job: Bull.Job<EmailJobData>) => {
  const { data } = job;
  logger.info(`Processing email job ${job.id}`, { type: data.type });

  try {
    let result: boolean;

    switch (data.type) {
      case EmailJobType.ORDER_STATUS:
        result = await sendOrderStatusEmail(
          data.orderId,
          data.orderNumber,
          data.email,
          data.customerName,
          data.status
        );
        break;

      case EmailJobType.WELCOME:
        result = await sendWelcomeEmail(data.email, data.name);
        break;

      case EmailJobType.NEWSLETTER:
        result = await sendNewsletterConfirmation(data.email);
        break;

      case EmailJobType.CUSTOM:
        result = await sendEmail(
          data.to,
          data.subject,
          data.html,
          data.text
        );
        break;

      default:
        throw new Error(`Unknown email job type`);
    }

    if (!result) {
      throw new Error('Email sending failed');
    }

    logger.info(`Email job ${job.id} completed successfully`);
    return { success: true, jobId: job.id };
  } catch (error) {
    logger.error(`Email job ${job.id} failed:`, error);
    throw error; // Will trigger retry
  }
});

// Event listeners for monitoring
emailQueue.on('completed', (job: Bull.Job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job: Bull.Job, error: Error) => {
  logger.error(`Email job ${job.id} failed after ${job.attemptsMade} attempts:`, error);

  // Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Sentry error tracking
    const Sentry = require('@sentry/node');
    Sentry.captureException(error, {
      tags: {
        jobId: job.id.toString(),
        jobType: job.data.type,
        attempts: job.attemptsMade,
      },
    });
  }
});

emailQueue.on('stalled', (job: Bull.Job) => {
  logger.warn(`Email job ${job.id} stalled and will be retried`);
});

// Queue management functions
export async function addEmailToQueue(data: EmailJobData, options?: Bull.JobOptions): Promise<Bull.Job> {
  const job = await emailQueue.add(data, {
    ...options,
    attempts: options?.attempts || 3,
    delay: options?.delay || 0,
  });

  logger.info(`Added email job ${job.id} to queue`, { type: data.type });
  return job;
}

export async function getQueueStatus() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  };
}

export async function retryFailedJobs() {
  const failedJobs = await emailQueue.getFailed();
  const retryPromises = failedJobs.map(job => job.retry());

  const results = await Promise.all(retryPromises);
  logger.info(`Retried ${results.length} failed email jobs`);

  return results.length;
}

export async function cleanQueue(grace: number = 3600000) {
  // Clean completed jobs older than grace period (default 1 hour)
  const cleaned = await emailQueue.clean(grace, 'completed');
  logger.info(`Cleaned ${cleaned.length} completed email jobs`);

  // Clean failed jobs older than 7 days
  const failedCleaned = await emailQueue.clean(grace * 24 * 7, 'failed');
  logger.info(`Cleaned ${failedCleaned.length} failed email jobs`);

  return {
    completed: cleaned.length,
    failed: failedCleaned.length,
  };
}

// Graceful shutdown
export async function closeEmailQueue() {
  await emailQueue.close();
  logger.info('Email queue closed gracefully');
}