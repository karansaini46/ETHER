import { ChatBar } from './ChatBar'
import { FilePanel } from './FilePanel'
import { Legend } from './Legend'
import { RepoInput } from './RepoInput'
import { useEtherStore } from '@/store'

export function HUD() {
  const graph = useEtherStore((state) => state.graph)

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {!graph && <RepoInput />}
      <Legend />
      <FilePanel />
      <ChatBar />
    </div>
  )
}
