import { type FormEvent, useState } from 'react'

import { useStore } from '@/store'

export function RepoInput() {
  const repo = useStore((state) => state.repo)
  const actions = useStore((state) => state.actions)
  const [inputValue, setInputValue] = useState(repo?.url || '')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedUrl = inputValue.trim()

    const match = /github\.com\/([^/]+)\/([^/]+)/.exec(trimmedUrl)
    if (!match) {
      alert(
        'Invalid GitHub repository URL. Format must match: https://github.com/owner/repository',
      )
      return
    }

    const [, owner, name] = match
    actions.setRepo({
      owner,
      name,
      url: trimmedUrl,
    })
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <form
        className="glass-panel pointer-events-auto w-full max-w-xl rounded-2xl p-6"
        onSubmit={handleSubmit}
      >
        <label
          className="font-label text-sm font-semibold text-slate-200"
          htmlFor="repository-url"
        >
          GitHub repository
        </label>
        <p className="font-data mt-2 text-xs text-slate-500">
          Enter a public repository URL to build its dependency graph.
        </p>
        <div className="mt-5 flex gap-3">
          <input
            id="repository-url"
            className="font-data min-w-0 flex-1 rounded-xl border border-slate-700 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan/60"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value)
            }}
            placeholder="https://github.com/owner/repository"
            type="url"
            required
          />
          <button
            type="submit"
            className="font-label rounded-xl border border-cyan/40 bg-cyan/10 px-5 py-3 text-sm font-semibold text-cyan transition-colors hover:bg-cyan/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Explore
          </button>
        </div>
      </form>
    </div>
  )
}
