'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { SimProvider, useSim } from '@/components/daedalus/SimProvider'
import { ControlPanel } from '@/components/daedalus/ControlPanel'
import { ColorBar, TelemetryCharts } from '@/components/daedalus/Telemetry'

const Scene3D = dynamic(() => import('@/components/daedalus/Scene3D'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#02040a]">
      <div className="font-mono text-xs tracking-[0.3em] text-amber-500 animate-pulse">
        INITIALIZING FLIGHT MODELS…
      </div>
    </div>
  ),
})

function Hotkeys() {
  const { engine } = useSim()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        engine.togglePause()
      } else if (e.key === 'r' || e.key === 'R') {
        engine.reset()
      } else if (e.key === 'a' || e.key === 'A') {
        engine.toggleAutopilot()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine])
  return null
}

export default function Page() {
  return (
    <SimProvider>
      <Hotkeys />
      <div className="flex h-dvh w-full flex-col overflow-hidden lg:flex-row">
        {/* 3D flight scene */}
        <main className="relative order-1 h-[46vh] min-h-[320px] shrink-0 lg:order-2 lg:h-full lg:min-h-0 lg:flex-1">
          <Scene3D />
          <ColorBar />
          <TelemetryCharts />
        </main>

        {/* supervisor control panel */}
        <aside className="order-2 h-[54vh] overflow-y-auto border-t border-white/10 bg-[#060a12] lg:order-1 lg:h-full lg:w-[400px] lg:shrink-0 lg:border-r lg:border-t-0">
          <ControlPanel />
        </aside>
      </div>
    </SimProvider>
  )
}
