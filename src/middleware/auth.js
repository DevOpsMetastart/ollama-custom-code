const rateLimit = require('express-rate-limit');
const { validateApiKey } = require('../validators/schemas');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * API Key authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key is required',
            message: 'Please provide an API key in the x-api-key header or Authorization header'
        });
    }

    if (!validateApiKey(apiKey)) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API key',
            message: 'The provided API key is invalid'
        });
    }

    next();
}

/**
 * Rate limiting middleware
 */
const rateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 / 60) // minutes
        });
    }
});

/**
 * CORS configuration
 */
const corsOptions = {
    origin: function (origin, callback) {
        // In production (Railway), allow all origins
        if (process.env.NODE_ENV === 'production') {
            return callback(null, true);
        }
        
        // In development, use allowed origins
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
        
        // In production, be more permissive with CORS for Railway deployment
        if (isProduction) {
            // Allow all origins in production for Railway deployment
            // You can restrict this later by setting specific ALLOWED_ORIGINS
            return callback(null, true);
        }
        
        // In development, use strict CORS
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-API-Key']
};

/**
 * JSON sanitization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function sanitizeJsonInput(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        // Sanitize string fields that might contain control characters
        const sanitizeString = (str) => {
            if (typeof str !== 'string') return str;
            
            // Replace control characters with safe alternatives
            return str
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \t, \n, \r
                .replace(/\r\n/g, '\n') // Normalize line endings
                .replace(/\r/g, '\n') // Convert \r to \n
                .replace(/\t/g, '    ') // Convert tabs to spaces
                .trim(); // Remove leading/trailing whitespace
        };

        // Recursively sanitize all string values
        const sanitizeObject = (obj) => {
            if (typeof obj === 'string') {
                return sanitizeString(obj);
            } else if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            } else if (obj && typeof obj === 'object') {
                const sanitized = {};
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
}

/**
 * Request logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    
    // Log request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
}

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    
    // Handle CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            error: 'CORS Error',
            message: 'Origin not allowed'
        });
    }
    
    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON',
            message: 'Request body contains invalid JSON. Please check for unescaped quotes, control characters, or malformed JSON syntax.',
            details: err.message
        });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: err.message,
            details: err.details
        });
    }
    
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Authentication Error',
            message: 'Invalid token'
        });
    }
    
    // Default error
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message || 'Something went wrong',
        timestamp: new Date().toISOString()
    });
}

/**
 * Security headers middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function securityHeaders(req, res, next) {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
}

module.exports = {
    authenticateApiKey,
    rateLimiter,
    corsOptions,
    sanitizeJsonInput,
    requestLogger,
    errorHandler,
    securityHeaders
};
