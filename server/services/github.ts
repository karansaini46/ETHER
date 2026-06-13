import { Octokit } from '@octokit/rest';
import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const MAX_FILE_SIZE_BYTES = 500 * 1024;
const MAX_TREE_FILES = 8000;
const MAX_CONTENT_FETCH = 500;
const CONCURRENCY_LIMIT = 10;
const REQUEST_TIMEOUT_MS = 30_000;

interface TreeEntry {
  path: string;
  sha: string;
  size: number;
  type: string;
}

interface CommitEntry {
  sha: string;
  message: string;
  author: string;
  authorDate: string;
  files: string[];
}

interface RepoMeta {
  owner: string;
  repo: string;
  defaultBranch: string;
  description: string;
  size: number;
  isPrivate: boolean;
}

function createOctokit(token?: string): Octokit {
  return new Octokit({
    auth: token || config.githubToken || undefined,
    request: {
      timeout: REQUEST_TIMEOUT_MS,
    },
    userAgent: 'ETHER/1.0',
  });
}

export async function getRepoMeta(owner: string, repo: string, signal?: AbortSignal): Promise<RepoMeta> {
  const octokit = createOctokit();
  try {
    const { data } = await octokit.repos.get({
      owner,
      repo,
      request: { signal },
    });
    return {
      owner,
      repo,
      defaultBranch: data.default_branch,
      description: data.description ?? '',
      size: data.size,
      isPrivate: data.private,
    };
  } catch (error: unknown) {
    throwGitHubError(error, owner, repo);
  }
}

export async function getRepoTree(owner: string, repo: string, branch: string, signal?: AbortSignal): Promise<TreeEntry[]> {
  const octokit = createOctokit();
  try {
    const { data } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: 'true',
      request: { signal },
    });

    if (data.truncated && data.tree.length > MAX_TREE_FILES) {
      throw new AppError({
        code: 'ANALYSIS_TOO_LARGE',
        statusCode: 422,
        message: `Repository has too many files (>${MAX_TREE_FILES})`,
        userMessage: 'This repository is too large to analyze. Try a smaller repository.',
        recoveryAction: 'try-smaller',
      });
    }

    return data.tree
      .filter((entry): entry is typeof entry & { path: string; sha: string; size: number } =>
        entry.type === 'blob' &&
        typeof entry.path === 'string' &&
        typeof entry.sha === 'string' &&
        typeof entry.size === 'number' &&
        entry.size <= MAX_FILE_SIZE_BYTES
      )
      .slice(0, MAX_TREE_FILES)
      .map((entry) => ({
        path: entry.path,
        sha: entry.sha,
        size: entry.size,
        type: 'blob',
      }));
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    throwGitHubError(error, owner, repo);
  }
}

export async function getFileContent(
  owner: string,
  repo: string,
  filePath: string,
  signal?: AbortSignal,
): Promise<string> {
  const octokit = createOctokit();
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      request: { signal },
    });

    if (Array.isArray(data) || data.type !== 'file' || !('content' in data)) {
      return '';
    }

    const raw = data.content;
    if (!raw || data.encoding !== 'base64') return '';

    return Buffer.from(raw, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

export async function getFileContents(
  owner: string,
  repo: string,
  filePaths: string[],
  signal?: AbortSignal,
  onProgress?: (completed: number, total: number) => void,
): Promise<Map<string, string>> {
  const contents = new Map<string, string>();
  const toFetch = filePaths.slice(0, MAX_CONTENT_FETCH);
  let completed = 0;

  // Process in chunks with concurrency limit
  for (let i = 0; i < toFetch.length; i += CONCURRENCY_LIMIT) {
    if (signal?.aborted) break;
    const chunk = toFetch.slice(i, i + CONCURRENCY_LIMIT);
    const results = await Promise.allSettled(
      chunk.map(async (fp) => {
        const content = await getFileContent(owner, repo, fp, signal);
        if (content) contents.set(fp, content);
      })
    );
    completed += results.length;
    onProgress?.(completed, toFetch.length);
  }

  return contents;
}

export async function getRecentCommits(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<CommitEntry[]> {
  const octokit = createOctokit();
  try {
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 100,
      request: { signal },
    });

    return data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message ?? '',
      author: commit.commit.author?.name ?? '',
      authorDate: commit.commit.author?.date ?? '',
      files: [],
    }));
  } catch {
    return [];
  }
}

function throwGitHubError(error: unknown, owner: string, repo: string): never {
  const status = (error as { status?: number })?.status;
  const message = (error as { message?: string })?.message ?? 'GitHub API request failed';

  if (status === 404) {
    throw new AppError({
      code: 'GITHUB_NOT_FOUND',
      statusCode: 404,
      message: `Repository ${owner}/${repo} not found`,
      userMessage: `Repository "${owner}/${repo}" was not found. Check the URL and ensure the repository is public.`,
      recoveryAction: 'check-url',
    });
  }

  if (status === 403 || status === 429) {
    throw new AppError({
      code: 'GITHUB_RATE_LIMITED',
      statusCode: 429,
      message: `GitHub API rate limit hit: ${message}`,
      userMessage: 'GitHub API rate limit reached. Please wait a few minutes and try again.',
      recoveryAction: 'wait-retry',
    });
  }

  if (status === 401) {
    throw new AppError({
      code: 'GITHUB_UNAUTHORIZED',
      statusCode: 401,
      message: 'GitHub token is invalid or missing',
      userMessage: 'GitHub authentication failed. The server needs a valid GitHub token configured.',
    });
  }

  throw new AppError({
    code: 'GITHUB_ERROR',
    statusCode: 502,
    message: `GitHub API error: ${message}`,
    userMessage: 'Failed to communicate with GitHub. Please try again.',
    recoveryAction: 'retry',
    cause: error,
  });
}
