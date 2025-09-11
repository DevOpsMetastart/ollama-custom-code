import fs from 'fs/promises';
import path from 'path';
// @ts-ignore - pdf-parse doesn't have types
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { logWithContext, logError, logOperation } from '../lib/logger.lib';
import { AppError, FileError, ExternalServiceError } from '../lib/errors.lib';
import { ServiceContext } from '../types/common.types';
import { OllamaService } from './OllamaService';

/**
 * Document Service - Handles document processing and text extraction
 * Follows the service pattern with correlation IDs and structured logging
 */
export class DocumentService {
  private readonly ollamaService: OllamaService;
  private readonly maxFileSize: number;
  private readonly uploadsDir: string;

  constructor() {
    this.ollamaService = new OllamaService();
    this.maxFileSize = parseInt(process.env['MAX_FILE_SIZE'] || '10485760'); // 10MB default
    this.uploadsDir = path.join(process.cwd(), 'uploads');
  }

  /**
   * Extract text from uploaded file
   * @param file - Uploaded file buffer
   * @param filename - Original filename
   * @param mimetype - File MIME type
   * @param context - Service context with correlation ID
   * @returns Extracted text and file info
   */
  public async extractTextFromFile(
    file: Buffer,
    filename: string,
    mimetype: string,
    context: ServiceContext
  ): Promise<{
    text: string;
    wordCount: number;
    characterCount: number;
  }> {
    const { correlationId } = context;

    try {
      logOperation('Starting text extraction', correlationId, 'extractTextFromFile', {
        filename,
        mimetype,
        fileSize: file.length
      });

      let text = '';

      switch (mimetype) {
        case 'application/pdf':
          text = await this.extractFromPDF(file, correlationId);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          text = await this.extractFromWord(file, correlationId);
          break;
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          text = await this.extractFromExcel(file, correlationId);
          break;
        case 'text/plain':
          text = file.toString('utf-8');
          break;
        default:
          throw new FileError(`Unsupported file type: ${mimetype}`, correlationId);
      }

      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = text.length;

      logOperation('Text extraction completed', correlationId, 'extractTextFromFile', {
        filename,
        textLength: characterCount,
        wordCount
      });

      return {
        text,
        wordCount,
        characterCount
      };
    } catch (error) {
      logError('Text extraction failed', correlationId, error as Error, {
        filename,
        mimetype,
        fileSize: file.length
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new FileError(
        `Failed to extract text from file: ${(error as Error).message}`,
        correlationId
      );
    }
  }

  /**
   * Generate document summary using Ollama
   * @param text - Document text
   * @param fileId - File identifier
   * @param options - Summary options
   * @param context - Service context with correlation ID
   * @returns Generated summary
   */
  public async generateSummary(
    text: string,
    fileId: string,
    options: {
      model?: string;
      maxLength?: number;
      temperature?: number;
      customPrompt?: string;
    },
    context: ServiceContext
  ): Promise<{
    summary: string;
    model: string;
    originalLength: number;
    summaryLength: number;
    usage: any;
  }> {
    const { correlationId } = context;

    try {
      logOperation('Starting document summarization', correlationId, 'generateSummary', {
        fileId,
        textLength: text.length,
        maxLength: options.maxLength,
        model: options.model
      });

      const {
        model = process.env['DEFAULT_MODEL'] || 'llama2',
        maxLength = 500,
        temperature = 0.3,
        customPrompt
      } = options;

      const prompt = customPrompt || 
        `Please provide a comprehensive summary of the following document in approximately ${maxLength} words. Focus on the main points, key findings, and important details:\n\n${text}`;

      const result = await this.ollamaService.generateTextCompletion({
        model,
        prompt,
        temperature,
        max_tokens: Math.min(maxLength * 2, 2000)
      }, context);

      const summary = result.data.response || '';

      logOperation('Document summarization completed', correlationId, 'generateSummary', {
        fileId,
        model,
        originalLength: text.length,
        summaryLength: summary.length
      });

      return {
        summary,
        model,
        originalLength: text.length,
        summaryLength: summary.length,
        usage: result.usage
      };
    } catch (error) {
      logError('Document summarization failed', correlationId, error as Error, {
        fileId,
        textLength: text.length
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new ExternalServiceError(
        'Document summarization failed',
        correlationId,
        'Ollama',
        error as Error
      );
    }
  }

  /**
   * Answer question about document using Ollama
   * @param text - Document text
   * @param question - Question to answer
   * @param fileId - File identifier
   * @param options - Answer options
   * @param context - Service context with correlation ID
   * @returns Generated answer
   */
  public async answerQuestion(
    text: string,
    question: string,
    fileId: string,
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    },
    context: ServiceContext
  ): Promise<{
    answer: string;
    model: string;
    usage: any;
  }> {
    const { correlationId } = context;

    try {
      logOperation('Starting document Q&A', correlationId, 'answerQuestion', {
        fileId,
        question,
        textLength: text.length,
        model: options.model
      });

      const {
        model = process.env['DEFAULT_MODEL'] || 'llama2',
        temperature = 0.3,
        max_tokens = 1000
      } = options;

      const prompt = `Based on the following document, please answer the question. If the answer cannot be found in the document, please state that clearly.\n\nDocument:\n${text}\n\nQuestion: ${question}`;

      const result = await this.ollamaService.generateTextCompletion({
        model,
        prompt,
        temperature,
        max_tokens
      }, context);

      const answer = result.data.response || '';

      logOperation('Document Q&A completed', correlationId, 'answerQuestion', {
        fileId,
        model,
        question,
        answerLength: answer.length
      });

      return {
        answer,
        model,
        usage: result.usage
      };
    } catch (error) {
      logError('Document Q&A failed', correlationId, error as Error, {
        fileId,
        question,
        textLength: text.length
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new ExternalServiceError(
        'Document Q&A failed',
        correlationId,
        'Ollama',
        error as Error
      );
    }
  }

  /**
   * Extract text from PDF file
   * @param file - PDF file buffer
   * @param correlationId - Request correlation ID
   * @returns Extracted text
   */
  private async extractFromPDF(file: Buffer, correlationId: string): Promise<string> {
    try {
      const data = await pdfParse(file);
      return data.text;
    } catch (error) {
      throw new FileError(
        `Failed to extract text from PDF: ${(error as Error).message}`,
        correlationId
      );
    }
  }

  /**
   * Extract text from Word document
   * @param file - Word file buffer
   * @param correlationId - Request correlation ID
   * @returns Extracted text
   */
  private async extractFromWord(file: Buffer, correlationId: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: file });
      return result.value;
    } catch (error) {
      throw new FileError(
        `Failed to extract text from Word document: ${(error as Error).message}`,
        correlationId
      );
    }
  }

  /**
   * Extract text from Excel file
   * @param file - Excel file buffer
   * @param correlationId - Request correlation ID
   * @returns Extracted text
   */
  private async extractFromExcel(file: Buffer, correlationId: string): Promise<string> {
    try {
      const workbook = XLSX.read(file, { type: 'buffer' });
      let text = '';

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      if (worksheet) {
        const sheetText = XLSX.utils.sheet_to_txt(worksheet);
        text += `Sheet: ${sheetName}\n${sheetText}\n\n`;
      }
    });

      return text;
    } catch (error) {
      throw new FileError(
        `Failed to extract text from Excel file: ${(error as Error).message}`,
        correlationId
      );
    }
  }
}
