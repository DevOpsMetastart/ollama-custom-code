import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logWithContext, logError, logOperation } from '../lib/logger.lib';
import { AppError, ExternalServiceError, TimeoutError } from '../lib/errors.lib';
import { ServiceContext } from '../types/common.types';
import {
  OllamaChatRequest,
  OllamaTextRequest,
  OllamaModel,
  OllamaUsage,
  HealthCheckResponse
} from '../types/common.types';

/**
 * Ollama Service - Handles communication with Ollama server
 * Follows the service pattern with correlation IDs and structured logging
 */
export class OllamaService {
  private readonly client: AxiosInstance;
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor() {
    this.baseURL = process.env['OLLAMA_BASE_URL'] || 'http://localhost:11434';
    this.timeout = parseInt(process.env['OLLAMA_TIMEOUT'] || '30000');
    this.maxRetries = parseInt(process.env['OLLAMA_MAX_RETRIES'] || '3');
    
    // Configure HTTP client
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`
      }
    });

    // Add request/response interceptors
    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        logWithContext('debug', 'Ollama Request', 'service', {
          method: config.method,
          url: config.url,
          data: config.data
        });
        return config;
      },
      (error) => {
        logError('Ollama Request Error', 'service', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logWithContext('debug', 'Ollama Response', 'service', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logError('Ollama Response Error', 'service', error, {
          status: error.response?.status,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate chat completion
   * @param params - Chat parameters
   * @param context - Service context with correlation ID
   * @returns Chat completion response
   */
  public async generateChatCompletion(
    params: OllamaChatRequest,
    context: ServiceContext
  ): Promise<{
    success: boolean;
    data: any;
    model: string;
    usage: OllamaUsage;
  }> {
    const { correlationId } = context;
    const startTime = Date.now();

    try {
      logOperation('Starting chat completion', correlationId, 'generateChatCompletion', {
        model: params.model,
        messageCount: params.messages.length,
        temperature: params.temperature,
        maxTokens: params.max_tokens
      });

      const {
        model = process.env['DEFAULT_MODEL'] || 'llama2',
        messages,
        temperature = parseFloat(process.env['DEFAULT_TEMPERATURE'] || '0.7'),
        max_tokens = parseInt(process.env['DEFAULT_MAX_TOKENS'] || '2048'),
      } = params;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new AppError(
          'Messages array is required and must not be empty',
          400,
          'VALIDATION_ERROR',
          correlationId
        );
      }

      const requestData = {
        model,
        messages,
        options: {
          temperature,
          num_predict: max_tokens
        },
        stream: true
      };

      const response = await this.retryRequest(
        (options) => this.client.post('/api/chat', requestData, { ...options, responseType: 'stream' }),
        {},
        correlationId
      );

      let fullContent = '';
      let buffer = '';
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
          const jsonStr = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 1);
          if (jsonStr) {
            const parsed = JSON.parse(jsonStr);
            if (parsed.message && parsed.message.content) {
              fullContent += parsed.message.content;
            }
          }
          boundary = buffer.indexOf('\n');
        }
      }

      const duration = Date.now() - startTime;
      logOperation('Chat completion completed', correlationId, 'generateChatCompletion', {
        model,
        duration: `${duration}ms`,
        usage: {
          prompt_tokens: this.countTokens(messages),
          completion_tokens: fullContent.length,
          total_tokens: this.countTokens(messages) + fullContent.length
        }
      });

      return {
        success: true,
        data: { message: { content: fullContent } },
        model,
        usage: {
          prompt_tokens: this.countTokens(messages),
          completion_tokens: fullContent.length,
          total_tokens: this.countTokens(messages) + fullContent.length
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logError('Chat completion failed', correlationId, error as Error, {
        model: params.model,
        duration: `${duration}ms`,
        params
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new ExternalServiceError(
        'Chat completion failed',
        correlationId,
        'Ollama',
        error as Error
      );
    }
  }

  /**
   * Generate text completion
   * @param params - Generation parameters
   * @param context - Service context with correlation ID
   * @returns Text completion response
   */
  public async generateTextCompletion(
    params: OllamaTextRequest,
    context: ServiceContext
  ): Promise<{
    success: boolean;
    data: any;
    model: string;
    usage: OllamaUsage;
  }> {
    const { correlationId } = context;
    const startTime = Date.now();

    try {
      logOperation('Starting text completion', correlationId, 'generateTextCompletion', {
        model: params.model,
        promptLength: params.prompt.length,
        temperature: params.temperature,
        maxTokens: params.max_tokens
      });

      const {
        model = process.env['DEFAULT_MODEL'] || 'llama2',
        prompt,
        temperature = parseFloat(process.env['DEFAULT_TEMPERATURE'] || '0.7'),
        max_tokens = parseInt(process.env['DEFAULT_MAX_TOKENS'] || '2048'),
        stream = false
      } = params;

      if (!prompt) {
        throw new AppError(
          'Prompt is required',
          400,
          'VALIDATION_ERROR',
          correlationId
        );
      }

      const requestData = {
        model,
        prompt,
        options: {
          temperature,
          num_predict: max_tokens
        },
        stream
      };

      const response = await this.retryRequest(
        (options) => this.client.post('/api/generate', requestData, options),
        {},
        correlationId
      );

      const duration = Date.now() - startTime;
      logOperation('Text completion completed', correlationId, 'generateTextCompletion', {
        model,
        duration: `${duration}ms`,
        usage: {
          prompt_tokens: this.countTokens(prompt),
          completion_tokens: response.data.response?.length || 0,
          total_tokens: this.countTokens(prompt) + (response.data.response?.length || 0)
        }
      });

      return {
        success: true,
        data: response.data,
        model,
        usage: {
          prompt_tokens: this.countTokens(prompt),
          completion_tokens: response.data.response?.length || 0,
          total_tokens: this.countTokens(prompt) + (response.data.response?.length || 0)
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logError('Text completion failed', correlationId, error as Error, {
        model: params.model,
        duration: `${duration}ms`,
        params
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new ExternalServiceError(
        'Text completion failed',
        correlationId,
        'Ollama',
        error as Error
      );
    }
  }

  /**
   * List available models
   * @param context - Service context with correlation ID
   * @returns List of available models
   */
  public async listModels(context: ServiceContext): Promise<{
    success: boolean;
    models: OllamaModel[];
  }> {
    const { correlationId } = context;

    try {
      logOperation('Starting model list retrieval', correlationId, 'listModels');

      const response = await this.retryRequest(
        () => this.client.get('/api/tags'),
        {},
        correlationId
      );

      logOperation('Model list retrieved', correlationId, 'listModels', {
        modelCount: response.data.models?.length || 0
      });

      return {
        success: true,
        models: response.data.models || []
      };
    } catch (error) {
      logError('Failed to list models', correlationId, error as Error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new ExternalServiceError(
        'Failed to list models',
        correlationId,
        'Ollama',
        error as Error
      );
    }
  }

  /**
   * Health check for Ollama server
   * @param context - Service context with correlation ID
   * @returns Health status
   */
  public async healthCheck(context: ServiceContext): Promise<HealthCheckResponse> {
    const { correlationId } = context;

    try {
      logOperation('Starting health check', correlationId, 'healthCheck', {
        baseURL: this.baseURL,
        fullURL: `${this.baseURL}/api/tags`
      });

      const response = await this.client.get('/api/tags');
      
      logOperation('Health check completed', correlationId, 'healthCheck', {
        status: 'healthy'
      });

      return {
        success: true,
        status: 'healthy',
        message: response.data || 'Ollama is running',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logError('Health check failed', correlationId, error as Error);

      return {
        success: false,
        status: 'unhealthy',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Retry request with exponential backoff
   * @param requestFn - Request function to retry
   * @param options - Request options
   * @param correlationId - Request correlation ID
   * @returns Request result
   */
  private async retryRequest(
    requestFn: (options: any) => Promise<AxiosResponse>,
    options: any = {},
    correlationId: string
  ): Promise<AxiosResponse> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const progressiveTimeout = this.timeout * Math.pow(1.5, attempt - 1);
        const requestOptions = {
          ...options,
          timeout: options.timeout || progressiveTimeout
        };
        
        logWithContext('debug', `Request attempt ${attempt}/${this.maxRetries}`, correlationId, {
          timeout: requestOptions.timeout,
          attempt
        });
        
        return await requestFn(requestOptions);
      } catch (error) {
        lastError = error as Error;
        
        const isTimeoutError = (error as any).code === 'ECONNABORTED' || 
                             (error as Error).message.includes('timeout') ||
                             (error as Error).message.includes('ETIMEDOUT');
        
        if (attempt === this.maxRetries) {
          if (isTimeoutError) {
            throw new TimeoutError(
              `Request timeout after ${this.maxRetries} attempts. The Ollama server took too long to respond.`,
              correlationId,
              options.timeout || this.timeout
            );
          }
          break;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        logWithContext('warn', `Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`, correlationId, {
          error: (error as Error).message,
          isTimeout: isTimeoutError,
          timeout: options.timeout || this.timeout
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Simple token counting (approximate)
   * @param input - Input to count tokens for
   * @returns Approximate token count
   */
  private countTokens(input: string | any[]): number {
    if (typeof input === 'string') {
      const text = input || '';
      const words = text.split(/\s+/).filter(word => word.length > 0).length;
      const chars = text.length;
      return Math.ceil((words * 1.3) + (chars * 0.25));
    } else if (Array.isArray(input)) {
      return input.reduce((total, message) => {
        return total + this.countTokens(message.content || '');
      }, 0);
    }
    return 0;
  }
}
