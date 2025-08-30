const OllamaService = require('../services/OllamaService');
const { validate, schemas } = require('../validators/schemas');
const winston = require('winston');

/**
 * Ollama API Controller - Handles all Ollama-related API endpoints
 */
class OllamaController {
    constructor() {
        this.ollamaService = new OllamaService();
        
        // Setup logging
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/api.log' })
            ]
        });
    }

    /**
     * Generate chat completion
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async chatCompletion(req, res) {
        try {
            // Validate request body
            const validation = validate(req.body, schemas.chatCompletion);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            const startTime = Date.now();
            const result = await this.ollamaService.generateChatCompletion(validation.data);
            const processingTime = Date.now() - startTime;

            this.logger.info('Chat completion successful', {
                model: validation.data.model,
                messageCount: validation.data.messages.length,
                processingTime,
                usage: result.usage
            });

            res.json({
                success: true,
                data: result.data,
                model: result.model,
                usage: result.usage,
                processing_time_ms: processingTime,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Chat completion failed', {
                error: error.message,
                stack: error.stack,
                body: req.body
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Generate text completion
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async textCompletion(req, res) {
        try {
            // Validate request body
            const validation = validate(req.body, schemas.textCompletion);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            const startTime = Date.now();
            const result = await this.ollamaService.generateTextCompletion(validation.data);
            const processingTime = Date.now() - startTime;

            this.logger.info('Text completion successful', {
                model: validation.data.model,
                promptLength: validation.data.prompt.length,
                processingTime,
                usage: result.usage
            });

            res.json({
                success: true,
                data: result.data,
                model: result.model,
                usage: result.usage,
                processing_time_ms: processingTime,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Text completion failed', {
                error: error.message,
                stack: error.stack,
                body: req.body
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * List available models
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async listModels(req, res) {
        try {
            const result = await this.ollamaService.listModels();

            this.logger.info('Models listed successfully', {
                modelCount: result.models.length
            });

            res.json({
                success: true,
                models: result.models,
                count: result.models.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Failed to list models', {
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get model information
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getModelInfo(req, res) {
        try {
            const { model } = req.params;
            
            // Validate model parameter
            const validation = validate({ model }, schemas.modelName);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            const result = await this.ollamaService.getModelInfo(model);

            this.logger.info('Model info retrieved successfully', {
                model
            });

            res.json({
                success: true,
                model: result.model,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Failed to get model info', {
                error: error.message,
                stack: error.stack,
                model: req.params.model
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Pull a model
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async pullModel(req, res) {
        try {
            const { model } = req.body;
            
            // Validate request body
            const validation = validate({ model }, schemas.modelName);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            const result = await this.ollamaService.pullModel(model);

            this.logger.info('Model pulled successfully', {
                model
            });

            res.json({
                success: true,
                message: `Model ${model} pulled successfully`,
                data: result.data,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Failed to pull model', {
                error: error.message,
                stack: error.stack,
                body: req.body
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Delete a model
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteModel(req, res) {
        try {
            const { model } = req.body;
            
            // Validate request body
            const validation = validate({ model }, schemas.modelName);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            const result = await this.ollamaService.deleteModel(model);

            this.logger.info('Model deleted successfully', {
                model
            });

            res.json({
                success: true,
                message: `Model ${model} deleted successfully`,
                data: result.data,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Failed to delete model', {
                error: error.message,
                stack: error.stack,
                body: req.body
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Health check endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async healthCheck(req, res) {
        try {
            const result = await this.ollamaService.healthCheck();

            if (result.success) {
                this.logger.info('Health check passed');
                res.json({
                    success: true,
                    status: 'healthy',
                    message: result.message,
                    timestamp: new Date().toISOString()
                });
            } else {
                this.logger.warn('Health check failed', {
                    error: result.error
                });
                res.status(503).json({
                    success: false,
                    status: 'unhealthy',
                    error: result.error,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            this.logger.error('Health check error', {
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get API statistics
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getStats(req, res) {
        try {
            // This is a placeholder for statistics
            // You can implement actual statistics tracking here
            const stats = {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                node_version: process.version,
                platform: process.platform,
                ollama_url: process.env.OLLAMA_BASE_URL
            };

            res.json({
                success: true,
                stats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Failed to get stats', {
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = OllamaController;
