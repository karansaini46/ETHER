import { create } from 'zustand'

import { sendMessage } from '@/lib/navigator'
import type { GraphData, GraphNode } from '@/types/graph'
import type { ChatMessage, NavCommand } from '@/types/navigator'

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
  chatHistory: ChatMessage[]
  isLoadingChat: boolean
  latestCommand: { command: NavCommand; timestamp: number } | null
  isGraphLoading: boolean
  graphLoadingStatus: string
  setGraph: (graph: GraphData | null) => void
  setSelectedNode: (node: GraphNode | null) => void
  setRepositoryUrl: (url: string) => void
  setChatDraft: (draft: string) => void
  prepareNavigatorMessage: (content: string) => void
  submitNavigatorMessage: (content: string) => Promise<void>
  setGraphLoading: (loading: boolean, status?: string) => void
  clearChatHistory: () => void
}

export const useEtherStore = create<EtherState>((set, get) => ({
  graph: null,
  selectedNode: null,
  repositoryUrl: '',
  chatDraft: '',
  chatFocusVersion: 0,
  navigatorRequests: [],
  chatHistory: [],
  isLoadingChat: false,
  latestCommand: null,
  isGraphLoading: false,
  graphLoadingStatus: '',

  setGraph: (graph) => {
    set({ graph, selectedNode: null, chatHistory: [], latestCommand: null })
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
  submitNavigatorMessage: async (content) => {
    const trimmedContent = content.trim()

    if (!trimmedContent) {
      return
    }

    const { graph, chatHistory, isLoadingChat } = get()

    if (!graph || isLoadingChat) {
      return
    }

    // 1. Add User Message to History
    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedContent,
      timestamp: Date.now(),
    }

    set((state) => ({
      chatDraft: '',
      chatHistory: [...state.chatHistory, userMessage],
      isLoadingChat: true,
      navigatorRequests: [
        ...state.navigatorRequests,
        {
          id: state.navigatorRequests.length + 1,
          content: trimmedContent,
          createdAt: Date.now(),
        },
      ],
    }))

    // 2. Send request to Gemini
    const assistantMessage = await sendMessage(
      trimmedContent,
      graph,
      get().chatHistory, // fetch updated history
    )

    // 3. Update store with Assistant Message
    set((state) => {
      const updatedHistory = [...state.chatHistory, assistantMessage]
      const newState: Partial<EtherState> = {
        chatHistory: updatedHistory,
        isLoadingChat: false,
      }

      if (assistantMessage.command) {
        newState.latestCommand = {
          command: assistantMessage.command,
          timestamp: Date.now(),
        }
      }

      return newState
    })
  },
  setGraphLoading: (isGraphLoading, graphLoadingStatus = '') => {
    set({ isGraphLoading, graphLoadingStatus })
  },
  clearChatHistory: () => {
    set({ chatHistory: [], latestCommand: null })
  },
}))
