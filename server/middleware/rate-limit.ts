import rateLimit from 'express-rate-limit';

/** General rate limiter — 100 requests per 15 minutes per IP */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
});

/** Strict limiter for analysis endpoints — 10 per 15 minutes */
export const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Analysis rate limit reached. Please wait before analyzing another repository.' },
});

/** Strict limiter for AI navigator — 30 per 15 minutes */
export const navigatorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Navigator rate limit reached. Please wait before sending another message.' },
});
