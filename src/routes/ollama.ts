import { Router } from 'express';
import { OllamaController } from '../controllers/OllamaController';
import { rateLimitMiddleware, authenticateApiKey } from '../middleware/auth.middleware';
import { validate } from '../validators/schemas';
import { chatCompletionSchema, textCompletionSchema } from '../validators/schemas';
import { asyncHandler } from '../middleware/error-handler.middleware';

const router = Router();
const ollamaController = new OllamaController();

/**
 * Validation middleware factory
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 */
const validationMiddleware = (schema: any) => {
  return (req: any, res: any, next: any) => {
    try {
      req.body = validate(schema, req.body, req.correlationId);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * @swagger
 * tags:
 *   - name: Chat
 *     description: Chat completion endpoints
 *   - name: Text Generation
 *     description: Text completion endpoints
 *   - name: Models
 *     description: Model management endpoints
 *   - name: System
 *     description: System and health check endpoints
 */

/**
 * @swagger
 * /api/ollama/chat:
 *   post:
 *     summary: Generate chat completion
 *     description: Generate a chat completion using the specified model
 *     tags: [Chat]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               model:
 *                 type: string
 *                 default: llama2
 *                 description: Model name to use for completion
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [system, user, assistant]
 *                       description: Role of the message sender
 *                     content:
 *                       type: string
 *                       description: Content of the message
 *                     name:
 *                       type: string
 *                       description: Name of the message sender (optional)
 *                   required:
 *                     - role
 *                     - content
 *                 description: Array of messages for the conversation
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.7
 *                 description: Controls randomness in the response
 *               max_tokens:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 32768
 *                 default: 2048
 *                 description: Maximum number of tokens to generate
 *               stream:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to stream the response
 *     responses:
 *       200:
 *         description: Chat completion successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Response data from the model
 *                 correlationId:
 *                   type: string
 *                   description: Request correlation ID for tracking
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response timestamp
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Invalid API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post(
  '/chat',
  rateLimitMiddleware,
  authenticateApiKey,
  validationMiddleware(chatCompletionSchema),
  ollamaController.chatCompletion
);

/**
 * @swagger
 * /api/ollama/generate:
 *   post:
 *     summary: Generate text completion
 *     description: Generate a text completion using the specified model
 *     tags: [Text Generation]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               model:
 *                 type: string
 *                 default: llama2
 *                 description: Model name to use for completion
 *               prompt:
 *                 type: string
 *                 description: Text prompt for completion
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.7
 *                 description: Controls randomness in the response
 *               max_tokens:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 32768
 *                 default: 2048
 *                 description: Maximum number of tokens to generate
 *               stream:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to stream the response
 *     responses:
 *       200:
 *         description: Text completion successful
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Invalid API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post(
  '/generate',
  rateLimitMiddleware,
  authenticateApiKey,
  validationMiddleware(textCompletionSchema),
  ollamaController.textCompletion
);

/**
 * @swagger
 * /api/ollama/models:
 *   get:
 *     summary: List available models
 *     description: Get a list of all available Ollama models
 *     tags: [Models]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Models retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     models:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Model name
 *                           modified_at:
 *                             type: string
 *                             format: date-time
 *                             description: Last modification date
 *                           size:
 *                             type: integer
 *                             description: Model size in bytes
 *                     count:
 *                       type: integer
 *                       description: Number of available models
 *                 correlationId:
 *                   type: string
 *                   description: Request correlation ID for tracking
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response timestamp
 *       401:
 *         description: Unauthorized - Invalid API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get(
  '/models',
  rateLimitMiddleware,
  authenticateApiKey,
  ollamaController.listModels
);

/**
 * @swagger
 * /api/ollama/health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the Ollama service
 *     tags: [System]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       description: Health status
 *                     message:
 *                       type: string
 *                       description: Health status message
 *                 correlationId:
 *                   type: string
 *                   description: Request correlation ID for tracking
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response timestamp
 *       503:
 *         description: Service is unhealthy
 *       401:
 *         description: Unauthorized - Invalid API key
 *       429:
 *         description: Rate limit exceeded
 */
router.get(
  '/health',
  rateLimitMiddleware,
  authenticateApiKey,
  ollamaController.healthCheck
);

/**
 * @swagger
 * /api/ollama/stats:
 *   get:
 *     summary: Get system statistics
 *     description: Get system statistics and performance metrics
 *     tags: [System]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       description: System uptime in seconds
 *                     memory:
 *                       type: object
 *                       description: Memory usage statistics
 *                     node_version:
 *                       type: string
 *                       description: Node.js version
 *                     platform:
 *                       type: string
 *                       description: Operating system platform
 *                     ollama_url:
 *                       type: string
 *                       description: Ollama server URL
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Statistics timestamp
 *                 correlationId:
 *                   type: string
 *                   description: Request correlation ID for tracking
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response timestamp
 *       401:
 *         description: Unauthorized - Invalid API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get(
  '/stats',
  rateLimitMiddleware,
  authenticateApiKey,
  ollamaController.getStats
);

export default router;
