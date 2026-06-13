import { create } from 'zustand'

import type { GraphData, GraphNode } from '@/types/graph'

export interface NavigatorRequest {
  id: number
  content: string
  createdAt: number
}

interface EtherState {
  graph: GraphData | null
  selectedNode: GraphNode | null
  repositoryUrl: string
  chatDraft: string
  chatFocusVersion: number
  navigatorRequests: NavigatorRequest[]
  setGraph: (graph: GraphData | null) => void
  setSelectedNode: (node: GraphNode | null) => void
  setRepositoryUrl: (url: string) => void
  setChatDraft: (draft: string) => void
  prepareNavigatorMessage: (content: string) => void
  submitNavigatorMessage: (content: string) => void
}

export const useEtherStore = create<EtherState>((set) => ({
  graph: null,
  selectedNode: null,
  repositoryUrl: '',
  chatDraft: '',
  chatFocusVersion: 0,
  navigatorRequests: [],
  setGraph: (graph) => {
    set({ graph, selectedNode: null })
  },
  setSelectedNode: (selectedNode) => {
    set({ selectedNode })
  },
  setRepositoryUrl: (repositoryUrl) => {
    set({ repositoryUrl })
  },
  setChatDraft: (chatDraft) => {
    set({ chatDraft })
  },
  prepareNavigatorMessage: (chatDraft) => {
    set((state) => ({
      chatDraft,
      chatFocusVersion: state.chatFocusVersion + 1,
    }))
  },
  submitNavigatorMessage: (content) => {
    const trimmedContent = content.trim()

    if (!trimmedContent) {
      return
    }

    set((state) => ({
      chatDraft: '',
      navigatorRequests: [
        ...state.navigatorRequests,
        {
          id: state.navigatorRequests.length + 1,
          content: trimmedContent,
          createdAt: Date.now(),
        },
      ],
    }))
  },
}))
