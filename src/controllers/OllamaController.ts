import { Request, Response, NextFunction } from 'express';
import { OllamaService } from '../services/OllamaService';
import { ServiceContext } from '../types/common.types';
import { ApiResponse } from '../types/common.types';
import { logOperation } from '../lib/logger.lib';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { HTTP_STATUS } from '../constants/http-status.constants';

/**
 * Ollama Controller - Handles Ollama API endpoints
 * Follows the controller pattern with proper error handling
 */
export class OllamaController {
  private readonly ollamaService: OllamaService;

  constructor() {
    this.ollamaService = new OllamaService();
  }

  /**
   * Generate chat completion
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public chatCompletion = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Chat completion request received', req.correlationId, 'chatCompletion', {
      messageCount: req.body.messages?.length || 0,
      model: req.body.model
    });

    const result = await this.ollamaService.generateChatCompletion(req.body, context);

    const response: ApiResponse = {
      success: true,
      data: result.data,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });

  /**
   * Generate text completion
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public textCompletion = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Text completion request received', req.correlationId, 'textCompletion', {
      promptLength: req.body.prompt?.length || 0,
      model: req.body.model
    });

    const result = await this.ollamaService.generateTextCompletion(req.body, context);

    const response: ApiResponse = {
      success: true,
      data: result.data,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });

  /**
   * List available models
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public listModels = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('List models request received', req.correlationId, 'listModels');

    const result = await this.ollamaService.listModels(context);

    const response: ApiResponse = {
      success: true,
      data: {
        models: result.models,
        count: result.models.length
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });

  /**
   * Health check endpoint
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public healthCheck = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Health check request received', req.correlationId, 'healthCheck');

    const result = await this.ollamaService.healthCheck(context);

    const response: ApiResponse = {
      success: result.success,
      data: {
        status: result.status,
        message: result.message || result.error
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(response);
  });

  /**
   * Get system statistics
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public getStats = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Stats request received', req.correlationId, 'getStats');

    const stats = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version,
      platform: process.platform,
      ollama_url: process.env['OLLAMA_BASE_URL'],
      timestamp: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      data: stats,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });
}
