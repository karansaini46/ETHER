import { expose, transfer } from 'comlink'

import { buildGraph } from '@/lib/graph'
import type {
  GraphWorkerApi,
  GraphWorkerInput,
  GraphWorkerOutput,
} from '@/types/graph'

const graphWorkerApi: GraphWorkerApi = {
  buildGraph(input: GraphWorkerInput): GraphWorkerOutput {
    const output = buildGraph(
      input.files,
      input.contents,
      input.commits,
      input.issues,
    )

    return transfer(output, [output.positions.buffer])
  },
}

expose(graphWorkerApi)
