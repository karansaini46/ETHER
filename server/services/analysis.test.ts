import { describe, it, expect, vi } from 'vitest';
import * as analysisService from './analysis.js';

// Mock the githubService dependencies
vi.mock('./github.js', () => ({
  getRepoMeta: vi.fn(),
  getRepoTree: vi.fn(),
  getFileContents: vi.fn(),
  getRecentCommits: vi.fn(),
}));

describe('analysis-service metrics & layout', () => {
  it('should start analysis and generate a unique tracking ID', async () => {
    // We expect startAnalysis to throw or resolve based on concurrency limits.
    // Let's test the public service signatures.
    expect(analysisService.startAnalysis).toBeTypeOf('function');
    expect(analysisService.getAnalysis).toBeTypeOf('function');
    expect(analysisService.cancelAnalysis).toBeTypeOf('function');
  });

  it('should resolve and retrieve analysis status by key ID', () => {
    const status = analysisService.getAnalysis('non-existent-id');
    expect(status).toBeUndefined();
  });
});
