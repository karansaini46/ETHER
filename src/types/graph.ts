import type {
  GithubCommit,
  GithubFile,
  GithubIssue,
} from '@/types/github'

export type NodeType =
  | 'component'
  | 'util'
  | 'store'
  | 'style'
  | 'config'
  | 'test'
  | 'entry'
  | 'unknown'

export interface GraphNode {
  id: string
  label: string
  type: NodeType
  size: number
  commits: number
  hasIssue: boolean
  isRecent: boolean
  language: string
  position: [number, number, number]
  centrality: number
  weight: number
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  positions: Float32Array
  repoName: string
  fetchedAt: number
}

export interface GraphWorkerInput {
  files: GithubFile[]
  contents: Map<string, string>
  commits: GithubCommit[]
  issues: GithubIssue[]
}

export type GraphWorkerOutput = GraphData

export interface GraphWorkerApi {
  buildGraph(input: GraphWorkerInput): GraphWorkerOutput
}
