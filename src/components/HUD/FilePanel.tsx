import { useMemo } from 'react'

import { useGraph, useSelectedNode, useStore } from '@/store'

export function FilePanel() {
  const graph = useGraph()
  const selectedNode = useSelectedNode()
  const actions = useStore((state) => state.actions)
  const isOpen = selectedNode !== null

  const dependencies = useMemo(() => {
    if (!graph || !selectedNode) {
      return { importedBy: [], imports: [] }
    }

    const imports = new Set<string>()
    const importedBy = new Set<string>()

    for (const edge of graph.edges) {
      if (edge.source === selectedNode.id) {
        imports.add(edge.target)
      }

      if (edge.target === selectedNode.id) {
        importedBy.add(edge.source)
      }
    }

    return {
      imports: [...imports].sort(),
      importedBy: [...importedBy].sort(),
    }
  }, [graph, selectedNode])

  const handleExplain = () => {
    if (!selectedNode) {
      return
    }

    window.dispatchEvent(
      new CustomEvent('ether-chat-explain', { detail: selectedNode.id }),
    )
  }

  return (
    <aside
      aria-hidden={!isOpen}
      className={`glass-panel absolute right-0 top-0 flex h-full w-[min(420px,100vw)] flex-col border-y-0 border-r-0 transition-transform duration-300 ease-out ${
        isOpen
          ? 'pointer-events-auto translate-x-0'
          : 'pointer-events-none translate-x-full'
      }`}
    >
      {selectedNode && (
        <>
          <header className="flex items-start justify-between gap-4 border-b border-slate-700/70 p-6">
            <div className="min-w-0">
              <p className="font-label text-xs uppercase tracking-[0.2em] text-slate-500">
                Selected file
              </p>
              <h2 className="font-data mt-2 break-all text-lg font-semibold text-slate-100">
                {selectedNode.id}
              </h2>
            </div>
            <button
              type="button"
              className="font-data rounded-lg border border-slate-600/70 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-red/70 hover:text-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
              onClick={() => {
                actions.selectNode(null)
              }}
              aria-label="Close file panel"
            >
              Close
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <dl className="grid grid-cols-2 gap-4">
              <Metric label="Type" value={selectedNode.type} badge />
              <Metric
                label="Size"
                value={formatFileSize(selectedNode.size)}
              />
              <Metric
                label="Commits"
                value={selectedNode.commits.toLocaleString()}
              />
              <Metric label="Language" value={selectedNode.language} />
            </dl>

            <DependencyList
              title="Imports"
              values={dependencies.imports}
              emptyLabel="No local imports"
            />
            <DependencyList
              title="Imported by"
              values={dependencies.importedBy}
              emptyLabel="No reverse imports"
            />
          </div>

          <footer className="border-t border-slate-700/70 p-6">
            <button
              type="button"
              className="font-label w-full rounded-xl border border-purple/50 bg-purple/15 px-4 py-3 text-sm font-semibold text-purple-200 transition-colors hover:bg-purple/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
              onClick={handleExplain}
            >
              Explain this file
            </button>
          </footer>
        </>
      )}
    </aside>
  )
}

interface MetricProps {
  label: string
  value: string
  badge?: boolean
}

function Metric({ label, value, badge = false }: MetricProps) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-black/20 p-4">
      <dt className="font-label text-xs uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd
        className={`font-data mt-2 text-sm text-slate-200 ${
          badge
            ? 'inline-flex rounded-full border border-cyan/30 bg-cyan/10 px-2 py-1 text-cyan'
            : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

interface DependencyListProps {
  title: string
  values: string[]
  emptyLabel: string
}

function DependencyList({
  title,
  values,
  emptyLabel,
}: DependencyListProps) {
  return (
    <section className="mt-8">
      <h3 className="font-label text-xs uppercase tracking-[0.2em] text-slate-500">
        {title}
      </h3>
      {values.length === 0 ? (
        <p className="font-data mt-3 text-sm text-slate-600">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {values.map((value) => (
            <li
              key={value}
              className="font-data break-all rounded-lg border border-slate-700/60 bg-black/20 px-3 py-2 text-xs text-slate-300"
            >
              {value}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function formatFileSize(size: number): string {
  if (size < 1_024) {
    return `${size} B`
  }

  if (size < 1_048_576) {
    return `${(size / 1_024).toFixed(1)} KB`
  }

  return `${(size / 1_048_576).toFixed(1)} MB`
}
