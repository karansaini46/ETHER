import { useEffect, useRef } from 'react'

import { Galaxy } from '@/three/Galaxy'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const galaxy = new Galaxy(canvas)

    return () => {
      galaxy.dispose()
    }
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden bg-void text-cyan">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        aria-hidden="true"
      />
      <h1 className="sr-only">ETHER</h1>
    </main>
  )
}

export default App
