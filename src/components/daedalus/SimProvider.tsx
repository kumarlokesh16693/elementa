'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { SimEngine, type UiSnapshot } from '@/lib/sim/engine'

interface SimHandle {
  engine: SimEngine
  ui: UiSnapshot
  version: number
}

const SimCtx = createContext<SimHandle | null>(null)

export function SimProvider({ children }: { children: ReactNode }) {
  const [engine] = useState(() => new SimEngine())

  const version = useSyncExternalStore(
    engine.subscribe,
    engine.getVersion,
    engine.getVersion
  )
  const value = useMemo<SimHandle>(
    () => ({ engine, ui: engine.ui, version }),
    [engine, version]
  )

  return <SimCtx.Provider value={value}>{children}</SimCtx.Provider>
}

export function useSim(): SimHandle {
  const ctx = useContext(SimCtx)
  if (!ctx) throw new Error('useSim must be used inside <SimProvider>')
  return ctx
}
