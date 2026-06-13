import type {
  GithubCommit,
  GithubFile,
  GithubIssue,
} from '@/types/github'

const MAX_FILE_SIZE_BYTES = 500 * 1024
const apiBaseUrl =
  import.meta.env?.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? '/api'
const githubProxyBaseUrl = `${apiBaseUrl}/github`

type JsonRecord = Record<string, unknown>

export class GithubApiError extends Error {
  readonly status: number
  readonly endpoint: string

  constructor(
    status: number,
    endpoint: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'GithubApiError'
    this.status = status
    this.endpoint = endpoint
  }
}

export async function fetchRepoTree(
  owner: string,
  repo: string,
  signal: AbortSignal,
): Promise<GithubFile[]> {
  const endpoint = createEndpoint(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/HEAD`,
    { recursive: '1' },
  )
  const payload = await requestJson(endpoint, signal)

  if (payload === null) {
    return []
  }

  if (!isRecord(payload) || !Array.isArray(payload.tree)) {
    throw invalidResponseError(endpoint)
  }

  return payload.tree.flatMap((entry): GithubFile[] => {
    if (
      !isRecord(entry) ||
      entry.type !== 'blob' ||
      typeof entry.path !== 'string' ||
      typeof entry.sha !== 'string' ||
      typeof entry.size !== 'number' ||
      typeof entry.url !== 'string' ||
      entry.size > MAX_FILE_SIZE_BYTES
    ) {
      return []
    }

    return [
      {
        path: entry.path,
        sha: entry.sha,
        size: entry.size,
        url: entry.url,
      },
    ]
  })
}

export function fetchCommits(
  owner: string,
  repo: string,
  signal: AbortSignal,
): Promise<GithubCommit[]>
export function fetchCommits(
  owner: string,
  repo: string,
  path: string,
  signal: AbortSignal,
): Promise<GithubCommit[]>
export async function fetchCommits(
  owner: string,
  repo: string,
  pathOrSignal: string | AbortSignal,
  fileSignal?: AbortSignal,
): Promise<GithubCommit[]> {
  const path = typeof pathOrSignal === 'string' ? pathOrSignal : undefined
  const signal = typeof pathOrSignal === 'string' ? fileSignal : pathOrSignal

  if (signal === undefined) {
    throw new GithubApiError(0, '/api/github', 'An AbortSignal is required')
  }

  const endpoint = createEndpoint(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
    {
      per_page: '30',
      ...(path === undefined ? {} : { path }),
    },
  )
  const payload = await requestJson(endpoint, signal)

  if (payload === null) {
    return []
  }

  if (!Array.isArray(payload)) {
    throw invalidResponseError(endpoint)
  }

  return payload.flatMap((entry): GithubCommit[] => {
    if (
      !isRecord(entry) ||
      typeof entry.sha !== 'string' ||
      typeof entry.html_url !== 'string' ||
      !isRecord(entry.commit)
    ) {
      return []
    }

    const author = isRecord(entry.commit.author) ? entry.commit.author : null

    return [
      {
        sha: entry.sha,
        message:
          typeof entry.commit.message === 'string' ? entry.commit.message : '',
        author: author && typeof author.name === 'string' ? author.name : '',
        authorDate:
          author && typeof author.date === 'string' ? author.date : '',
        url: entry.html_url,
        ...(path === undefined ? {} : { path }),
      },
    ]
  })
}

export async function fetchIssues(
  owner: string,
  repo: string,
  signal: AbortSignal,
): Promise<GithubIssue[]> {
  const endpoint = createEndpoint(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`,
    {
      state: 'open',
      per_page: '100',
    },
  )
  const payload = await requestJson(endpoint, signal)

  if (payload === null) {
    return []
  }

  if (!Array.isArray(payload)) {
    throw invalidResponseError(endpoint)
  }

  return payload.flatMap((entry): GithubIssue[] => {
    if (
      !isRecord(entry) ||
      'pull_request' in entry ||
      typeof entry.number !== 'number' ||
      typeof entry.title !== 'string' ||
      typeof entry.html_url !== 'string' ||
      typeof entry.created_at !== 'string'
    ) {
      return []
    }

    const body = typeof entry.body === 'string' ? entry.body : ''

    return [
      {
        number: entry.number,
        title: entry.title,
        body,
        url: entry.html_url,
        createdAt: entry.created_at,
        filePaths: extractFilePaths(body),
      },
    ]
  })
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  signal: AbortSignal,
): Promise<string> {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  const endpoint = createEndpoint(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`,
  )
  const payload = await requestJson(endpoint, signal)

  if (payload === null) {
    return ''
  }

  if (
    !isRecord(payload) ||
    payload.encoding !== 'base64' ||
    typeof payload.content !== 'string'
  ) {
    throw invalidResponseError(endpoint)
  }

  try {
    const decodedContent = atob(payload.content.replace(/\s/g, ''))
    const bytes = Uint8Array.from(decodedContent, (character) =>
      character.charCodeAt(0),
    )

    return new TextDecoder().decode(bytes)
  } catch (error) {
    throw new GithubApiError(
      200,
      endpoint,
      'GitHub returned invalid base64 file content',
      { cause: error },
    )
  }
}

function createEndpoint(
  path: string,
  query: Record<string, string> = {},
): string {
  const searchParams = new URLSearchParams(query)
  const queryString = searchParams.toString()

  return `${githubProxyBaseUrl}${path}${queryString ? `?${queryString}` : ''}`
}

async function requestJson(
  endpoint: string,
  signal: AbortSignal,
): Promise<unknown | null> {
  let response: Response

  try {
    response = await fetch(endpoint, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
      signal,
    })
  } catch (error) {
    const message = signal.aborted
      ? 'GitHub request was cancelled'
      : 'GitHub request failed'

    throw new GithubApiError(0, endpoint, message, { cause: error })
  }

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new GithubApiError(
      response.status,
      endpoint,
      await getErrorMessage(response),
    )
  }

  try {
    return (await response.json()) as unknown
  } catch (error) {
    throw new GithubApiError(
      response.status,
      endpoint,
      'GitHub returned an invalid JSON response',
      { cause: error },
    )
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as unknown

    if (isRecord(payload) && typeof payload.message === 'string') {
      return payload.message
    }
  } catch {
    return response.statusText || 'GitHub request failed'
  }

  return response.statusText || 'GitHub request failed'
}

function extractFilePaths(body: string): string[] {
  const filePaths = new Set<string>()
  const pathPattern =
    /(?<![\w@.-])((?:\.{0,2}\/)?(?:[\w@.-]+\/)+[\w@.-]+\.[A-Za-z0-9]+)(?::\d+(?::\d+)?)?(?![\w@./-])/gu
  const backtickPattern =
    /`((?:\.{0,2}\/)?(?:[\w@.-]+\/)*[\w@.-]+\.[A-Za-z0-9]+)(?::\d+(?::\d+)?)?`/gu

  for (const pattern of [pathPattern, backtickPattern]) {
    for (const match of body.matchAll(pattern)) {
      const path = match[1]

      if (path) {
        filePaths.add(path.replace(/^(?:\.{1,2}\/)+/, ''))
      }
    }
  }

  return [...filePaths]
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalidResponseError(endpoint: string): GithubApiError {
  return new GithubApiError(
    200,
    endpoint,
    'GitHub returned an unexpected response shape',
  )
}
