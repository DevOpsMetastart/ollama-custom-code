import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/DocumentService';
import { ServiceContext } from '../types/common.types';
import { ApiResponse } from '../types/common.types';
import { logOperation } from '../lib/logger.lib';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { HTTP_STATUS } from '../constants/http-status.constants';

/**
 * Document Controller - Handles document processing endpoints
 * Follows the controller pattern with proper error handling
 */
export class DocumentController {
  private readonly documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * Upload and process document
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public uploadDocument = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    if (!req.file) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'No file uploaded',
          code: 'NO_FILE',
          statusCode: HTTP_STATUS.BAD_REQUEST,
          correlationId: req.correlationId
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    logOperation('Document upload request received', req.correlationId, 'uploadDocument', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const result = await this.documentService.extractTextFromFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      context
    );

    const response: ApiResponse = {
      success: true,
      data: {
        fileInfo: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        textInfo: {
          text: result.text,
          wordCount: result.wordCount,
          characterCount: result.characterCount
        }
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  });

  /**
   * Generate document summary
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public summarizeDocument = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { fileId } = req.params;
    
    if (!fileId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'File ID is required',
          code: 'MISSING_FILE_ID',
          statusCode: 400,
          correlationId: req.correlationId
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
      return;
    }
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Document summarization request received', req.correlationId, 'summarizeDocument', {
      fileId,
      options: req.body
    });

    // In a real implementation, you would retrieve the document text from storage
    // For now, we'll use a placeholder
    const documentText = 'This is a placeholder document text. In a real implementation, you would retrieve the actual document content from storage using the fileId.';

    const result = await this.documentService.generateSummary(
      documentText,
      fileId,
      req.body,
      context
    );

    const response: ApiResponse = {
      success: true,
      data: {
        fileId,
        summary: result.summary,
        model: result.model,
        originalLength: result.originalLength,
        summaryLength: result.summaryLength,
        usage: result.usage
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });

  /**
   * Answer question about document
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public answerQuestion = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { fileId } = req.params;
    
    if (!fileId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'File ID is required',
          code: 'MISSING_FILE_ID',
          statusCode: 400,
          correlationId: req.correlationId
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
      return;
    }
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Document Q&A request received', req.correlationId, 'answerQuestion', {
      fileId,
      question: req.body.question
    });

    // In a real implementation, you would retrieve the document text from storage
    const documentText = 'This is a placeholder document text. In a real implementation, you would retrieve the actual document content from storage using the fileId.';

    const result = await this.documentService.answerQuestion(
      documentText,
      req.body.question,
      fileId,
      req.body,
      context
    );

    const response: ApiResponse = {
      success: true,
      data: {
        fileId,
        question: req.body.question,
        answer: result.answer,
        model: result.model,
        usage: result.usage
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });

  /**
   * Get document information
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public getDocumentInfo = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { fileId } = req.params;
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Document info request received', req.correlationId, 'getDocumentInfo', {
      fileId
    });

    // In a real implementation, you would retrieve document metadata from storage
    const documentInfo = {
      fileId,
      name: 'Sample Document',
      size: 1024,
      uploadDate: new Date().toISOString(),
      wordCount: 150,
      characterCount: 800
    };

    const response: ApiResponse = {
      success: true,
      data: documentInfo,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });

  /**
   * Delete document
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public deleteDocument = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { fileId } = req.params;
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Document deletion request received', req.correlationId, 'deleteDocument', {
      fileId
    });

    // In a real implementation, you would delete the document from storage
    // For now, we'll just return success

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Document deleted successfully'
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });

  /**
   * List documents
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public listDocuments = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Document list request received', req.correlationId, 'listDocuments');

    // In a real implementation, you would retrieve documents from storage
    const documents = [
      {
        fileId: 'doc1',
        name: 'Sample Document 1',
        size: 1024,
        uploadDate: new Date().toISOString()
      },
      {
        fileId: 'doc2',
        name: 'Sample Document 2',
        size: 2048,
        uploadDate: new Date().toISOString()
      }
    ];

    const response: ApiResponse = {
      success: true,
      data: {
        documents,
        count: documents.length
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });
}
