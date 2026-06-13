import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { config } from './config/env.js';
import { createHelmetMiddleware, createCorsMiddleware } from './middleware/security.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { generalLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import { githubRouter } from './routes/github.js';
import { analysisRouter } from './routes/analysis.js';
import { navigatorRouter } from './routes/navigator.js';

const app = express();

// Security middleware
app.use(createHelmetMiddleware());
app.use(createCorsMiddleware());
app.use(requestIdMiddleware);
app.use(generalLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '2mb' }));

// Health check (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ai: !!config.geminiApiKey,
    github: !!config.githubToken,
  });
});

// API routes
app.use(githubRouter);
app.use(analysisRouter);
app.use(navigatorRouter);

// Production: serve static files and SPA fallback
if (config.nodeEnv === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath, { maxAge: '1y', immutable: true }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.info(`[ether] Server listening on http://localhost:${config.port}`);
  console.info(`[ether] Environment: ${config.nodeEnv}`);
  console.info(`[ether] GitHub token: ${config.githubToken ? 'configured' : 'not set'}`);
  console.info(`[ether] AI Navigator: ${config.geminiApiKey ? 'enabled' : 'disabled'}`);
});

// Graceful shutdown
function shutdown() {
  console.info('[ether] Shutting down...');
  server.close(() => {
    console.info('[ether] Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
