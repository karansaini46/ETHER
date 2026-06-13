import type { Request, Response, NextFunction } from 'express';
import { isAppError } from '../utils/errors.js';

interface ErrorResponse {
  code: string;
  message: string;
  requestId?: string;
  recoveryAction?: string;
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string | undefined;

  if (isAppError(err)) {
    const response: ErrorResponse = {
      code: err.code,
      message: err.userMessage,
      requestId,
    };
    if (err.recoveryAction) {
      response.recoveryAction = err.recoveryAction;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  // Log unexpected errors in development only
  if (process.env.NODE_ENV !== 'production') {
    console.error('[error]', err);
  }

  const response: ErrorResponse = {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    requestId,
  };

  res.status(500).json(response);
}
export default errorHandler;
