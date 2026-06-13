import { useEffect, useRef } from 'react'

import { HUD } from '@/components/HUD/HUD'
import { fetchCommits, fetchFileContent, fetchIssues, fetchRepoTree } from '@/lib/github'
import { buildGraphInWorker } from '@/lib/workers/graph'
import { useStore } from '@/store'
import { Galaxy } from '@/three/Galaxy'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const repo = useStore((state) => state.repo)
  const actions = useStore((state) => state.actions)

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
    if (!repo) {
      return
    }

    const { owner, name } = repo
    const controller = new AbortController()

    async function loadRepository() {
      try {
        actions.setError(null)

        // Phase 1: loading-tree
        actions.setStatus('loading-tree')
        const files = await fetchRepoTree(owner, name, controller.signal)

        if (files.length === 0) {
          throw new Error('No files found or repository is empty.')
        }

        const codeFiles = files.filter((file) =>
          /\.(tsx?|jsx?|json|css|scss|html)$/i.test(file.path),
        )

        // Phase 2: loading-contents
        actions.setStatus('loading-contents')
        const contents = new Map<string, string>()

        const chunkSize = 15
        for (let index = 0; index < codeFiles.length; index += chunkSize) {
          if (controller.signal.aborted) {
            return
          }

          const chunk = codeFiles.slice(index, index + chunkSize)
          await Promise.all(
            chunk.map(async (file) => {
              try {
                const content = await fetchFileContent(
                  owner,
                  name,
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

        // Fetch commits and issues before starting graph construction
        const [commits, issues] = await Promise.all([
          fetchCommits(owner, name, controller.signal).catch(() => []),
          fetchIssues(owner, name, controller.signal).catch(() => []),
        ])

        // Phase 3: computing-graph
        actions.setStatus('computing-graph')
        let graphData

        graphData = await buildGraphInWorker({
          files,
          contents,
          commits,
          issues,
        })

        actions.setGraph(graphData)
        // Phase 4: ready
        actions.setStatus('ready')
      } catch (error: any) {
        if (controller.signal.aborted) {
          return
        }
        console.error('Failed to build graph:', error)
        actions.setError(error?.message || String(error))
        actions.setStatus('error')
        alert(`Failed to build repository universe: ${error?.message || error}`)
        actions.setRepo(null)
      }
    }

    loadRepository()

    return () => {
      controller.abort()
    }
  }, [repo, actions])

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
