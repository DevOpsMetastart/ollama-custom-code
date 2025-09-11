import { Request, Response, NextFunction } from 'express';
import { AppError, convertToAppError, isOperationalError } from '../lib/errors.lib';
import { logError, logWithContext } from '../lib/logger.lib';
import { HTTP_STATUS } from '../constants/http-status.constants';

/**
 * Central error handling middleware
 * MUST be last middleware in the chain
 * @param error - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandlerMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Convert to AppError if not already
  const appError = convertToAppError(error, req.correlationId);
  
  // Log error
  logError('Request error occurred', req.correlationId, appError, {
    method: req.method,
    url: req.url,
    statusCode: appError.statusCode,
    isOperational: appError.isOperational
  });
  
  // Send error response
  const statusCode = appError.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  
  res.status(statusCode).json({
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      correlationId: req.correlationId
    },
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  });
};

/**
 * 404 Not Found middleware
 * MUST be before error handler
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logWithContext('warn', 'Route not found', req.correlationId, {
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      statusCode: HTTP_STATUS.NOT_FOUND,
      correlationId: req.correlationId
    },
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  });
};

/**
 * Async handler wrapper to catch async errors
 * @param fn - Async function to wrap
 * @returns Wrapped function
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
