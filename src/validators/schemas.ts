import Joi from 'joi';
import { ValidationError } from '../lib/errors.lib';

/**
 * Chat completion validation schema
 */
export const chatCompletionSchema = Joi.object({
  model: Joi.string().optional().default('llama2'),
  messages: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('system', 'user', 'assistant').required(),
        content: Joi.string().required(),
        name: Joi.string().optional(),
      })
    )
    .min(1)
    .required(),
  temperature: Joi.number().min(0).max(2).optional().default(0.7),
  max_tokens: Joi.number().integer().min(1).max(32768).optional().default(2048),
  stream: Joi.boolean().optional().default(false),
});

/**
 * Text completion validation schema
 */
export const textCompletionSchema = Joi.object({
  model: Joi.string().optional().default('llama2'),
  prompt: Joi.string().required(),
  temperature: Joi.number().min(0).max(2).optional().default(0.7),
  max_tokens: Joi.number().integer().min(1).max(32768).optional().default(2048),
  stream: Joi.boolean().optional().default(false),
});

/**
 * Model operation validation schema
 */
export const modelOperationSchema = Joi.object({
  model: Joi.string().required(),
});

/**
 * Document upload validation schema
 */
export const documentUploadSchema = Joi.object({
  // File validation is handled by multer middleware
});

/**
 * Document summary validation schema
 */
export const documentSummarySchema = Joi.object({
  model: Joi.string().optional().default('llama2'),
  maxLength: Joi.number().integer().min(50).max(2000).optional().default(500),
  temperature: Joi.number().min(0).max(2).optional().default(0.3),
  customPrompt: Joi.string().max(1000).optional(),
});

/**
 * Document question validation schema
 */
export const documentQuestionSchema = Joi.object({
  question: Joi.string().min(1).max(1000).required(),
  model: Joi.string().optional().default('llama2'),
  temperature: Joi.number().min(0).max(2).optional().default(0.3),
  max_tokens: Joi.number().integer().min(50).max(2000).optional().default(1000),
});

/**
 * Voice synthesis validation schema
 */
export const voiceSynthesisSchema = Joi.object({
  text: Joi.string().min(1).max(5000).required(),
  model: Joi.string().optional().default('tts'),
  voice: Joi.string().optional(),
  speed: Joi.number().min(0.1).max(3.0).optional().default(1.0),
  pitch: Joi.number().min(0.1).max(3.0).optional().default(1.0),
});

/**
 * Validate request data against schema
 * @param schema - Joi schema to validate against
 * @param data - Data to validate
 * @param correlationId - Request correlation ID
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export const validate = <T>(
  schema: Joi.ObjectSchema,
  data: any,
  correlationId: string
): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(', ');
    throw new ValidationError(errorMessage, correlationId);
  }

  return value as T;
};

/**
 * Validate API key
 * @param apiKey - API key to validate
 * @returns Whether API key is valid
 */
export const validateApiKey = (apiKey: string): boolean => {
  const expectedKey = process.env['API_KEY'];
  return apiKey === expectedKey;
};
