import { Router } from 'express';
import type { Request, Response } from 'express';
import { analyzeRequestSchema } from '../schemas/api.js';
import * as analysisService from '../services/analysis.js';
import { analysisLimiter } from '../middleware/rate-limit.js';
import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';

export const analysisRouter = Router();

/** POST /api/repositories/analyze — Start analysis */
analysisRouter.post('/api/repositories/analyze', analysisLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = analyzeRequestSchema.parse(req.body);
    const { owner, repo } = parsed.url;
    const analysisId = await analysisService.startAnalysis(owner, repo);

    res.status(202).json({
      id: analysisId,
      status: 'validating',
      message: 'Analysis started',
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues.map((e) => e.message).join('; ');
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message,
        requestId: req.headers['x-request-id'] as string | undefined,
      });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        code: error.code,
        message: error.userMessage,
        recoveryAction: error.recoveryAction,
        requestId: req.headers['x-request-id'] as string | undefined,
      });
      return;
    }
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to start analysis',
      requestId: req.headers['x-request-id'] as string | undefined,
    });
  }
});

/** GET /api/repositories/:analysisId/status — SSE progress stream */
analysisRouter.get('/api/repositories/:analysisId/status', (req: Request, res: Response) => {
  const { analysisId } = req.params;
  if (!analysisId) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing analysis ID' });
    return;
  }

  const result = analysisService.getAnalysis(analysisId as string);
  if (!result) {
    res.status(404).json({ code: 'ANALYSIS_NOT_FOUND', message: 'Analysis not found' });
    return;
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send current status immediately
  res.write(`data: ${JSON.stringify(result.status)}\n\n`);

  // If already complete, close
  if (result.status.stage === 'ready' || result.status.stage === 'error' || result.status.stage === 'cancelled') {
    res.end();
    return;
  }

  const emitter = analysisService.getAnalysisEmitter(analysisId as string);
  if (!emitter) {
    res.end();
    return;
  }

  const onStatus = (status: unknown) => {
    res.write(`data: ${JSON.stringify(status)}\n\n`);
    const s = status as { stage: string };
    if (s.stage === 'ready' || s.stage === 'error' || s.stage === 'cancelled') {
      cleanup();
      res.end();
    }
  };

  const cleanup = () => {
    emitter.removeListener('status', onStatus);
  };

  emitter.on('status', onStatus);

  req.on('close', cleanup);
});

/** GET /api/repositories/:analysisId/graph — Get analysis result */
analysisRouter.get('/api/repositories/:analysisId/graph', (req: Request, res: Response) => {
  const { analysisId } = req.params;
  if (!analysisId) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing analysis ID' });
    return;
  }

  const result = analysisService.getAnalysis(analysisId as string);
  if (!result) {
    res.status(404).json({ code: 'ANALYSIS_NOT_FOUND', message: 'Analysis not found' });
    return;
  }

  if (result.status.stage !== 'ready' || !result.graph) {
    res.status(409).json({
      code: 'ANALYSIS_NOT_READY',
      message: 'Analysis is not yet complete',
      stage: result.status.stage,
    });
    return;
  }

  res.json(result.graph);
});

/** POST /api/repositories/:analysisId/cancel — Cancel analysis */
analysisRouter.post('/api/repositories/:analysisId/cancel', (req: Request, res: Response) => {
  const { analysisId } = req.params;
  if (!analysisId) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing analysis ID' });
    return;
  }

  const cancelled = analysisService.cancelAnalysis(analysisId as string);
  if (!cancelled) {
    res.status(404).json({ code: 'ANALYSIS_NOT_FOUND', message: 'Analysis not found or already complete' });
    return;
  }

  res.json({ message: 'Analysis cancelled' });
});
export default analysisRouter;
