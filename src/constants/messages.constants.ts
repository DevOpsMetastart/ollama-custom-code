/**
 * Common error and success messages
 */
export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'An internal error occurred',
  VALIDATION_ERROR: 'Invalid data provided',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  TIMEOUT_ERROR: 'Request timeout',
  FILE_ERROR: 'File processing error',
  EXTERNAL_SERVICE_ERROR: 'External service error',
} as const;

export const SUCCESS_MESSAGES = {
  OPERATION_SUCCESSFUL: 'Operation completed successfully',
  RESOURCE_CREATED: 'Resource created successfully',
  RESOURCE_UPDATED: 'Resource updated successfully',
  RESOURCE_DELETED: 'Resource deleted successfully',
  HEALTH_CHECK_PASSED: 'Service is healthy',
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_URL: 'Invalid URL format',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_API_KEY: 'Invalid API key',
} as const;
