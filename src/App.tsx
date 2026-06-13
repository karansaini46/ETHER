import { useEffect, useRef } from 'react'

import { HUD } from '@/components/HUD/HUD'
import { fetchCommits, fetchFileContent, fetchIssues, fetchRepoTree } from '@/lib/github'
import { buildGraph } from '@/lib/graph'
import { buildGraphInWorker } from '@/lib/workers/graph'
import { useEtherStore } from '@/store'
import { Galaxy } from '@/three/Galaxy'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const repositoryUrl = useEtherStore((state) => state.repositoryUrl)
  const setGraph = useEtherStore((state) => state.setGraph)
  const setGraphLoading = useEtherStore((state) => state.setGraphLoading)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const galaxy = new Galaxy(canvas)

    return () => {
      galaxy.dispose()
    }
  }, [])

  useEffect(() => {
    if (!repositoryUrl) {
      return
    }

    const match = /github\.com\/([^/]+)\/([^/]+)/.exec(repositoryUrl)
    if (!match) {
      alert(
        'Invalid GitHub repository URL. Format must match: https://github.com/owner/repository',
      )
      useEtherStore.getState().setRepositoryUrl('')
      return
    }

    const [, owner, repo] = match
    const controller = new AbortController()

    async function loadRepository() {
      setGraphLoading(true, 'Connecting to repository...')
      try {
        setGraphLoading(true, 'Fetching file structure...')
        const files = await fetchRepoTree(owner, repo, controller.signal)

        if (files.length === 0) {
          throw new Error('No files found or repository is empty.')
        }

        const codeFiles = files.filter((file) =>
          /\.(tsx?|jsx?|json|css|scss|html)$/i.test(file.path),
        )

        setGraphLoading(
          true,
          `Loading file contents (0/${codeFiles.length})...`,
        )
        const contents = new Map<string, string>()

        const chunkSize = 15
        for (let index = 0; index < codeFiles.length; index += chunkSize) {
          if (controller.signal.aborted) {
            return
          }

          const chunk = codeFiles.slice(index, index + chunkSize)
          setGraphLoading(
            true,
            `Downloading file contents (${index}/${codeFiles.length})...`,
          )

          await Promise.all(
            chunk.map(async (file) => {
              try {
                const content = await fetchFileContent(
                  owner,
                  repo,
                  file.path,
                  controller.signal,
                )
                contents.set(file.path, content)
              } catch (error) {
                console.warn(`Skipped loading content for ${file.path}:`, error)
              }
            }),
          )
        }

        setGraphLoading(true, 'Loading commit history and issue tracker...')
        const [commits, issues] = await Promise.all([
          fetchCommits(owner, repo, controller.signal).catch(() => []),
          fetchIssues(owner, repo, controller.signal).catch(() => []),
        ])

        setGraphLoading(true, 'Mapping 3D galactic codebase structure...')
        let graphData

        if (files.length > 200) {
          graphData = await buildGraphInWorker({
            files,
            contents,
            commits,
            issues,
          })
        } else {
          graphData = buildGraph(files, contents, commits, issues)
        }

        setGraph(graphData)
      } catch (error: any) {
        if (controller.signal.aborted) {
          return
        }
        console.error('Failed to build graph:', error)
        alert(`Failed to build repository universe: ${error?.message || error}`)
        useEtherStore.getState().setRepositoryUrl('')
      } finally {
        if (!controller.signal.aborted) {
          setGraphLoading(false)
        }
      }
    }

    loadRepository()

    return () => {
      controller.abort()
    }
  }, [repositoryUrl, setGraph, setGraphLoading])

  return (
    <main className="relative min-h-screen overflow-hidden bg-void text-cyan">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        aria-hidden="true"
      />
      <h1 className="sr-only">ETHER</h1>
      <HUD />
    </main>
  )
}

export default App
