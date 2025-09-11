/**
 * Custom error classes for structured error handling
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly correlationId: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    correlationId: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.correlationId = correlationId;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, correlationId: string) {
    super(message, 400, 'VALIDATION_ERROR', correlationId);
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', correlationId: string) {
    super(message, 401, 'AUTHENTICATION_ERROR', correlationId);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', correlationId: string) {
    super(message, 403, 'AUTHORIZATION_ERROR', correlationId);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', correlationId: string) {
    super(message, 404, 'NOT_FOUND_ERROR', correlationId);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', correlationId: string) {
    super(message, 429, 'RATE_LIMIT_ERROR', correlationId);
  }
}

/**
 * External service error class
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(
    message: string,
    correlationId: string,
    service: string,
    originalError?: Error
  ) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', correlationId);
    this.service = service;
    
    if (originalError) {
      this.message = `${message}: ${originalError.message}`;
    }
  }
}

/**
 * Service unavailable error class
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', correlationId: string) {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR', correlationId);
  }
}

/**
 * Timeout error class
 */
export class TimeoutError extends AppError {
  public readonly timeout: number;

  constructor(message: string, correlationId: string, timeout: number) {
    super(message, 408, 'TIMEOUT_ERROR', correlationId);
    this.timeout = timeout;
  }
}

/**
 * File error class
 */
export class FileError extends AppError {
  constructor(message: string, correlationId: string) {
    super(message, 400, 'FILE_ERROR', correlationId);
  }
}

/**
 * Check if error is operational (expected errors)
 * @param error - Error to check
 * @returns True if operational error
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Convert any error to AppError
 * @param error - Error to convert
 * @param correlationId - Request correlation ID
 * @returns AppError instance
 */
export const convertToAppError = (error: Error, correlationId: string): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(
    error.message || 'An unexpected error occurred',
    500,
    'INTERNAL_ERROR',
    correlationId
  );
};
