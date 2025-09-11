import 'dotenv/config';
import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { promises as fs } from 'fs';
import swaggerUi from 'swagger-ui-express';

// Import middleware and routes
import { corsOptions, sanitizeJsonInput, securityHeaders } from './middleware/auth.middleware';
import { correlationIdMiddleware, requestTimingMiddleware, requestLoggingMiddleware } from './middleware/correlation-id.middleware';
import { errorHandlerMiddleware, notFoundMiddleware } from './middleware/error-handler.middleware';
import ollamaRoutes from './routes/ollama';
import documentRoutes from './routes/documents';
import voiceRoutes from './routes/voice';
import swaggerSpecs from './config/swagger';
import { logWithContext } from './lib/logger.lib';

/**
 * Create Express app with proper middleware order
 * Following the CRITICAL middleware order pattern
 */
const app: Application = express();
const PORT = process.env['PORT'] || 3000;

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
const uploadsDir = path.join(process.cwd(), 'uploads');

async function ensureDirectories(): Promise<void> {
  try {
    await fs.access(logsDir);
  } catch (error) {
    await fs.mkdir(logsDir, { recursive: true });
    logWithContext('info', 'Created logs directory', 'app', { path: logsDir });
  }

  try {
    await fs.access(uploadsDir);
  } catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
    logWithContext('info', 'Created uploads directory', 'app', { path: uploadsDir });
  }
}

// Ensure directories exist
ensureDirectories().catch(error => {
  console.error('Failed to create directories:', error);
  process.exit(1);
});

// Security middleware (MUST be first)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS middleware
app.use(cors(corsOptions));

// Additional CORS headers for Railway deployment
app.use((req: Request, res: Response, next: NextFunction) => {
    // Set CORS headers for all responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, X-API-Key');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Compression middleware
app.use(compression());

// Security headers
app.use(securityHeaders);

// 1. Correlation ID (MUST be first custom middleware)
app.use(correlationIdMiddleware);

// 2. Request timing
app.use(requestTimingMiddleware);

// 3. Request logging
app.use(requestLoggingMiddleware);

// Body parsing middleware - increased limits for long text generation
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    (req as any).rawBody = buf;
  },
  strict: false,
  type: 'application/json'
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// JSON sanitization middleware - clean control characters from input
app.use(sanitizeJsonInput);

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Swagger JSON endpoint (MUST be before Swagger UI setup)
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ollama API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true,
    tryItOutEnabled: true
  }
}));

// API Routes
app.use('/api/ollama', ollamaRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/voice', voiceRoutes);

// Serve static files from the 'public' directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ollama API Controller',
    version: '1.0.0',
    endpoints: {
      voice_assistant_ui: '/index.html',
      health: '/api/ollama/health',
      chat: '/api/ollama/chat',
      generate: '/api/ollama/generate',
      models: '/api/ollama/models',
      stats: '/api/ollama/stats',
      documentUpload: '/api/documents/upload',
      documentSummarize: '/api/documents/{fileId}/summarize',
      documentQuestion: '/api/documents/{fileId}/question',
      documentList: '/api/documents',
      documentInfo: '/api/documents/{fileId}',
      voiceTranscribe: '/api/voice/transcribe',
      voiceProcess: '/api/voice/process',
      voiceSynthesize: '/api/voice/synthesize',
      voiceFormats: '/api/voice/formats'
    },
    documentation: '/api-docs',
    swagger_json: '/api-docs/swagger.json',
    timestamp: new Date().toISOString()
  });
});


// Legacy API Documentation endpoint (redirects to Swagger)
app.get('/api/docs', (req, res) => {
  res.redirect('/api-docs');
});

// 4. 404 handler (MUST be before error handler)
app.use(notFoundMiddleware);

// 5. Error handler (MUST be last)
app.use(errorHandlerMiddleware);

// Start server
app.listen(PORT, () => {
  logWithContext('info', 'Ollama API Controller started', 'app', {
    port: PORT,
    environment: process.env['NODE_ENV'] || 'development',
    ollamaUrl: process.env['OLLAMA_BASE_URL'],
    swaggerDocs: `http://localhost:${PORT}/api-docs`,
    healthCheck: `http://localhost:${PORT}/api/ollama/health`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logWithContext('info', 'SIGTERM received, shutting down gracefully', 'app');
  process.exit(0);
});

process.on('SIGINT', () => {
  logWithContext('info', 'SIGINT received, shutting down gracefully', 'app');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logWithContext('error', 'Uncaught Exception', 'app', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logWithContext('error', 'Unhandled Rejection', 'app', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

export default app;
