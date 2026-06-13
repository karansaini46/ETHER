import { Router } from 'express';
import type { Request, Response } from 'express';
import { navigatorRequestSchema } from '../schemas/api.js';
import * as analysisService from '../services/analysis.js';
import * as aiNavigator from '../services/ai-navigator.js';
import { navigatorLimiter } from '../middleware/rate-limit.js';
import { ZodError } from 'zod';

export const navigatorRouter = Router();

/** GET /api/navigator/status — Check if AI is available */
navigatorRouter.get('/api/navigator/status', (_req: Request, res: Response) => {
  res.json({
    available: aiNavigator.isAIAvailable(),
    provider: aiNavigator.isAIAvailable() ? 'gemini' : null,
  });
});

/** POST /api/repositories/:analysisId/navigator — Query AI Navigator */
navigatorRouter.post('/api/repositories/:analysisId/navigator', navigatorLimiter, async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    if (!analysisId) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing analysis ID' });
      return;
    }

    const result = analysisService.getAnalysis(analysisId as string);
    if (!result || !result.graph) {
      res.status(404).json({ code: 'ANALYSIS_NOT_FOUND', message: 'Analysis not found or not ready' });
      return;
    }

    const parsed = navigatorRequestSchema.parse(req.body);
    const response = await aiNavigator.queryNavigator(
      parsed.message,
      result.graph,
      parsed.history,
    );

    res.json(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: error.issues.map((e) => e.message).join('; '),
      });
      return;
    }
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const appErr = error as { statusCode: number; code: string; userMessage: string; recoveryAction?: string };
      res.status(appErr.statusCode).json({
        code: appErr.code,
        message: appErr.userMessage,
        recoveryAction: appErr.recoveryAction,
      });
      return;
    }
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Navigator request failed',
    });
  }
});
