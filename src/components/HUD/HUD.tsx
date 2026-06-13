import { ChatBar } from './ChatBar'
import { FilePanel } from './FilePanel'
import { Legend } from './Legend'
import { RepoInput } from './RepoInput'
import { Loading } from '../Loading/Loading'
import { useGraph } from '@/store'

export function HUD() {
  const graph = useGraph()

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {!graph && <RepoInput />}
      <Legend />
      <FilePanel />
      <ChatBar />
      <Loading />
    </div>
  )
}
