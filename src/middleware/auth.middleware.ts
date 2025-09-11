import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticationError, RateLimitError } from '../lib/errors.lib';
import { logWithContext } from '../lib/logger.lib';

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      correlationId: 'rate-limit'
    },
    correlationId: 'rate-limit',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const retryAfter = Math.ceil(parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000') / 1000 / 60); // minutes
    
    logWithContext('warn', 'Rate limit exceeded', req.correlationId, {
      ip: req.ip,
      retryAfter: `${retryAfter} minutes`
    });

    res.status(429).json({
      success: false,
      error: {
        message: `Rate limit exceeded. Try again in ${retryAfter} minutes`,
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        correlationId: req.correlationId
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * API key authentication middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logWithContext('warn', 'API key missing', req.correlationId, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(401).json({
      success: false,
      error: {
        message: 'API key required',
        code: 'AUTHENTICATION_ERROR',
        statusCode: 401,
        correlationId: req.correlationId
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
    return;
  }

  const expectedKey = process.env['API_KEY'];
  if (apiKey !== expectedKey) {
    logWithContext('warn', 'Invalid API key', req.correlationId, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid API key',
        code: 'AUTHENTICATION_ERROR',
        statusCode: 401,
        correlationId: req.correlationId
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
    return;
  }

  logWithContext('debug', 'API key authenticated', req.correlationId, {
    ip: req.ip
  });

  next();
};

/**
 * CORS options configuration
 */
export const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
};

/**
 * Security headers middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

/**
 * JSON sanitization middleware - clean control characters from input
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const sanitizeJsonInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // Remove control characters except newlines and tabs
        return obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    req.body = sanitizeObject(req.body);
  }
  next();
};
