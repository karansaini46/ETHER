export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'GITHUB_ERROR'
  | 'GITHUB_RATE_LIMITED'
  | 'GITHUB_NOT_FOUND'
  | 'GITHUB_UNAUTHORIZED'
  | 'ANALYSIS_FAILED'
  | 'ANALYSIS_TIMEOUT'
  | 'ANALYSIS_TOO_LARGE'
  | 'ANALYSIS_NOT_FOUND'
  | 'ANALYSIS_CANCELLED'
  | 'AI_UNAVAILABLE'
  | 'AI_ERROR'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly userMessage: string;
  readonly recoveryAction?: string;

  constructor(options: {
    code: ErrorCode;
    statusCode: number;
    message: string;
    userMessage?: string;
    recoveryAction?: string;
    cause?: unknown;
  }) {
    super(options.message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.userMessage = options.userMessage ?? options.message;
    this.recoveryAction = options.recoveryAction;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
