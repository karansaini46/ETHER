import { releaseProxy, wrap } from 'comlink'

import type {
  GraphWorkerApi,
  GraphWorkerInput,
  GraphWorkerOutput,
} from '@/types/graph'

export async function buildGraphInWorker(
  input: GraphWorkerInput,
): Promise<GraphWorkerOutput> {
  const worker = new Worker(new URL('./graph.worker.ts', import.meta.url), {
    type: 'module',
  })
  const graphWorker = wrap<GraphWorkerApi>(worker)

  try {
    return await graphWorker.buildGraph(input)
  } finally {
    graphWorker[releaseProxy]()
    worker.terminate()
  }
}
