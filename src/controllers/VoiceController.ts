import { Request, Response, NextFunction } from 'express';
import { VoiceService } from '../services/VoiceService';
import { ServiceContext } from '../types/common.types';
import { ApiResponse } from '../types/common.types';
import { logOperation } from '../lib/logger.lib';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { HTTP_STATUS } from '../constants/http-status.constants';

/**
 * Voice Controller - Handles voice processing endpoints
 * Follows the controller pattern with proper error handling
 */
export class VoiceController {
  private readonly voiceService: VoiceService;

  constructor() {
    this.voiceService = new VoiceService();
  }

  /**
   * Transcribe audio file
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public transcribeAudio = asyncHandler(async (
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
          message: 'No audio file uploaded',
          code: 'NO_FILE',
          statusCode: HTTP_STATUS.BAD_REQUEST,
          correlationId: req.correlationId
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    logOperation('Audio transcription request received', req.correlationId, 'transcribeAudio', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // In a real implementation, you would save the file and get the path
    const audioFilePath = `/tmp/${req.file.filename}`;

    const result = await this.voiceService.transcribeAudio(audioFilePath, context);

    const response: ApiResponse = {
      success: true,
      data: {
        transcription: result
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });

  /**
   * Process voice input (transcribe + AI response)
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public processVoiceInput = asyncHandler(async (
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
          message: 'No audio file uploaded',
          code: 'NO_FILE',
          statusCode: HTTP_STATUS.BAD_REQUEST,
          correlationId: req.correlationId
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    logOperation('Voice processing request received', req.correlationId, 'processVoiceInput', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // In a real implementation, you would save the file and get the path
    const audioFilePath = `/tmp/${req.file.filename}`;

    const result = await this.voiceService.processVoiceInput(audioFilePath, context);

    const response: ApiResponse = {
      success: true,
      data: {
        transcription: result.transcription,
        response: result.response
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });

  /**
   * Synthesize text to speech
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public synthesizeSpeech = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Speech synthesis request received', req.correlationId, 'synthesizeSpeech', {
      textLength: req.body.text?.length || 0,
      model: req.body.model
    });

    // In a real implementation, you would use a TTS service
    // For now, we'll return a placeholder response
    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Speech synthesis completed',
        audioData: 'placeholder_audio_data'
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });

  /**
   * Get supported audio formats
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  public getSupportedFormats = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const context: ServiceContext = {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    logOperation('Supported formats request received', req.correlationId, 'getSupportedFormats');

    const result = await this.voiceService.getSupportedFormats(context);

    const response: ApiResponse = {
      success: true,
      data: result,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };

    res.status(HTTP_STATUS.OK).json(response);
  });
}
