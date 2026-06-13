import { create } from 'zustand';
import type { ChatMessage } from '@/types/navigator';

interface NavigatorState {
  chatOpen: boolean;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  aiAvailable: boolean | null;

  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setAIAvailable: (available: boolean) => void;
  clearHistory: () => void;
}

export const useNavigatorStore = create<NavigatorState>()((set) => ({
  chatOpen: false,
  chatHistory: [],
  isLoading: false,
  aiAvailable: null,

  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  addMessage: (message) => set((s) => ({ chatHistory: [...s.chatHistory, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setAIAvailable: (available) => set({ aiAvailable: available }),
  clearHistory: () => set({ chatHistory: [] }),
}));
