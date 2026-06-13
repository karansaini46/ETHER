import { GoogleGenerativeAI } from '@google/generative-ai'

import type { GraphData } from '@/types/graph'
import type { ChatMessage, NavCommand } from '@/types/navigator'

const globalObj = typeof globalThis !== 'undefined' ? (globalThis as typeof globalThis & { process?: { env?: Record<string, string> } }) : null
const apiKey =
  globalObj?.process?.env?.GEMINI_API_KEY ||
  import.meta.env?.VITE_GEMINI_API_KEY ||
  ''

const genAI = new GoogleGenerativeAI(apiKey)

function serializeGraph(graph: GraphData): string {
  const nodesSummary = graph.nodes.map((node) => ({
    id: node.id,
    type: node.type,
  }))

  const edgesSummary = graph.edges.map((edge) => ({
    s: edge.source,
    t: edge.target,
  }))

  return JSON.stringify({
    nodes: nodesSummary,
    edges: edgesSummary,
  })
}

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
  if (!apiKey) {
    return {
      role: 'assistant',
      content: 'Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.',
      timestamp: Date.now(),
    }
  }

  const graphSummary = serializeGraph(graph)
  const systemInstruction = `You are ETHER's AI Navigator, an assistant that helps users understand and navigate their codebase represented as a 3D galaxy.

Here is the current codebase dependency graph structure:
${graphSummary}

Instructions:
1. Answer the user's question about the codebase.
2. You must respond in EXACTLY two parts, separated by the delimiter: ---COMMAND---
3. Part 1 (before the delimiter): A concise human explanation (2 to 4 sentences) answering the user's question or explaining the action.
4. Part 2 (after the delimiter): A raw JSON NavCommand object (no markdown code blocks, no backticks, just the raw JSON string).

The NavCommand must follow this JSON schema:
{
  "type": "fly-to" | "highlight" | "explain" | "impact",
  "target": "string (must be a valid nodeId from the graph nodes above, optional)",
  "message": "string (human-readable description of what you are doing)"
}

Example Response:
I found the main entry point of the application at src/main.tsx. It sets up the React root and renders the App component, which serves as the container for the 3D galaxy.
---COMMAND---
{
  "type": "fly-to",
  "target": "src/main.tsx",
  "message": "Flying to the application entry point"
}`

  const geminiHistory = history.map((msg) => {
    let text = msg.content
    if (msg.role === 'assistant' && msg.command) {
      text = `${msg.content}\n---COMMAND---\n${JSON.stringify(msg.command)}`
    }
    return {
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text }],
    }
  })

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction,
    })

    const chat = model.startChat({
      history: geminiHistory,
    })

    const result = await chat.sendMessage(message)
    const responseText = result.response.text()

    let content = responseText
    let command: NavCommand | undefined = undefined

    if (responseText.includes('---COMMAND---')) {
      const parts = responseText.split('---COMMAND---')
      content = parts[0].trim()
      const commandPart = parts[1].trim()

      try {
        const cleanJson = commandPart
          .replace(/^```json\s*/i, '')
          .replace(/```$/, '')
          .trim()
        const parsed = JSON.parse(cleanJson)

        if (parsed && typeof parsed === 'object') {
          // Validate target exists in graph nodes if target is specified
          const targetExists = parsed.target
            ? graph.nodes.some((node) => node.id === parsed.target)
            : true

          if (targetExists) {
            command = {
              type: parsed.type,
              target: parsed.target,
              message: parsed.message || '',
            }
          }
        }
      } catch (error) {
        debugLog('Failed to parse NavCommand from assistant response:', error)
      }
    }

    return {
      role: 'assistant',
      content,
      command,
      timestamp: Date.now(),
    }
  } catch (error: unknown) {
    debugLog('Gemini API Error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isRateLimit =
      (typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        (error as { status: unknown }).status === 429) ||
      errorMessage.includes('429') ||
      errorMessage.toLowerCase().includes('rate limit')

    return {
      role: 'assistant',
      content: isRateLimit
        ? 'Rate limited on free tier. Wait a moment and try again.'
        : `Request failed: ${errorMessage}`,
      timestamp: Date.now(),
    }
  }
}
