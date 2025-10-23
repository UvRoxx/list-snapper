import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from '../queues/email.queue';
import type { Express } from 'express';

// Create Bull Board adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Create Bull Board with email queue
createBullBoard({
  queues: [
    new BullAdapter(emailQueue, {
      readOnlyMode: false, // Allow queue management from UI
      allowRetries: true,
      allowCompleted: true,
      description: 'Email Queue - Handles all outgoing emails',
    }),
  ],
  serverAdapter,
});

// Middleware to protect Bull Board
export function setupBullBoard(app: Express) {
  // Add authentication middleware for Bull Board
  app.use('/admin/queues', (req, res, next) => {
    // Check if user is authenticated and is admin
    const user = (req as any).user;

    if (!user || !user.isAdmin) {
      return res.status(403).json({
        error: 'Access denied. Admin privileges required.'
      });
    }

    next();
  });

  // Mount Bull Board
  app.use('/admin/queues', serverAdapter.getRouter());

  console.log('Bull Board mounted at /admin/queues');
}

export { serverAdapter };