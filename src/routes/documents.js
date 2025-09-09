const express = require('express');
const multer = require('multer');
const DocumentController = require('../controllers/DocumentController');
const { authenticateApiKey, rateLimiter } = require('../middleware/auth');

const router = express.Router();
const documentController = new DocumentController();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
        files: 1 // Only one file at a time
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not supported`), false);
        }
    }
});

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload and process a document
 *     description: Upload a document file and extract its text content for AI processing
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload (PDF, DOC, DOCX, TXT, XLS, XLSX, CSV)
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: Document uploaded and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentUploadResponse'
 *       400:
 *         description: Bad request - file validation error
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
 *       413:
 *         description: File too large
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
router.post('/upload', authenticateApiKey, rateLimiter, upload.single('file'), documentController.uploadDocument.bind(documentController));

/**
 * @swagger
 * /api/documents/{fileId}/summarize:
 *   post:
 *     summary: Summarize uploaded document
 *     description: Generate an AI-powered summary of the uploaded document
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the uploaded document
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentSummaryRequest'
 *           example:
 *             model: "llama2"
 *             maxLength: 500
 *             temperature: 0.3
 *             customPrompt: "Please provide a detailed summary focusing on key findings and recommendations."
 *     responses:
 *       200:
 *         description: Document summarized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentSummaryResponse'
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
 *       404:
 *         description: Document not found
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
router.post('/:fileId/summarize', authenticateApiKey, rateLimiter, documentController.summarizeDocument.bind(documentController));

/**
 * @swagger
 * /api/documents/{fileId}/question:
 *   post:
 *     summary: Answer questions about uploaded document
 *     description: Ask questions about the content of an uploaded document and get AI-powered answers
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the uploaded document
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentQuestionRequest'
 *           example:
 *             question: "What are the main conclusions of this research?"
 *             model: "llama2"
 *             temperature: 0.3
 *             max_tokens: 1000
 *     responses:
 *       200:
 *         description: Question answered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentQuestionResponse'
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
 *       404:
 *         description: Document not found
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
router.post('/:fileId/question', authenticateApiKey, rateLimiter, documentController.answerQuestion.bind(documentController));

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List uploaded documents
 *     description: Get a list of all uploaded documents with their metadata
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of uploaded documents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentListResponse'
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
router.get('/', authenticateApiKey, documentController.listDocuments.bind(documentController));

/**
 * @swagger
 * /api/documents/{fileId}:
 *   get:
 *     summary: Get document information
 *     description: Get detailed information about a specific uploaded document
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the uploaded document
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Document information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentInfoResponse'
 *       401:
 *         description: Unauthorized - API key required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Document not found
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
router.get('/:fileId', authenticateApiKey, documentController.getDocumentInfo.bind(documentController));

/**
 * @swagger
 * /api/documents/{fileId}:
 *   delete:
 *     summary: Delete uploaded document
 *     description: Remove an uploaded document and its associated files
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the uploaded document
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentDeleteResponse'
 *       401:
 *         description: Unauthorized - API key required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Document not found
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
router.delete('/:fileId', authenticateApiKey, documentController.deleteDocument.bind(documentController));

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                error: 'File too large',
                message: `File size exceeds the maximum allowed size of ${process.env.MAX_FILE_SIZE || '10MB'}`
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files',
                message: 'Only one file can be uploaded at a time'
            });
        }
    }
    
    if (error.message.includes('File type')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid file type',
            message: error.message
        });
    }
    
    next(error);
});

module.exports = router;
