const Joi = require('joi');

/**
 * Validation schemas for API requests
 */
const schemas = {
    // Chat completion request schema
    chatCompletion: Joi.object({
        model: Joi.string().optional().default('llama2'),
        messages: Joi.array().items(
            Joi.object({
                role: Joi.string().valid('system', 'user', 'assistant').required(),
                content: Joi.string().required(),
                name: Joi.string().optional()
            })
        ).min(1).required(),
        temperature: Joi.number().min(0).max(2).optional().default(0.7),
        max_tokens: Joi.number().integer().min(1).max(32768).optional().default(2048),
        stream: Joi.boolean().optional().default(false),
        top_p: Joi.number().min(0).max(1).optional(),
        top_k: Joi.number().integer().min(1).optional(),
        repeat_penalty: Joi.number().min(0).optional(),
        stop: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).optional()
    }),

    // Text completion request schema
    textCompletion: Joi.object({
        model: Joi.string().optional().default('llama2'),
        prompt: Joi.string().required(),
        temperature: Joi.number().min(0).max(2).optional().default(0.7),
        max_tokens: Joi.number().integer().min(1).max(32768).optional().default(2048),
        stream: Joi.boolean().optional().default(false),
        top_p: Joi.number().min(0).max(1).optional(),
        top_k: Joi.number().integer().min(1).optional(),
        repeat_penalty: Joi.number().min(0).optional(),
        stop: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).optional()
    }),

    // Model operations schema
    modelName: Joi.object({
        model: Joi.string().required()
    }),

    // Health check schema (no validation needed)
    healthCheck: Joi.object({}),

    // API key validation schema
    apiKey: Joi.object({
        'x-api-key': Joi.string().required()
    }).unknown(),

    // Document summary request schema
    documentSummary: Joi.object({
        model: Joi.string().optional().default('llama2'),
        maxLength: Joi.number().integer().min(50).max(2000).optional().default(500),
        temperature: Joi.number().min(0).max(2).optional().default(0.3),
        customPrompt: Joi.string().max(1000).optional()
    }),

    // Document question request schema
    documentQuestion: Joi.object({
        question: Joi.string().min(1).max(1000).required(),
        model: Joi.string().optional().default('llama2'),
        temperature: Joi.number().min(0).max(2).optional().default(0.3),
        max_tokens: Joi.number().integer().min(50).max(2000).optional().default(1000)
    }),

    // File ID validation schema
    fileId: Joi.object({
        fileId: Joi.string().uuid().required()
    })
};

/**
 * Custom validation messages
 */
const messages = {
    'string.empty': '{{#label}} cannot be empty',
    'string.required': '{{#label}} is required',
    'number.base': '{{#label}} must be a number',
    'number.min': '{{#label}} must be at least {{#limit}}',
    'number.max': '{{#label}} must be at most {{#limit}}',
    'array.min': '{{#label}} must contain at least {{#limit}} item(s)',
    'object.unknown': '{{#label}} is not allowed'
};

/**
 * Validate request data against schema
 * @param {Object} data - Data to validate
 * @param {Joi.Schema} schema - Schema to validate against
 * @returns {Object} Validation result
 */
function validate(data, schema) {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        messages,
        stripUnknown: true
    });

    if (error) {
        const details = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
        }));

        return {
            isValid: false,
            errors: details
        };
    }

    return {
        isValid: true,
        data: value
    };
}

/**
 * Validate API key
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether API key is valid
 */
function validateApiKey(apiKey) {
    const expectedKey = process.env.API_KEY;
    return apiKey === expectedKey;
}

module.exports = {
    schemas,
    validate,
    validateApiKey
};
