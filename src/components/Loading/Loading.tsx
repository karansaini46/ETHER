import { useEtherStore } from '@/store'

export function Loading() {
  const isGraphLoading = useEtherStore((state) => state.isGraphLoading)
  const graphLoadingStatus = useEtherStore((state) => state.graphLoadingStatus)

  if (!isGraphLoading) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative flex flex-col items-center justify-center p-8 max-w-md w-full">
        {/* Futuristic glowing orbit animations */}
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-cyan/10 border-t-cyan animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-purple/10 border-b-purple animate-spin-reverse" />
          <div className="absolute inset-4 rounded-full border-4 border-pink/10 border-l-pink animate-pulse" />
        </div>
        <h2 className="font-label text-lg font-bold text-slate-100 tracking-wider text-center uppercase">
          Mapping Repository Universe
        </h2>
        <p className="font-data mt-4 text-xs text-cyan animate-pulse text-center">
          {graphLoadingStatus || 'Reading stars...'}
        </p>
      </div>
    </div>
  )
}
