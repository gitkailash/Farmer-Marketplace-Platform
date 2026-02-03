import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
import { config } from '../config/environment';

// Custom error interface
export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: ValidationError[];
}

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
  stack?: string;
}

// Create API error
export const createApiError = (
  message: string,
  statusCode: number,
  isOperational = true,
  errors?: ValidationError[]
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.isOperational = isOperational;
  if (errors) {
    error.errors = errors;
  }
  return error;
};

// Global error handler middleware
export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default to 500 server error
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
  };

  // Include stack trace in development
  if (config.NODE_ENV === 'development' && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Log error
  console.error(`Error ${statusCode}: ${message}`, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: error.stack,
  });

  res.status(statusCode).json(errorResponse);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};