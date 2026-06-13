import { Router } from 'express'

const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_PROXY_PREFIX = '/api/github'
const forwardedResponseHeaders = [
  'content-type',
  'link',
  'retry-after',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'x-ratelimit-resource',
  'x-ratelimit-used',
]

export const githubRouter = Router()

githubRouter.get('/api/github/*path', async (request, response) => {
  response.setHeader('Cache-Control', 'no-store')

  const token = process.env.GITHUB_TOKEN

  if (!token) {
    response.status(500).json({ message: 'GitHub token is not configured' })
    return
  }

  const upstreamPath = request.originalUrl.slice(GITHUB_PROXY_PREFIX.length)
  const controller = new AbortController()

  response.on('close', () => {
    if (!response.writableEnded) {
      controller.abort()
    }
  })

  try {
    const upstreamResponse = await fetch(`${GITHUB_API_URL}${upstreamPath}`, {
      cache: 'no-store',
      headers: {
        Accept: request.get('accept') ?? 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'ETHER',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: controller.signal,
    })

    for (const headerName of forwardedResponseHeaders) {
      const headerValue = upstreamResponse.headers.get(headerName)

      if (headerValue) {
        response.setHeader(headerName, headerValue)
      }
    }

    const body = Buffer.from(await upstreamResponse.arrayBuffer())
    response.status(upstreamResponse.status).send(body)
  } catch {
    if (controller.signal.aborted) {
      return
    }

    response.status(502).json({ message: 'GitHub request failed' })
  }
})
