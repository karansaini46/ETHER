export interface NavCommand {
  type: 'fly-to' | 'highlight' | 'explain' | 'impact'
  target?: string // node id
  message: string // human-readable description of what AI is doing
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  command?: NavCommand // parsed from assistant response if present
  timestamp: number
}
