const axios = require('axios');
const winston = require('winston');

/**
 * Ollama Service - Handles communication with Ollama server
 */
class OllamaService {
    constructor() {
        this.baseURL = process.env.OLLAMA_BASE_URL;
        this.timeout = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;
        this.maxRetries = parseInt(process.env.OLLAMA_MAX_RETRIES) || 3;
        
        // Configure HTTP client
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
            }
        });

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
                new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/ollama.log' })
            ]
        });

        // Add request/response interceptors
        this.setupInterceptors();
    }

    /**
     * Setup axios interceptors for logging and error handling
     */
    setupInterceptors() {
        this.client.interceptors.request.use(
            (config) => {
                this.logger.info('Ollama Request', {
                    method: config.method,
                    url: config.url,
                    data: config.data
                });
                return config;
            },
            (error) => {
                this.logger.error('Ollama Request Error', error);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                this.logger.info('Ollama Response', {
                    status: response.status,
                    url: response.config.url
                });
                return response;
            },
            (error) => {
                this.logger.error('Ollama Response Error', {
                    status: error.response?.status,
                    message: error.message,
                    url: error.config?.url
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Generate chat completion
     * @param {Object} params - Chat parameters
     * @param {string} params.model - Model name
     * @param {Array} params.messages - Array of message objects
     * @param {number} params.temperature - Temperature for generation
     * @param {number} params.max_tokens - Maximum tokens to generate
     * @param {boolean} params.stream - Whether to stream response
     * @returns {Promise<Object>} Chat completion response
     */
    async generateChatCompletion(params) {
        const {
            model = process.env.DEFAULT_MODEL || 'llama2',
            messages,
            temperature = parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
            max_tokens = parseInt(process.env.DEFAULT_MAX_TOKENS) || 2048,
            stream = false
        } = params;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            throw new Error('Messages array is required and must not be empty');
        }

        // Handle long messages by truncating intelligently
        const processedMessages = this.processLongMessages(messages, model);
        
        this.logger.info('Chat completion request', {
            model,
            originalMessageCount: messages.length,
            processedMessageCount: processedMessages.length,
            totalTokens: this.countTokens(processedMessages),
            max_tokens,
            temperature
        });

        const requestData = {
            model,
            messages: processedMessages,
            options: {
                temperature,
                num_predict: max_tokens
            },
            stream
        };

        try {
            const response = await this.retryRequest(() =>
                this.client.post('/api/chat', requestData)
            );

            return {
                success: true,
                data: response.data,
                model,
                usage: {
                    prompt_tokens: this.countTokens(messages),
                    completion_tokens: response.data.message?.content?.length || 0,
                    total_tokens: this.countTokens(messages) + (response.data.message?.content?.length || 0)
                }
            };
        } catch (error) {
            this.logger.error('Chat completion failed', { error: error.message, params });
            throw this.handleError(error);
        }
    }

    /**
     * Generate text completion
     * @param {Object} params - Generation parameters
     * @param {string} params.model - Model name
     * @param {string} params.prompt - Input prompt
     * @param {number} params.temperature - Temperature for generation
     * @param {number} params.max_tokens - Maximum tokens to generate
     * @param {boolean} params.stream - Whether to stream response
     * @returns {Promise<Object>} Text completion response
     */
    async generateTextCompletion(params) {
        const {
            model = process.env.DEFAULT_MODEL || 'llama2',
            prompt,
            temperature = parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
            max_tokens = parseInt(process.env.DEFAULT_MAX_TOKENS) || 2048,
            stream = false
        } = params;

        if (!prompt) {
            throw new Error('Prompt is required');
        }

        // Handle long prompts by truncating intelligently
        const processedPrompt = this.processLongPrompt(prompt, model);
        
        this.logger.info('Text completion request', {
            model,
            originalPromptLength: prompt.length,
            processedPromptLength: processedPrompt.length,
            max_tokens,
            temperature
        });

        const requestData = {
            model,
            prompt: processedPrompt,
            options: {
                temperature,
                num_predict: max_tokens
            },
            stream
        };

        try {
            const response = await this.retryRequest(() =>
                this.client.post('/api/generate', requestData)
            );

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
            this.logger.error('Text completion failed', { error: error.message, params });
            throw this.handleError(error);
        }
    }

    /**
     * List available models
     * @returns {Promise<Object>} List of available models
     */
    async listModels() {
        try {
            const response = await this.retryRequest(() =>
                this.client.get('/api/tags')
            );

            return {
                success: true,
                models: response.data.models || []
            };
        } catch (error) {
            this.logger.error('Failed to list models', { error: error.message });
            throw this.handleError(error);
        }
    }

    /**
     * Get model information
     * @param {string} modelName - Name of the model
     * @returns {Promise<Object>} Model information
     */
    async getModelInfo(modelName) {
        try {
            const response = await this.retryRequest(() =>
                this.client.post('/api/show', { name: modelName })
            );

            return {
                success: true,
                model: response.data
            };
        } catch (error) {
            this.logger.error('Failed to get model info', { error: error.message, model: modelName });
            throw this.handleError(error);
        }
    }

    /**
     * Pull a model from Ollama library
     * @param {string} modelName - Name of the model to pull
     * @returns {Promise<Object>} Pull result
     */
    async pullModel(modelName) {
        try {
            const response = await this.retryRequest(() =>
                this.client.post('/api/pull', { name: modelName })
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            this.logger.error('Failed to pull model', { error: error.message, model: modelName });
            throw this.handleError(error);
        }
    }

    /**
     * Delete a model
     * @param {string} modelName - Name of the model to delete
     * @returns {Promise<Object>} Delete result
     */
    async deleteModel(modelName) {
        try {
            const response = await this.retryRequest(() =>
                this.client.delete('/api/delete', { data: { name: modelName } })
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            this.logger.error('Failed to delete model', { error: error.message, model: modelName });
            throw this.handleError(error);
        }
    }

    /**
     * Retry request with exponential backoff
     * @param {Function} requestFn - Request function to retry
     * @returns {Promise} Request result
     */
    async retryRequest(requestFn) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                if (attempt === this.maxRetries) {
                    break;
                }

                // Wait with exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                this.logger.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    /**
     * Handle and format errors
     * @param {Error} error - Error object
     * @returns {Error} Formatted error
     */
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const message = error.response.data?.error || error.message;
            
            return new Error(`Ollama API Error (${status}): ${message}`);
        } else if (error.request) {
            // Request was made but no response received
            return new Error('Ollama server is unreachable. Please check the server URL and network connection.');
        } else {
            // Something else happened
            return new Error(`Request setup error: ${error.message}`);
        }
    }

    /**
     * Process long messages by truncating intelligently
     * @param {Array} messages - Array of message objects
     * @param {string} model - Model name
     * @returns {Array} Processed messages
     */
    processLongMessages(messages, model) {
        // Model-specific context limits (approximate)
        const contextLimits = {
            'llama2': 4096,
            'llama3': 8192,
            'gemma': 8192,
            'gemma2': 8192,
            'gemma3': 8192,
            'mistral': 8192,
            'codellama': 16384,
            'phi': 2048,
            'default': 4096
        };

        const contextLimit = contextLimits[model] || contextLimits.default;
        const maxMessageTokens = Math.floor(contextLimit * 0.7); // Use 70% for messages, 30% for response
        const currentTokens = this.countTokens(messages);

        if (currentTokens <= maxMessageTokens) {
            return messages;
        }

        this.logger.warn('Messages too long, truncating', {
            model,
            originalTokens: currentTokens,
            maxTokens: maxMessageTokens,
            contextLimit,
            messageCount: messages.length
        });

        // Keep system messages and recent messages, truncate middle ones
        const systemMessages = messages.filter(msg => msg.role === 'system');
        const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
        
        // Keep the last few messages (conversation context)
        const recentMessages = nonSystemMessages.slice(-3); // Keep last 3 non-system messages
        
        // If still too long, truncate individual message content
        const processedMessages = [...systemMessages];
        let remainingTokens = maxMessageTokens - this.countTokens(systemMessages);
        
        for (const message of recentMessages) {
            const messageTokens = this.countTokens(message.content);
            if (messageTokens <= remainingTokens) {
                processedMessages.push(message);
                remainingTokens -= messageTokens;
            } else {
                // Truncate this message
                const truncatedContent = this.truncateText(message.content, Math.floor(remainingTokens * 4));
                processedMessages.push({
                    ...message,
                    content: truncatedContent + '\n[... message truncated due to length ...]'
                });
                break;
            }
        }

        this.logger.info('Messages processed', {
            originalCount: messages.length,
            processedCount: processedMessages.length,
            tokensSaved: currentTokens - this.countTokens(processedMessages)
        });

        return processedMessages;
    }

    /**
     * Truncate text to approximate character limit
     * @param {string} text - Text to truncate
     * @param {number} maxChars - Maximum characters
     * @returns {string} Truncated text
     */
    truncateText(text, maxChars) {
        if (text.length <= maxChars) {
            return text;
        }
        
        // Keep beginning and end
        const startChars = Math.floor(maxChars * 0.8);
        const endChars = maxChars - startChars - 50; // Reserve 50 chars for truncation notice
        
        return text.substring(0, startChars) + 
               '\n[... truncated ...]\n' +
               text.substring(text.length - endChars);
    }

    /**
     * Process long prompts by truncating intelligently
     * @param {string} prompt - Input prompt
     * @param {string} model - Model name
     * @returns {string} Processed prompt
     */
    processLongPrompt(prompt, model) {
        // Model-specific context limits (approximate)
        const contextLimits = {
            'llama2': 4096,
            'llama3': 8192,
            'gemma': 8192,
            'gemma2': 8192,
            'gemma3': 8192,
            'mistral': 8192,
            'codellama': 16384,
            'phi': 2048,
            'default': 4096
        };

        const contextLimit = contextLimits[model] || contextLimits.default;
        const maxPromptTokens = Math.floor(contextLimit * 0.7); // Use 70% for prompt, 30% for response
        const currentTokens = this.countTokens(prompt);

        if (currentTokens <= maxPromptTokens) {
            return prompt;
        }

        this.logger.warn('Prompt too long, truncating', {
            model,
            originalTokens: currentTokens,
            maxTokens: maxPromptTokens,
            contextLimit
        });

        // Intelligent truncation: keep the beginning and end
        const maxChars = maxPromptTokens * 4; // Rough character estimate
        const truncationPoint = Math.floor(maxChars * 0.8); // Keep 80% from start
        const endPoint = maxChars - truncationPoint - 100; // Reserve 100 chars for ending

        if (prompt.length <= maxChars) {
            return prompt;
        }

        const truncated = prompt.substring(0, truncationPoint) + 
                         '\n\n[... content truncated due to length ...]\n\n' +
                         prompt.substring(prompt.length - endPoint);

        this.logger.info('Prompt truncated', {
            originalLength: prompt.length,
            truncatedLength: truncated.length,
            tokensSaved: currentTokens - this.countTokens(truncated)
        });

        return truncated;
    }

    /**
     * Simple token counting (approximate)
     * @param {string|Array} input - Input to count tokens for
     * @returns {number} Approximate token count
     */
    countTokens(input) {
        if (typeof input === 'string') {
            // More accurate token estimation
            const text = input || '';
            const words = text.split(/\s+/).filter(word => word.length > 0).length;
            const chars = text.length;
            
            // Use a more sophisticated estimation
            // Average: 1.3 tokens per word + 0.25 tokens per character
            return Math.ceil((words * 1.3) + (chars * 0.25));
        } else if (Array.isArray(input)) {
            // For message arrays, count content
            return input.reduce((total, message) => {
                return total + this.countTokens(message.content || '');
            }, 0);
        }
        return 0;
    }

    /**
     * Health check for Ollama server
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/');
            return {
                success: true,
                status: 'healthy',
                message: response.data || 'Ollama is running'
            };
        } catch (error) {
            return {
                success: false,
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

module.exports = OllamaService;
