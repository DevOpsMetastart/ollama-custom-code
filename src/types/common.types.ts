/**
 * Common type definitions for the application
 */

/**
 * Service context interface - passed to all service functions
 */
export interface ServiceContext {
  correlationId: string;
  userId?: string;
  userRole?: string;
  timestamp: string;
}

/**
 * API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    statusCode: number;
    correlationId: string;
  };
  correlationId: string;
  timestamp: string;
}

/**
 * Ollama chat request interface
 */
export interface OllamaChatRequest {
  model?: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Ollama text request interface
 */
export interface OllamaTextRequest {
  model?: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Ollama model interface
 */
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

/**
 * Ollama usage interface
 */
export interface OllamaUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Health check response interface
 */
export interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy';
  message?: string;
  error?: string;
  timestamp: string;
}

/**
 * Document upload response interface
 */
export interface DocumentUploadResponse {
  success: boolean;
  data: {
    fileInfo: {
      originalName: string;
      filename: string;
      size: number;
      mimetype: string;
    };
    textInfo: {
      text: string;
      wordCount: number;
      characterCount: number;
    };
  };
  correlationId: string;
  timestamp: string;
}

/**
 * Voice transcription response interface
 */
export interface VoiceTranscriptionResponse {
  success: boolean;
  data: {
    transcription: string;
  };
  correlationId: string;
  timestamp: string;
}
