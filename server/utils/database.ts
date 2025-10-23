import { db } from '../storage';
import { logger } from './logger';
import * as Sentry from '@sentry/node';

// Transaction wrapper for database operations
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>,
  options: {
    retries?: number;
    isolationLevel?: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable';
  } = {}
): Promise<T> {
  const { retries = 3, isolationLevel = 'read committed' } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Start transaction with specified isolation level
      const result = await db.transaction(async (tx) => {
        // Set isolation level if specified
        if (isolationLevel !== 'read committed') {
          await tx.execute(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel.toUpperCase()}`);
        }

        // Execute the callback
        return await callback(tx);
      });

      // Success - log and return
      logger.debug(`Transaction completed successfully on attempt ${attempt}`);
      return result;
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error) || attempt === retries) {
        logger.error(`Transaction failed after ${attempt} attempts:`, error);

        // Track in Sentry
        Sentry.captureException(error, {
          tags: {
            type: 'database_transaction',
            attempts: attempt,
            isolationLevel,
          },
        });

        throw error;
      }

      // Log retry attempt
      logger.warn(`Transaction failed on attempt ${attempt}, retrying...`, {
        error: error.message,
        code: error.code,
      });

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Transaction failed');
}

// Check if database error is retryable
function isRetryableError(error: any): boolean {
  // PostgreSQL error codes that are retryable
  const retryableCodes = [
    '40001', // Serialization failure
    '40P01', // Deadlock detected
    '55P03', // Lock not available
    '57P01', // Admin shutdown
    '57P02', // Crash shutdown
    '57P03', // Cannot connect now
    '58000', // System error
    '58030', // IO error
    '08006', // Connection failure
    '08001', // Unable to establish connection
    '08004', // Connection rejected
  ];

  return retryableCodes.includes(error.code) ||
         error.message?.includes('connection') ||
         error.message?.includes('timeout');
}

// Batch operation wrapper with transaction
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T, tx: typeof db) => Promise<R>,
  options: {
    batchSize?: number;
    parallel?: boolean;
    continueOnError?: boolean;
  } = {}
): Promise<{ success: R[], failures: { item: T; error: Error }[] }> {
  const { batchSize = 100, parallel = false, continueOnError = false } = options;
  const results: R[] = [];
  const failures: { item: T; error: Error }[] = [];

  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, items.length));

    try {
      // Process batch in transaction
      const batchResults = await withTransaction(async (tx) => {
        if (parallel) {
          // Parallel processing within transaction
          return await Promise.all(
            batch.map(async (item) => {
              try {
                return await operation(item, tx);
              } catch (error: any) {
                if (!continueOnError) throw error;
                failures.push({ item, error });
                return null;
              }
            })
          );
        } else {
          // Sequential processing within transaction
          const sequentialResults: R[] = [];
          for (const item of batch) {
            try {
              const result = await operation(item, tx);
              sequentialResults.push(result);
            } catch (error: any) {
              if (!continueOnError) throw error;
              failures.push({ item, error });
            }
          }
          return sequentialResults;
        }
      });

      // Add non-null results
      results.push(...batchResults.filter((r): r is R => r !== null));

      logger.info(`Processed batch ${i / batchSize + 1}: ${batchResults.length} items`);
    } catch (error: any) {
      if (!continueOnError) {
        logger.error(`Batch operation failed at batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      // Mark all items in failed batch as failures
      batch.forEach(item => failures.push({ item, error }));
    }
  }

  // Log summary
  logger.info(`Batch operation completed: ${results.length} successes, ${failures.length} failures`);

  return { success: results, failures };
}

// Optimistic locking helper
export async function withOptimisticLock<T>(
  fetchFn: () => Promise<T & { version: number }>,
  updateFn: (data: T & { version: number }) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Fetch current data with version
      const currentData = await fetchFn();
      const originalVersion = currentData.version;

      // Perform update with version check
      const updatedData = await withTransaction(async (tx) => {
        // Check if version has changed
        const latestData = await fetchFn();
        if (latestData.version !== originalVersion) {
          throw new Error('Optimistic lock failed: data has been modified');
        }

        // Update with incremented version
        return await updateFn({ ...currentData, version: originalVersion + 1 });
      });

      return updatedData;
    } catch (error: any) {
      lastError = error;

      if (error.message?.includes('Optimistic lock failed') && attempt < maxRetries) {
        logger.warn(`Optimistic lock retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Optimistic lock failed after retries');
}

// Database connection pool monitoring
export async function monitorConnectionPool() {
  try {
    // Get pool statistics (this is DB specific, example for PostgreSQL)
    const poolStats = await db.execute('SELECT count(*) FROM pg_stat_activity');

    logger.info('Database connection pool stats:', poolStats);

    // Track in monitoring
    Sentry.addBreadcrumb({
      message: 'Database pool stats',
      category: 'database',
      data: poolStats,
    });

    return poolStats;
  } catch (error) {
    logger.error('Failed to get connection pool stats:', error);
    return null;
  }
}

// Cleanup old records utility
export async function cleanupOldRecords(
  table: string,
  dateColumn: string,
  daysToKeep: number,
  batchSize: number = 1000
): Promise<number> {
  let totalDeleted = 0;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    await withTransaction(async (tx) => {
      // Delete in batches to avoid locking issues
      let deleted = 0;
      do {
        const result = await tx.execute(`
          DELETE FROM ${table}
          WHERE ${dateColumn} < $1
          LIMIT $2
          RETURNING id
        `, [cutoffDate, batchSize]);

        deleted = result.rowCount || 0;
        totalDeleted += deleted;

        if (deleted > 0) {
          logger.info(`Deleted ${deleted} old records from ${table}`);
        }
      } while (deleted === batchSize);
    });

    logger.info(`Cleanup completed: deleted ${totalDeleted} records from ${table}`);
    return totalDeleted;
  } catch (error) {
    logger.error(`Failed to cleanup old records from ${table}:`, error);
    throw error;
  }
}

// Export transaction-aware storage methods
export function createTransactionalStorage(tx: typeof db) {
  // Return storage methods that use the transaction
  return {
    async createUser(data: any) {
      // Use tx instead of db
      return await tx.insert('users').values(data).returning();
    },
    async updateUser(id: string, data: any) {
      return await tx.update('users').set(data).where({ id }).returning();
    },
    // Add more methods as needed
  };
}