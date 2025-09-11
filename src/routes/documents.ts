import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from '../controllers/DocumentController';
import { rateLimitMiddleware, authenticateApiKey } from '../middleware/auth.middleware';
import { validate } from '../validators/schemas';
import { documentUploadSchema, documentSummarySchema, documentQuestionSchema } from '../validators/schemas';

const router = Router();
const documentController = new DocumentController();

/**
 * Configure multer for file uploads
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, and text files are allowed.'));
    }
  }
});

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
 *   - name: Documents
 *     description: Document processing endpoints
 */

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload and process document
 *     description: Upload a document and extract text content
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload (PDF, Word, Excel, or text)
 *     responses:
 *       201:
 *         description: Document uploaded and processed successfully
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
 *                     fileInfo:
 *                       type: object
 *                       properties:
 *                         originalName:
 *                           type: string
 *                           description: Original filename
 *                         filename:
 *                           type: string
 *                           description: Stored filename
 *                         size:
 *                           type: integer
 *                           description: File size in bytes
 *                         mimetype:
 *                           type: string
 *                           description: File MIME type
 *                     textInfo:
 *                       type: object
 *                       properties:
 *                         text:
 *                           type: string
 *                           description: Extracted text content
 *                         wordCount:
 *                           type: integer
 *                           description: Number of words in the text
 *                         characterCount:
 *                           type: integer
 *                           description: Number of characters in the text
 *                 correlationId:
 *                   type: string
 *                   description: Request correlation ID for tracking
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response timestamp
 *       400:
 *         description: Bad request - Invalid file or missing file
 *       401:
 *         description: Unauthorized - Invalid API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post(
  '/upload',
  rateLimitMiddleware,
  authenticateApiKey,
  upload.single('document'),
  validationMiddleware(documentUploadSchema),
  documentController.uploadDocument
);

/**
 * @swagger
 * /api/documents/{fileId}/summarize:
 *   post:
 *     summary: Generate document summary
 *     description: Generate a summary of the uploaded document using AI
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document file ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 default: llama2
 *                 description: Model name to use for summarization
 *               maxLength:
 *                 type: integer
 *                 minimum: 50
 *                 maximum: 2000
 *                 default: 500
 *                 description: Maximum length of the summary
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.3
 *                 description: Controls randomness in the response
 *               customPrompt:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Custom prompt for summarization
 *     responses:
 *       200:
 *         description: Document summary generated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Document not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:fileId/summarize',
  rateLimitMiddleware,
  authenticateApiKey,
  validationMiddleware(documentSummarySchema),
  documentController.summarizeDocument
);

/**
 * @swagger
 * /api/documents/{fileId}/question:
 *   post:
 *     summary: Answer question about document
 *     description: Ask a question about the uploaded document and get an AI-generated answer
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document file ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Question about the document
 *               model:
 *                 type: string
 *                 default: llama2
 *                 description: Model name to use for answering
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.3
 *                 description: Controls randomness in the response
 *               max_tokens:
 *                 type: integer
 *                 minimum: 50
 *                 maximum: 2000
 *                 default: 1000
 *                 description: Maximum number of tokens to generate
 *     responses:
 *       200:
 *         description: Question answered successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Document not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:fileId/question',
  rateLimitMiddleware,
  authenticateApiKey,
  validationMiddleware(documentQuestionSchema),
  documentController.answerQuestion
);

/**
 * @swagger
 * /api/documents/{fileId}:
 *   get:
 *     summary: Get document information
 *     description: Get information about a specific document
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document file ID
 *     responses:
 *       200:
 *         description: Document information retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Document not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete document
 *     description: Delete a specific document
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document file ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Document not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:fileId',
  rateLimitMiddleware,
  authenticateApiKey,
  documentController.getDocumentInfo
);

router.delete(
  '/:fileId',
  rateLimitMiddleware,
  authenticateApiKey,
  documentController.deleteDocument
);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List documents
 *     description: Get a list of all uploaded documents
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Documents list retrieved successfully
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
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fileId:
 *                             type: string
 *                             description: Document file ID
 *                           name:
 *                             type: string
 *                             description: Document name
 *                           size:
 *                             type: integer
 *                             description: Document size in bytes
 *                           uploadDate:
 *                             type: string
 *                             format: date-time
 *                             description: Upload date
 *                     count:
 *                       type: integer
 *                       description: Number of documents
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
  '/',
  rateLimitMiddleware,
  authenticateApiKey,
  documentController.listDocuments
);

export default router;
