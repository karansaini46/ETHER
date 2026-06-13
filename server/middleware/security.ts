import helmet from 'helmet';
import cors from 'cors';
import type { RequestHandler } from 'express';
import { config } from '../config/env.js';

export function createHelmetMiddleware(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", config.corsOrigin],
        workerSrc: ["'self'", 'blob:'],
        childSrc: ["'self'", 'blob:'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  }) as RequestHandler;
}

export function createCorsMiddleware(): RequestHandler {
  const allowedOrigin = config.corsOrigin.replace(/\/$/, ''); // Remove trailing slash if present

  return cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      
      const normalizedOrigin = origin.replace(/\/$/, '');
      
      if (normalizedOrigin === allowedOrigin || allowedOrigin === '*' || allowedOrigin === 'all') {
        callback(null, true);
      } else if (
        normalizedOrigin.startsWith('http://localhost:') || 
        normalizedOrigin.startsWith('http://127.0.0.1:')
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    maxAge: 600,
  });
}
