const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const winston = require('winston');
const OllamaService = require('./OllamaService');

/**
 * Document Service - Handles document upload, processing, and AI operations
 */
class DocumentService {
    constructor() {
        this.uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
        this.allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];
        this.allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.csv'];
        
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
                new winston.transports.File({ filename: 'logs/document.log' })
            ]
        });

        // Ensure uploads directory exists
        this.ensureUploadsDirectory();
    }

    /**
     * Ensure uploads directory exists
     */
    async ensureUploadsDirectory() {
        try {
            await fs.access(this.uploadsDir);
        } catch (error) {
            await fs.mkdir(this.uploadsDir, { recursive: true });
            this.logger.info('Created uploads directory', { path: this.uploadsDir });
        }
    }

    /**
     * Validate uploaded file
     * @param {Object} file - Multer file object
     * @returns {Object} Validation result
     */
    validateFile(file) {
        if (!file) {
            return { isValid: false, error: 'No file provided' };
        }

        if (file.size > this.maxFileSize) {
            return { 
                isValid: false, 
                error: `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB` 
            };
        }

        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (!this.allowedExtensions.includes(fileExtension)) {
            return { 
                isValid: false, 
                error: `File type not supported. Allowed types: ${this.allowedExtensions.join(', ')}` 
            };
        }

        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            return { 
                isValid: false, 
                error: `MIME type not supported. Allowed types: ${this.allowedMimeTypes.join(', ')}` 
            };
        }

        return { isValid: true };
    }

    /**
     * Save uploaded file to disk
     * @param {Object} file - Multer file object
     * @returns {Promise<Object>} File save result
     */
    async saveFile(file) {
        try {
            const fileId = uuidv4();
            const fileExtension = path.extname(file.originalname);
            const fileName = `${fileId}${fileExtension}`;
            const filePath = path.join(this.uploadsDir, fileName);

            await fs.writeFile(filePath, file.buffer);

            const fileInfo = {
                id: fileId,
                originalName: file.originalname,
                fileName: fileName,
                filePath: filePath,
                size: file.size,
                mimeType: file.mimetype,
                extension: fileExtension,
                uploadedAt: new Date().toISOString()
            };

            this.logger.info('File saved successfully', { fileInfo });
            return { success: true, fileInfo };

        } catch (error) {
            this.logger.error('Failed to save file', { error: error.message, stack: error.stack });
            throw new Error(`Failed to save file: ${error.message}`);
        }
    }

    /**
     * Extract text content from uploaded file
     * @param {Object} fileInfo - File information object
     * @returns {Promise<Object>} Text extraction result
     */
    async extractText(fileInfo) {
        try {
            const filePath = fileInfo.filePath;
            const extension = fileInfo.extension.toLowerCase();
            let text = '';

            switch (extension) {
                case '.pdf':
                    text = await this.extractFromPDF(filePath);
                    break;
                case '.docx':
                    text = await this.extractFromDocx(filePath);
                    break;
                case '.doc':
                    // For .doc files, we'll need a different library or conversion
                    text = await this.extractFromDoc(filePath);
                    break;
                case '.txt':
                    text = await this.extractFromTxt(filePath);
                    break;
                case '.xlsx':
                case '.xls':
                    text = await this.extractFromExcel(filePath);
                    break;
                case '.csv':
                    text = await this.extractFromCsv(filePath);
                    break;
                default:
                    throw new Error(`Unsupported file type: ${extension}`);
            }

            // Clean and normalize text
            text = this.cleanText(text);

            this.logger.info('Text extracted successfully', { 
                fileId: fileInfo.id, 
                textLength: text.length,
                extension,
                textPreview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
            });

            return { 
                success: true, 
                text: text,
                wordCount: this.countWords(text),
                characterCount: text.length
            };

        } catch (error) {
            this.logger.error('Failed to extract text', { 
                error: error.message, 
                stack: error.stack,
                fileId: fileInfo.id 
            });
            throw new Error(`Failed to extract text: ${error.message}`);
        }
    }

    /**
     * Extract text from PDF file
     * @param {string} filePath - Path to PDF file
     * @returns {Promise<string>} Extracted text
     */
    async extractFromPDF(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            
            // Check if file is empty
            if (dataBuffer.length === 0) {
                throw new Error('PDF file is empty');
            }
            
            // Check if file starts with PDF header
            const header = dataBuffer.toString('ascii', 0, 4);
            if (header !== '%PDF') {
                throw new Error('File does not appear to be a valid PDF');
            }
            
            const data = await pdfParse(dataBuffer, {
                // Add options to handle corrupted PDFs better
                max: 0, // No page limit
                version: 'v1.10.100' // Use specific version
            });
            
            if (!data.text || data.text.trim().length === 0) {
                throw new Error('No text content found in PDF. The PDF might be image-based or corrupted.');
            }
            
            return data.text;
            
        } catch (error) {
            // Provide more specific error messages
            if (error.message.includes('bad XRef entry')) {
                throw new Error('PDF file is corrupted or has invalid structure. Please try with a different PDF file.');
            } else if (error.message.includes('Invalid PDF')) {
                throw new Error('Invalid PDF format. Please ensure the file is a valid PDF document.');
            } else if (error.message.includes('password')) {
                throw new Error('PDF is password protected. Please provide an unprotected PDF file.');
            } else if (error.message.includes('No text content')) {
                throw new Error('PDF contains no extractable text. It might be image-based or scanned document.');
            } else {
                throw new Error(`PDF processing failed: ${error.message}`);
            }
        }
    }

    /**
     * Extract text from DOCX file
     * @param {string} filePath - Path to DOCX file
     * @returns {Promise<string>} Extracted text
     */
    async extractFromDocx(filePath) {
        const dataBuffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        return result.value;
    }

    /**
     * Extract text from DOC file (basic implementation)
     * @param {string} filePath - Path to DOC file
     * @returns {Promise<string>} Extracted text
     */
    async extractFromDoc(filePath) {
        // For .doc files, we'll read as binary and try to extract text
        // This is a basic implementation - for production, consider using antiword or similar
        const dataBuffer = await fs.readFile(filePath);
        // Convert buffer to string and clean up
        let text = dataBuffer.toString('utf8', 0, Math.min(dataBuffer.length, 10000));
        // Remove non-printable characters
        text = text.replace(/[^\x20-\x7E]/g, ' ');
        return text;
    }

    /**
     * Extract text from TXT file
     * @param {string} filePath - Path to TXT file
     * @returns {Promise<string>} Extracted text
     */
    async extractFromTxt(filePath) {
        return await fs.readFile(filePath, 'utf8');
    }

    /**
     * Extract text from Excel file
     * @param {string} filePath - Path to Excel file
     * @returns {Promise<string>} Extracted text
     */
    async extractFromExcel(filePath) {
        const workbook = XLSX.readFile(filePath);
        let text = '';

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_csv(worksheet);
            text += `Sheet: ${sheetName}\n${sheetData}\n\n`;
        });

        return text;
    }

    /**
     * Extract text from CSV file
     * @param {string} filePath - Path to CSV file
     * @returns {Promise<string>} Extracted text
     */
    async extractFromCsv(filePath) {
        const dataBuffer = await fs.readFile(filePath);
        return dataBuffer.toString('utf8');
    }

    /**
     * Clean and normalize extracted text
     * @param {string} text - Raw text
     * @returns {string} Cleaned text
     */
    cleanText(text) {
        return text
            .replace(/\r\n/g, '\n')           // Normalize line endings
            .replace(/\r/g, '\n')             // Handle old Mac line endings
            .replace(/\n{3,}/g, '\n\n')       // Reduce multiple newlines
            .replace(/[ \t]+/g, ' ')          // Normalize whitespace
            .trim();                          // Remove leading/trailing whitespace
    }

    /**
     * Count words in text
     * @param {string} text - Text to count
     * @returns {number} Word count
     */
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Summarize document using Ollama
     * @param {string} text - Document text
     * @param {Object} options - Summarization options
     * @returns {Promise<Object>} Summarization result
     */
    async summarizeDocument(text, options = {}) {
        try {
            const {
                model = process.env.DEFAULT_MODEL || 'llama2',
                maxLength = 500,
                temperature = 0.3,
                customPrompt = null
            } = options;

            // Log the input text for debugging
            this.logger.info('Summarization input', {
                originalTextLength: text.length,
                textPreview: text.substring(0, 300) + (text.length > 300 ? '...' : ''),
                model,
                maxLength
            });

            // Truncate text if too long (to avoid token limits)
            const maxTextLength = 8000; // Approximate token limit
            const truncatedText = text.length > maxTextLength 
                ? text.substring(0, maxTextLength) + '...' 
                : text;

            this.logger.info('Text truncation', {
                originalLength: text.length,
                truncatedLength: truncatedText.length,
                wasTruncated: text.length > maxTextLength
            });

            const prompt = customPrompt || this.generateSummaryPrompt(truncatedText, maxLength);
            
            this.logger.info('Generated prompt', {
                promptLength: prompt.length,
                promptPreview: prompt.substring(0, 500) + '...'
            });

            const result = await this.ollamaService.generateTextCompletion({
                model,
                prompt,
                temperature,
                max_tokens: Math.min(maxLength * 2, 2048) // Allow some buffer for response
            });

            // Check if the response looks like a chatbot response
            const response = result.data.response || '';
            if (response.toLowerCase().includes('please provide') || 
                response.toLowerCase().includes('i need') ||
                response.toLowerCase().includes('paste the text') ||
                response.toLowerCase().includes('ready when you are')) {
                
                this.logger.warn('Detected chatbot response, trying alternative prompt', {
                    response: response.substring(0, 100)
                });
                
                // Try a different prompt style
                const altPrompt = `Summarize this text in ${maxLength} words:\n\n${truncatedText}\n\nSummary:`;
                
                const altResult = await this.ollamaService.generateTextCompletion({
                    model,
                    prompt: altPrompt,
                    temperature,
                    max_tokens: Math.min(maxLength * 2, 2048)
                });
                
                return {
                    success: true,
                    summary: altResult.data.response,
                    model: altResult.model,
                    originalLength: text.length,
                    summaryLength: altResult.data.response?.length || 0,
                    usage: altResult.usage
                };
            }

            this.logger.info('Document summarized successfully', {
                model,
                originalLength: text.length,
                summaryLength: result.data.response?.length || 0
            });

            return {
                success: true,
                summary: result.data.response,
                model: result.model,
                originalLength: text.length,
                summaryLength: result.data.response?.length || 0,
                usage: result.usage
            };

        } catch (error) {
            this.logger.error('Failed to summarize document', {
                error: error.message,
                stack: error.stack,
                textLength: text.length
            });
            throw new Error(`Failed to summarize document: ${error.message}`);
        }
    }

    /**
     * Generate summary prompt
     * @param {string} text - Text to summarize
     * @param {number} maxLength - Maximum summary length
     * @returns {string} Generated prompt
     */
    generateSummaryPrompt(text, maxLength) {
        return `TASK: Summarize the following document in ${maxLength} words or less.

DOCUMENT:
${text}

SUMMARY:`;
    }

    /**
     * Answer questions about document using Ollama
     * @param {string} text - Document text
     * @param {string} question - Question to answer
     * @param {Object} options - Answer options
     * @returns {Promise<Object>} Answer result
     */
    async answerQuestion(text, question, options = {}) {
        try {
            const {
                model = process.env.DEFAULT_MODEL || 'llama2',
                temperature = 0.3,
                max_tokens = 1000
            } = options;

            // Truncate text if too long
            const maxTextLength = 6000; // Leave room for question and response
            const truncatedText = text.length > maxTextLength 
                ? text.substring(0, maxTextLength) + '...' 
                : text;

            const prompt = `You are a document analysis assistant. Your task is to answer questions based on the provided document content.

INSTRUCTIONS:
- Read the document content below
- Answer the question based on the information in the document
- If the answer cannot be found in the document, state "The answer cannot be found in the provided document"
- Provide a direct, factual answer
- Do not ask for more information or respond as a chatbot

DOCUMENT CONTENT:
${truncatedText}

QUESTION: ${question}

ANSWER:`;

            const result = await this.ollamaService.generateTextCompletion({
                model,
                prompt,
                temperature,
                max_tokens
            });

            this.logger.info('Question answered successfully', {
                model,
                questionLength: question.length,
                answerLength: result.data.response?.length || 0
            });

            return {
                success: true,
                answer: result.data.response,
                model: result.model,
                question: question,
                usage: result.usage
            };

        } catch (error) {
            this.logger.error('Failed to answer question', {
                error: error.message,
                stack: error.stack,
                question: question
            });
            throw new Error(`Failed to answer question: ${error.message}`);
        }
    }

    /**
     * Delete uploaded file
     * @param {string} fileId - File ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteFile(fileId) {
        try {
            const files = await fs.readdir(this.uploadsDir);
            const file = files.find(f => f.startsWith(fileId));
            
            if (!file) {
                return { success: false, error: 'File not found' };
            }

            const filePath = path.join(this.uploadsDir, file);
            await fs.unlink(filePath);

            this.logger.info('File deleted successfully', { fileId, fileName: file });
            return { success: true, message: 'File deleted successfully' };

        } catch (error) {
            this.logger.error('Failed to delete file', {
                error: error.message,
                stack: error.stack,
                fileId
            });
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Get file information
     * @param {string} fileId - File ID
     * @returns {Promise<Object>} File information
     */
    async getFileInfo(fileId) {
        try {
            const files = await fs.readdir(this.uploadsDir);
            const file = files.find(f => f.startsWith(fileId));
            
            if (!file) {
                return { success: false, error: 'File not found' };
            }

            const filePath = path.join(this.uploadsDir, file);
            const stats = await fs.stat(filePath);

            return {
                success: true,
                fileInfo: {
                    id: fileId,
                    fileName: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                }
            };

        } catch (error) {
            this.logger.error('Failed to get file info', {
                error: error.message,
                stack: error.stack,
                fileId
            });
            throw new Error(`Failed to get file info: ${error.message}`);
        }
    }
}

module.exports = DocumentService;
