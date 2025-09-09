require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');

// Import middleware and routes
const { corsOptions, requestLogger, errorHandler, securityHeaders } = require('./middleware/auth');
const ollamaRoutes = require('./routes/ollama');
const documentRoutes = require('./routes/documents');
const swaggerSpecs = require('./config/swagger');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Security middleware
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
app.use((req, res, next) => {
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

// Request logging
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

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

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Ollama API Controller',
        version: '1.0.0',
        endpoints: {
            health: '/api/ollama/health',
            chat: '/api/ollama/chat',
            generate: '/api/ollama/generate',
            models: '/api/ollama/models',
            stats: '/api/ollama/stats',
            documentUpload: '/api/documents/upload',
            documentSummarize: '/api/documents/{fileId}/summarize',
            documentQuestion: '/api/documents/{fileId}/question',
            documentList: '/api/documents',
            documentInfo: '/api/documents/{fileId}'
        },
        documentation: '/api-docs',
        swagger_json: '/api-docs/swagger.json',
        timestamp: new Date().toISOString()
    });
});

// Swagger JSON endpoint
app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpecs);
});

// Legacy API Documentation endpoint (redirects to Swagger)
app.get('/api/docs', (req, res) => {
    res.redirect('/api-docs');
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        available_endpoints: [
            'GET /',
            'GET /api-docs',
            'GET /api-docs/swagger.json',
            'GET /api/ollama/health',
            'POST /api/ollama/chat',
            'POST /api/ollama/generate',
            'GET /api/ollama/models',
            'GET /api/ollama/models/:model',
            'POST /api/ollama/models/pull',
            'DELETE /api/ollama/models/delete',
            'GET /api/ollama/stats',
            'POST /api/documents/upload',
            'POST /api/documents/:fileId/summarize',
            'POST /api/documents/:fileId/question',
            'GET /api/documents',
            'GET /api/documents/:fileId',
            'DELETE /api/documents/:fileId'
        ]
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Ollama API Controller running on port ${PORT}`);
    console.log(`📖 Swagger Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`📄 Swagger JSON: http://localhost:${PORT}/api-docs/swagger.json`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/ollama/health`);
    console.log(`🔗 Ollama Server: ${process.env.OLLAMA_BASE_URL}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = app;
