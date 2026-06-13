import { type FormEvent, useEffect, useRef, useState } from 'react'

import { sendMessage } from '@/lib/navigator'
import { useChatHistory, useGraph, useStore } from '@/store'
import type { ChatMessage } from '@/types/navigator'

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false
  }

  return (
    element.isContentEditable ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  )
}

export function ChatBar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const graph = useGraph()
  const chatHistory = useChatHistory()
  const chatOpen = useStore((state) => state.chatOpen)
  const actions = useStore((state) => state.actions)

  const [chatDraft, setChatDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Listen to global 'T' key to open chat
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === 'KeyT' &&
        !isEditableElement(document.activeElement)
      ) {
        event.preventDefault()
        actions.openChat()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [actions])

  // Listen to custom 'Explain this file' event from FilePanel
  useEffect(() => {
    const handleExplainEvent = (event: Event) => {
      const fileId = (event as CustomEvent).detail
      setChatDraft(`Explain this file: ${fileId}`)
      actions.openChat()
    }

    window.addEventListener('ether-chat-explain', handleExplainEvent)
    return () => {
      window.removeEventListener('ether-chat-explain', handleExplainEvent)
    }
  }, [actions])

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [chatOpen])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = chatDraft.trim()
    if (!trimmed || isLoading || !graph) {
      return
    }

    setChatDraft('')
    setIsLoading(true)

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }
    actions.addMessage(userMessage)

    try {
      const assistantMessage = await sendMessage(
        trimmed,
        graph,
        [...chatHistory, userMessage],
      )
      actions.addMessage(assistantMessage)
    } catch (error) {
      console.error('Failed to get navigator message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      inputRef.current?.blur()
      actions.closeChat()
    }
  }

  if (!graph || !chatOpen) {
    return null
  }

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 flex w-[min(680px,calc(100%-2rem))] -translate-x-1/2 flex-col gap-3">
      {/* Scrollable Chat History Panel */}
      {chatHistory.length > 0 && (
        <div className="glass-panel flex max-h-[280px] flex-col gap-3 overflow-y-auto rounded-2xl p-4 scrollbar-thin">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col gap-1 ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="font-label text-[10px] uppercase tracking-wider text-slate-500">
                {msg.role === 'user' ? 'User' : 'Navigator'}
              </div>
              <div
                className={`max-w-[85%] break-words rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'border border-cyan/30 bg-cyan/10 text-cyan-100'
                    : 'border border-slate-700/50 bg-slate-800/50 text-slate-200'
                }`}
              >
                {msg.content}
                {msg.command && (
                  <div className="mt-1.5 flex items-center gap-1.5 border-t border-purple-500/20 pt-1 font-data text-[11px] text-purple-300">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                    </span>
                    {msg.command.message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        className="glass-panel flex w-full items-center gap-3 rounded-2xl p-3"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="navigator-message">
          Repository question
        </label>
        <input
          ref={inputRef}
          id="navigator-message"
          className="font-data min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
          value={chatDraft}
          onChange={(event) => {
            setChatDraft(event.target.value)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this repository..."
          autoComplete="off"
          disabled={isLoading}
        />

        {/* Pulsing dot indicator during API call */}
        {isLoading && (
          <div className="flex items-center justify-center px-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan"></span>
            </span>
          </div>
        )}

        <button
          type="submit"
          className="font-label rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan transition-colors hover:bg-cyan/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  )
}
export default ChatBar
