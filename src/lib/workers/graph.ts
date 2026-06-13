import { releaseProxy, wrap } from 'comlink'

import type {
  GraphWorkerApi,
  GraphWorkerInput,
  GraphWorkerOutput,
} from '@/types/graph'
import GraphWorker from './graph.worker.ts?worker'

export async function buildGraphInWorker(
  input: GraphWorkerInput,
): Promise<GraphWorkerOutput> {
  const worker = new GraphWorker()
  const graphWorker = wrap<GraphWorkerApi>(worker)

  try {
    return await graphWorker.buildGraph(input)
  } finally {
    graphWorker[releaseProxy]()
    worker.terminate()
  }
}
