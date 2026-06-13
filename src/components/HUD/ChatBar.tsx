import { type FormEvent, useEffect, useRef } from 'react'

import { useEtherStore } from '@/store'

export function ChatBar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const chatDraft = useEtherStore((state) => state.chatDraft)
  const chatFocusVersion = useEtherStore((state) => state.chatFocusVersion)
  const setChatDraft = useEtherStore((state) => state.setChatDraft)
  const submitNavigatorMessage = useEtherStore(
    (state) => state.submitNavigatorMessage,
  )

  useEffect(() => {
    if (chatFocusVersion === 0) {
      return
    }

    inputRef.current?.focus()
    inputRef.current?.select()
  }, [chatFocusVersion])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitNavigatorMessage(chatDraft)
  }

  return (
    <form
      className="glass-panel pointer-events-auto absolute bottom-6 left-1/2 flex w-[min(680px,calc(100%-2rem))] -translate-x-1/2 gap-3 rounded-2xl p-3"
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
        placeholder="Ask about this repository..."
        autoComplete="off"
      />
      <button
        type="submit"
        className="font-label rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan transition-colors hover:bg-cyan/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
      >
        Send
      </button>
    </form>
  )
}
