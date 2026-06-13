const legendItems = [
  ['Component', '#00d4ff'],
  ['Utility', '#7c3aed'],
  ['Store', '#ff6b35'],
  ['Config', '#94a3b8'],
  ['Test', '#22c55e'],
  ['Entry', '#ffffff'],
  ['Issue', '#ff2d55'],
] as const

export function Legend() {
  return (
    <section className="glass-panel absolute left-6 top-6 rounded-xl p-4">
      <h2 className="font-label text-xs uppercase tracking-[0.2em] text-slate-500">
        Node types
      </h2>
      <ul className="mt-3 space-y-2">
        {legendItems.map(([label, color]) => (
          <li
            key={label}
            className="font-data flex items-center gap-2 text-xs text-slate-300"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </li>
        ))}
      </ul>
    </section>
  )
}
