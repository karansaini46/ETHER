import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import type { GraphData, GraphNode } from '@/types/graph'
import type { ChatMessage } from '@/types/navigator'

export interface RepoInfo {
  owner: string
  name: string
  url: string
}

export type LoadingStatus =
  | 'idle'
  | 'loading-tree'
  | 'loading-contents'
  | 'computing-graph'
  | 'ready'
  | 'error'

interface EtherState {
  repo: RepoInfo | null
  graph: GraphData | null
  status: LoadingStatus
  error: string | null
  selectedNode: GraphNode | null
  highlightedNodes: Set<string>
  chatOpen: boolean
  chatHistory: ChatMessage[]
  actions: {
    setRepo: (repo: RepoInfo | null) => void
    setGraph: (graph: GraphData | null) => void
    setStatus: (status: LoadingStatus) => void
    setError: (error: string | null) => void
    selectNode: (node: GraphNode | null) => void
    highlightNodes: (nodeIds: Set<string>) => void
    clearHighlights: () => void
    openChat: () => void
    closeChat: () => void
    addMessage: (message: ChatMessage) => void
  }
}

export const useStore = create<EtherState>()(
  immer((set) => ({
    repo: null,
    graph: null,
    status: 'idle',
    error: null,
    selectedNode: null,
    highlightedNodes: new Set<string>(),
    chatOpen: false,
    chatHistory: [],
    actions: {
      setRepo: (repo) =>
        set((state) => {
          state.repo = repo
        }),
      setGraph: (graph) =>
        set((state) => {
          state.graph = graph
        }),
      setStatus: (status) =>
        set((state) => {
          state.status = status
        }),
      setError: (error) =>
        set((state) => {
          state.error = error
        }),
      selectNode: (node) =>
        set((state) => {
          state.selectedNode = node
        }),
      highlightNodes: (nodeIds) =>
        set((state) => {
          state.highlightedNodes = nodeIds
        }),
      clearHighlights: () =>
        set((state) => {
          state.highlightedNodes.clear()
        }),
      openChat: () =>
        set((state) => {
          state.chatOpen = true
        }),
      closeChat: () =>
        set((state) => {
          state.chatOpen = false
        }),
      addMessage: (message) =>
        set((state) => {
          state.chatHistory.push(message)
        }),
    },
  })),
)

// Typed selector hooks wrapping useStore
export const useGraph = () => useStore((state) => state.graph)
export const useSelectedNode = () => useStore((state) => state.selectedNode)
export const useChatHistory = () => useStore((state) => state.chatHistory)
export const useStatus = () => useStore((state) => state.status)

// Compatibility alias
export const useEtherStore = useStore
