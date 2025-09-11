import winston from 'winston';
import path from 'path';

/**
 * Winston logger configuration with structured logging
 */
const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log')
    })
  ]
});

/**
 * Log with context including correlation ID
 * @param level - Log level
 * @param message - Log message
 * @param correlationId - Request correlation ID
 * @param meta - Additional metadata
 */
export const logWithContext = (
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  correlationId: string,
  meta?: Record<string, any>
): void => {
  logger.log(level, message, {
    correlationId,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

/**
 * Log operation start
 * @param message - Operation message
 * @param correlationId - Request correlation ID
 * @param operation - Operation name
 * @param meta - Additional metadata
 */
export const logOperation = (
  message: string,
  correlationId: string,
  operation: string,
  meta?: Record<string, any>
): void => {
  logger.info(message, {
    correlationId,
    operation,
    timestamp: new Date().toISOString(),
    type: 'operation',
    ...meta,
  });
};

/**
 * Log error with context
 * @param message - Error message
 * @param correlationId - Request correlation ID
 * @param error - Error object
 * @param meta - Additional metadata
 */
export const logError = (
  message: string,
  correlationId: string,
  error: Error,
  meta?: Record<string, any>
): void => {
  logger.error(message, {
    correlationId,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    timestamp: new Date().toISOString(),
    type: 'error',
    ...meta,
  });
};

export default logger;
