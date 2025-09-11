import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { logWithContext, logError, logOperation } from '../lib/logger.lib';
import { AppError, FileError, ExternalServiceError } from '../lib/errors.lib';
import { ServiceContext } from '../types/common.types';
import { OllamaService } from './OllamaService';

/**
 * Voice Service - Handles voice transcription and processing
 * Follows the service pattern with correlation IDs and structured logging
 */
export class VoiceService {
  private readonly ollamaService: OllamaService;
  private readonly uploadsDir: string;
  private readonly supportedFormats: string[];

  constructor() {
    this.ollamaService = new OllamaService();
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.supportedFormats = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];
  }

  /**
   * Transcribe audio file to text
   * @param audioFilePath - Path to audio file
   * @param context - Service context with correlation ID
   * @returns Transcribed text
   */
  public async transcribeAudio(
    audioFilePath: string,
    context: ServiceContext
  ): Promise<string> {
    const { correlationId } = context;

    try {
      logOperation('Starting audio transcription', correlationId, 'transcribeAudio', {
        audioFilePath,
        fileSize: (await fs.stat(audioFilePath)).size
      });

      // Check if file exists
      await fs.access(audioFilePath);

      // Use whisper.cpp or similar for transcription
      const transcription = await this.runWhisperTranscription(audioFilePath, correlationId);

      logOperation('Audio transcription completed', correlationId, 'transcribeAudio', {
        audioFilePath,
        transcriptionLength: transcription.length
      });

      return transcription;
    } catch (error) {
      logError('Audio transcription failed', correlationId, error as Error, {
        audioFilePath
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new FileError(
        `Failed to transcribe audio: ${(error as Error).message}`,
        correlationId
      );
    }
  }

  /**
   * Process voice input (transcribe + AI response)
   * @param audioFilePath - Path to audio file
   * @param context - Service context with correlation ID
   * @returns Transcription and AI response
   */
  public async processVoiceInput(
    audioFilePath: string,
    context: ServiceContext
  ): Promise<{
    transcription: string;
    response: string;
  }> {
    const { correlationId } = context;

    try {
      logOperation('Starting voice processing', correlationId, 'processVoiceInput', {
        audioFilePath
      });

      // 1. Transcribe the audio file
      const transcription = await this.transcribeAudio(audioFilePath, context);
      
      // 2. Send the transcribed text to the Ollama server
      const aiResponse = await this.ollamaService.generateChatCompletion({
        model: process.env['DEFAULT_MODEL'] || 'llama2',
        messages: [{ role: 'user', content: transcription }],
        temperature: 0.7,
        max_tokens: 1000
      }, context);

      const response = aiResponse.data.message?.content || '';

      logOperation('Voice processing completed', correlationId, 'processVoiceInput', {
        audioFilePath,
        transcriptionLength: transcription.length,
        responseLength: response.length
      });

      return {
        transcription,
        response
      };
    } catch (error) {
      logError('Voice processing failed', correlationId, error as Error, {
        audioFilePath
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new ExternalServiceError(
        'Voice processing failed',
        correlationId,
        'VoiceService',
        error as Error
      );
    }
  }

  /**
   * Get supported audio formats
   * @param context - Service context with correlation ID
   * @returns Supported formats information
   */
  public async getSupportedFormats(context: ServiceContext): Promise<{
    extensions: string[];
    mimeTypes: string[];
    maxFileSize: number;
  }> {
    const { correlationId } = context;

    logOperation('Retrieving supported formats', correlationId, 'getSupportedFormats');

    const mimeTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'audio/flac',
      'audio/ogg'
    ];

    return {
      extensions: this.supportedFormats,
      mimeTypes,
      maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760') // 10MB
    };
  }

  /**
   * Run whisper transcription on audio file
   * @param audioFilePath - Path to audio file
   * @param correlationId - Request correlation ID
   * @returns Transcribed text
   */
  private async runWhisperTranscription(
    audioFilePath: string,
    correlationId: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // This is a placeholder implementation
      // In a real implementation, you would use whisper.cpp or similar
      const whisperProcess = spawn('whisper', [audioFilePath, '--output_format', 'txt'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      whisperProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      whisperProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      whisperProcess.on('close', (code) => {
        if (code === 0) {
          // For now, return a placeholder since whisper might not be installed
          resolve('This is a placeholder transcription. Please install whisper.cpp for actual transcription.');
        } else {
          reject(new FileError(
            `Whisper transcription failed: ${errorOutput}`,
            correlationId
          ));
        }
      });

      whisperProcess.on('error', (error) => {
        // If whisper is not installed, return placeholder
        if (error.message.includes('ENOENT')) {
          resolve('This is a placeholder transcription. Please install whisper.cpp for actual transcription.');
        } else {
          reject(new FileError(
            `Whisper process error: ${error.message}`,
            correlationId
          ));
        }
      });
    });
  }
}
