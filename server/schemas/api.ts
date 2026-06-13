import { z } from 'zod';

/** Validates a GitHub repository URL and extracts owner/name */
export const repoUrlSchema = z.string()
  .min(1, 'Repository URL is required')
  .max(2048, 'URL is too long')
  .transform((url) => {
    // Strip protocol and www prefix
    let cleaned = url.trim();
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      cleaned = cleaned.replace(/^https?:\/\//, '');
    }
    // Must not contain credentials
    if (cleaned.includes('@') || cleaned.includes(':') && !cleaned.startsWith('github.com')) {
      throw new Error('URL must not contain credentials');
    }
    cleaned = cleaned.replace(/^www\./, '');
    // Must be github.com
    if (!cleaned.startsWith('github.com/')) {
      throw new Error('Only GitHub repositories are supported');
    }
    const path = cleaned.replace('github.com/', '').replace(/\/+$/, '').replace(/\.git$/, '');
    const parts = path.split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid repository URL. Expected format: github.com/owner/repo');
    }
    const owner = parts[0];
    const repo = parts[1];
    // Validate owner/repo names
    if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
      throw new Error('Invalid repository owner or name');
    }
    if (owner.length > 100 || repo.length > 100) {
      throw new Error('Repository owner or name is too long');
    }
    return { owner, repo };
  });

export const analyzeRequestSchema = z.object({
  url: repoUrlSchema,
});

export const navigatorRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(50).default([]),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type NavigatorRequest = z.infer<typeof navigatorRequestSchema>;
