import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.stack || ''}`
  ),
);

// Define which transports to use
const transports = [
  // Console transport for development
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');

  transports.push(
    // Error log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    // Combined log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false, // Do not exit on handled exceptions
});

// Stream for Morgan HTTP logger
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for common logging patterns
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
};

export const logApiCall = (method: string, path: string, statusCode: number, duration: number) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, `${method} ${path} ${statusCode} - ${duration}ms`);
};

export const logDatabaseQuery = (query: string, duration: number, error?: Error) => {
  if (error) {
    logger.error(`Database query failed: ${query}`, {
      duration,
      error: error.message,
    });
  } else {
    logger.debug(`Database query: ${query} - ${duration}ms`);
  }
};

export const logEmailSent = (to: string, subject: string, success: boolean) => {
  if (success) {
    logger.info(`Email sent to ${to}: ${subject}`);
  } else {
    logger.error(`Failed to send email to ${to}: ${subject}`);
  }
};