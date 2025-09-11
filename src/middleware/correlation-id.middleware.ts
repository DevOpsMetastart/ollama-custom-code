import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logWithContext } from '../lib/logger.lib';

/**
 * Extend Express Request interface to include correlation ID
 */
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      startTime?: number;
    }
  }
}

/**
 * Correlation ID middleware - generates unique ID for each request
 * MUST be first custom middleware in the chain
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate or extract correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  
  // Attach to request object
  req.correlationId = correlationId;
  req.startTime = Date.now();
  
  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Log request start
  logWithContext('info', 'Request started', correlationId, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  next();
};

/**
 * Request timing middleware - logs request completion
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requestTimingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (req.startTime) {
      const duration = Date.now() - req.startTime;
      
      logWithContext('info', 'Request completed', req.correlationId, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Request logging middleware - logs all requests
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requestLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logWithContext('debug', 'Request received', req.correlationId, {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined,
      'x-api-key': req.get('x-api-key') ? '[REDACTED]' : undefined
    },
    query: req.query,
    body: req.method !== 'GET' ? '[BODY]' : undefined
  });
  
  next();
};
