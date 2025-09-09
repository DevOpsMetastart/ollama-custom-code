const DocumentService = require('../services/DocumentService');
const { validate, schemas } = require('../validators/schemas');
const winston = require('winston');
const path = require('path');

/**
 * Document API Controller - Handles document upload, processing, and AI operations
 */
class DocumentController {
    constructor() {
        this.documentService = new DocumentService();
        
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
                new winston.transports.File({ filename: 'logs/document-api.log' })
            ]
        });
    }

    /**
     * Upload and process document
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async uploadDocument(req, res) {
        try {
            // Validate file
            const validation = this.documentService.validateFile(req.file);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'File validation failed',
                    message: validation.error
                });
            }

            const startTime = Date.now();
            
            // Save file
            const saveResult = await this.documentService.saveFile(req.file);
            if (!saveResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to save file',
                    message: saveResult.error
                });
            }

            // Extract text
            const extractResult = await this.documentService.extractText(saveResult.fileInfo);
            if (!extractResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to extract text',
                    message: extractResult.error
                });
            }

            const processingTime = Date.now() - startTime;

            this.logger.info('Document uploaded and processed successfully', {
                fileId: saveResult.fileInfo.id,
                originalName: saveResult.fileInfo.originalName,
                textLength: extractResult.text.length,
                wordCount: extractResult.wordCount,
                processingTime
            });

            res.json({
                success: true,
                data: {
                    fileInfo: saveResult.fileInfo,
                    textInfo: {
                        text: extractResult.text,
                        wordCount: extractResult.wordCount,
                        characterCount: extractResult.characterCount
                    }
                },
                processing_time_ms: processingTime,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Document upload failed', {
                error: error.message,
                stack: error.stack,
                fileName: req.file?.originalname
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Summarize uploaded document
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async summarizeDocument(req, res) {
        try {
            const { fileId } = req.params;
            
            // Validate request body
            const validation = validate(req.body, schemas.documentSummary);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            const startTime = Date.now();

            // Get file info and extract text
            const fileInfo = await this.documentService.getFileInfo(fileId);
            if (!fileInfo.success) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found',
                    message: fileInfo.error
                });
            }

            // Re-extract text (in a real app, you might cache this)
            const fullFilePath = path.join(this.documentService.uploadsDir, fileInfo.fileInfo.fileName);
            const extractResult = await this.documentService.extractText({
                id: fileId,
                filePath: fullFilePath,
                extension: '.' + fileInfo.fileInfo.fileName.split('.').pop()
            });

            if (!extractResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to extract text from file',
                    message: extractResult.error
                });
            }

            // Summarize document
            const summaryResult = await this.documentService.summarizeDocument(
                extractResult.text,
                validation.data
            );

            const processingTime = Date.now() - startTime;

            this.logger.info('Document summarized successfully', {
                fileId,
                model: validation.data.model,
                originalLength: extractResult.text.length,
                summaryLength: summaryResult.summary.length,
                processingTime
            });

            res.json({
                success: true,
                data: {
                    fileId,
                    summary: summaryResult.summary,
                    model: summaryResult.model,
                    originalLength: summaryResult.originalLength,
                    summaryLength: summaryResult.summaryLength,
                    usage: summaryResult.usage
                },
                processing_time_ms: processingTime,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Document summarization failed', {
                error: error.message,
                stack: error.stack,
                fileId: req.params.fileId
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Answer questions about uploaded document
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async answerQuestion(req, res) {
        try {
            const { fileId } = req.params;
            
            // Validate request body
            const validation = validate(req.body, schemas.documentQuestion);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            const startTime = Date.now();

            // Get file info and extract text
            const fileInfo = await this.documentService.getFileInfo(fileId);
            if (!fileInfo.success) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found',
                    message: fileInfo.error
                });
            }

            // Re-extract text
            const fullFilePath = path.join(this.documentService.uploadsDir, fileInfo.fileInfo.fileName);
            const extractResult = await this.documentService.extractText({
                id: fileId,
                filePath: fullFilePath,
                extension: '.' + fileInfo.fileInfo.fileName.split('.').pop()
            });

            if (!extractResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to extract text from file',
                    message: extractResult.error
                });
            }

            // Answer question
            const answerResult = await this.documentService.answerQuestion(
                extractResult.text,
                validation.data.question,
                validation.data
            );

            const processingTime = Date.now() - startTime;

            this.logger.info('Question answered successfully', {
                fileId,
                question: validation.data.question,
                model: validation.data.model,
                answerLength: answerResult.answer.length,
                processingTime
            });

            res.json({
                success: true,
                data: {
                    fileId,
                    question: answerResult.question,
                    answer: answerResult.answer,
                    model: answerResult.model,
                    usage: answerResult.usage
                },
                processing_time_ms: processingTime,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Question answering failed', {
                error: error.message,
                stack: error.stack,
                fileId: req.params.fileId,
                question: req.body.question
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get document information
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getDocumentInfo(req, res) {
        try {
            const { fileId } = req.params;

            const fileInfo = await this.documentService.getFileInfo(fileId);
            if (!fileInfo.success) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found',
                    message: fileInfo.error
                });
            }

            this.logger.info('Document info retrieved successfully', {
                fileId
            });

            res.json({
                success: true,
                data: fileInfo.fileInfo,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Failed to get document info', {
                error: error.message,
                stack: error.stack,
                fileId: req.params.fileId
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Delete uploaded document
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteDocument(req, res) {
        try {
            const { fileId } = req.params;

            const deleteResult = await this.documentService.deleteFile(fileId);
            if (!deleteResult.success) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found',
                    message: deleteResult.error
                });
            }

            this.logger.info('Document deleted successfully', {
                fileId
            });

            res.json({
                success: true,
                message: deleteResult.message,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Failed to delete document', {
                error: error.message,
                stack: error.stack,
                fileId: req.params.fileId
            });

            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * List uploaded documents
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async listDocuments(req, res) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

            const files = await fs.readdir(uploadsDir);
            const documentList = [];

            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                const stats = await fs.stat(filePath);
                
                documentList.push({
                    id: file.split('.')[0], // Remove extension to get ID
                    fileName: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                });
            }

            this.logger.info('Documents listed successfully', {
                count: documentList.length
            });

            res.json({
                success: true,
                data: {
                    documents: documentList,
                    count: documentList.length
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('Failed to list documents', {
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

module.exports = DocumentController;
