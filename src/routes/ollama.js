const express = require('express');
const OllamaController = require('../controllers/OllamaController');
const { authenticateApiKey, rateLimiter } = require('../middleware/auth');

const router = express.Router();
const ollamaController = new OllamaController();

/**
 * @swagger
 * /api/ollama/chat:
 *   post:
 *     summary: Generate chat completion
 *     description: Generate conversational AI responses using the specified model
 *     tags: [Chat]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatCompletionRequest'
 *           example:
 *             model: "llama2"
 *             messages:
 *               - role: "user"
 *                 content: "Hello, how are you?"
 *             temperature: 0.7
 *             max_tokens: 2048
 *             stream: false
 *     responses:
 *       200:
 *         description: Successful chat completion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatCompletionResponse'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - API key required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/chat', authenticateApiKey, rateLimiter, ollamaController.chatCompletion.bind(ollamaController));

/**
 * @swagger
 * /api/ollama/generate:
 *   post:
 *     summary: Generate text completion
 *     description: Generate text completions from prompts using the specified model
 *     tags: [Text Generation]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TextCompletionRequest'
 *           example:
 *             model: "llama2"
 *             prompt: "Write a short story about a robot"
 *             temperature: 0.7
 *             max_tokens: 2048
 *             stream: false
 *     responses:
 *       200:
 *         description: Successful text completion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TextCompletionResponse'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - API key required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/generate', authenticateApiKey, rateLimiter, ollamaController.textCompletion.bind(ollamaController));

/**
 * @swagger
 * /api/ollama/models:
 *   get:
 *     summary: List available models
 *     description: Get a list of all available models on the Ollama server
 *     tags: [Models]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of available models
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelsResponse'
 *       401:
 *         description: Unauthorized - API key required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/models', authenticateApiKey, ollamaController.listModels.bind(ollamaController));

/**
 * @swagger
 * /api/ollama/models/{model}:
 *   get:
 *     summary: Get model information
 *     description: Get detailed information about a specific model
 *     tags: [Models]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: model
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the model
 *         example: "llama2"
 *     responses:
 *       200:
 *         description: Model information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelInfoResponse'
 *       400:
 *         description: Bad request - invalid model name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - API key required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Model not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/models/:model', authenticateApiKey, ollamaController.getModelInfo.bind(ollamaController));

/**
 * @swagger
 * /api/ollama/models/pull:
 *   post:
 *     summary: Pull a model from Ollama library
 *     description: Download and install a model from the Ollama library
 *     tags: [Models]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModelOperationRequest'
 *           example:
 *             model: "llama2"
 *     responses:
 *       200:
 *         description: Model pulled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelOperationResponse'
 *       400:
 *         description: Bad request - invalid model name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - API key required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/models/pull', authenticateApiKey, ollamaController.pullModel.bind(ollamaController));

/**
 * @swagger
 * /api/ollama/models/delete:
 *   delete:
 *     summary: Delete a model
 *     description: Remove a model from the Ollama server
 *     tags: [Models]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModelOperationRequest'
 *           example:
 *             model: "llama2"
 *     responses:
 *       200:
 *         description: Model deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelOperationResponse'
 *       400:
 *         description: Bad request - invalid model name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - API key required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Model not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/models/delete', authenticateApiKey, ollamaController.deleteModel.bind(ollamaController));

/**
 * @swagger
 * /api/ollama/health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the Ollama server
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: Server is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/health', ollamaController.healthCheck.bind(ollamaController));

/**
 * @swagger
 * /api/ollama/stats:
 *   get:
 *     summary: Get API statistics
 *     description: Get system statistics and performance metrics
 *     tags: [System]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: System statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatsResponse'
 *       401:
 *         description: Unauthorized - API key required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', authenticateApiKey, ollamaController.getStats.bind(ollamaController));

module.exports = router;
