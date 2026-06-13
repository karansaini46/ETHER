import type { GraphData } from '@/types/graph'
import type { ChatMessage } from '@/types/navigator'

function debugLog(message: string, error?: unknown): void {
  if (import.meta.env.DEV) {
    if (error !== undefined) {
      console.error(message, error)
    } else {
      console.log(message)
    }
  }
}

export async function sendMessage(
  message: string,
  graph: GraphData,
  history: ChatMessage[],
): Promise<ChatMessage> {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

  try {
    const response = await fetch(`${apiBase}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, graph, history }),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({})) as { content?: string }
      throw new Error(errBody.content || `HTTP error ${response.status}`)
    }

    return (await response.json()) as ChatMessage
  } catch (error: unknown) {
    debugLog('Chat Proxy API Error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      role: 'assistant',
      content: `Request failed: ${errorMessage}`,
      timestamp: Date.now(),
    }
  }
}
