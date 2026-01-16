/**
 * Error Utilities
 *
 * Custom error classes and error handling utilities for the AutoQuote AI application.
 *
 * @module lib/utils/errors
 */

/**
 * Base error class for AutoQuote-specific errors.
 */
export class AutoQuoteError extends Error {
  /** HTTP status code for API responses */
  public readonly statusCode: number;
  /** Error code for programmatic handling */
  public readonly code: string;

  /**
   * Creates a new AutoQuoteError.
   *
   * @param message - Human-readable error message
   * @param code - Error code for programmatic handling
   * @param statusCode - HTTP status code (default: 500)
   */
  constructor(message: string, code: string, statusCode = 500) {
    super(message);
    this.name = "AutoQuoteError";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AutoQuoteError.prototype);
  }
}

/**
 * Error thrown when a required resource is not found.
 */
export class NotFoundError extends AutoQuoteError {
  /**
   * Creates a new NotFoundError.
   *
   * @param resource - Type of resource (e.g., "Session", "Call")
   * @param identifier - Resource identifier that wasn't found
   */
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error thrown when validation fails.
 */
export class ValidationError extends AutoQuoteError {
  /** Detailed validation errors */
  public readonly details: unknown;

  /**
   * Creates a new ValidationError.
   *
   * @param message - Human-readable error message
   * @param details - Detailed validation errors (e.g., Zod errors)
   */
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when user is not authenticated.
 */
export class UnauthorizedError extends AutoQuoteError {
  /**
   * Creates a new UnauthorizedError.
   *
   * @param message - Human-readable error message
   */
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Error thrown when user lacks permission for an action.
 */
export class ForbiddenError extends AutoQuoteError {
  /**
   * Creates a new ForbiddenError.
   *
   * @param message - Human-readable error message
   */
  constructor(message = "Permission denied") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Error thrown when a spec requirement is violated.
 * CRITICAL: Used for HARD REQUIREMENTS enforcement.
 */
export class SpecViolationError extends AutoQuoteError {
  /**
   * Creates a new SpecViolationError.
   *
   * @param requirement - Description of the violated requirement
   * @param actual - The actual value that violated the requirement
   */
  constructor(requirement: string, actual: string) {
    super(
      `SPEC VIOLATION: ${requirement}. Received: ${actual}`,
      "SPEC_VIOLATION",
      500
    );
    this.name = "SpecViolationError";
    Object.setPrototypeOf(this, SpecViolationError.prototype);
  }
}

/**
 * Error thrown when DEMO_MODE restrictions are violated.
 */
export class DemoModeViolationError extends AutoQuoteError {
  /**
   * Creates a new DemoModeViolationError.
   *
   * @param attemptedNumber - The phone number that was blocked
   */
  constructor(attemptedNumber: string) {
    super(
      `DEMO_MODE violation: Cannot call ${attemptedNumber}. Only demo numbers allowed.`,
      "DEMO_MODE_VIOLATION",
      403
    );
    this.name = "DemoModeViolationError";
    Object.setPrototypeOf(this, DemoModeViolationError.prototype);
  }
}

/**
 * Error thrown when an external service call fails.
 */
export class ExternalServiceError extends AutoQuoteError {
  /** Name of the service that failed */
  public readonly service: string;
  /** Original error from the service */
  public readonly originalError?: unknown;

  /**
   * Creates a new ExternalServiceError.
   *
   * @param service - Name of the external service
   * @param message - Human-readable error message
   * @param originalError - Original error from the service
   */
  constructor(service: string, message: string, originalError?: unknown) {
    super(`${service} error: ${message}`, "EXTERNAL_SERVICE_ERROR", 502);
    this.name = "ExternalServiceError";
    this.service = service;
    this.originalError = originalError;
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * Type guard to check if an error is an AutoQuoteError.
 *
 * @param error - Error to check
 * @returns True if the error is an AutoQuoteError
 */
export function isAutoQuoteError(error: unknown): error is AutoQuoteError {
  return error instanceof AutoQuoteError;
}

/**
 * Extracts a user-friendly error message from any error type.
 *
 * @param error - Error to extract message from
 * @returns Human-readable error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}
