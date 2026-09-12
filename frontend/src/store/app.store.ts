import { create } from 'zustand'
import type { IDNA } from '../types'
import { arenaService, type IBattleHistoryItem } from '../services/arena.service'
import { dashboardService } from '../services/dashboard.service'
import { dnaService } from '../services/dna.service'

export type DashboardData = Awaited<ReturnType<typeof dashboardService.getDashboard>>

/** Slices older than this are refetched on next access (stale-while-revalidate). */
const STALE_MS = 5 * 60 * 1000

interface Slice<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastFetched: number
}

interface HistoryData {
  battles: IBattleHistoryItem[]
  page: number
  totalPages: number
  total: number
}

const freshSlice = <T>(): Slice<T> => ({ data: null, loading: false, error: null, lastFetched: 0 })
const isFresh = (lastFetched: number) => lastFetched > 0 && Date.now() - lastFetched < STALE_MS
const toError = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

interface AppState {
  /** User id the cached slices belong to; null until bootstrapped. */
  bootstrappedFor: string | null
  bootstrapping: boolean
  bootstrapError: string | null
  dna: Slice<IDNA>
  dashboard: Slice<DashboardData>
  history: Slice<HistoryData>
  /** Fetch session-adjacent data once per user; pages then read from the store. */
  bootstrap: (userId: string) => Promise<void>
  ensureDna: (force?: boolean) => Promise<void>
  regenerateDna: () => Promise<void>
  ensureDashboard: (force?: boolean) => Promise<void>
  ensureHistory: (force?: boolean) => Promise<void>
  loadMoreHistory: () => Promise<void>
  reset: () => void
}

export const useAppStore = create<AppState>((set, get) => {
  async function ensureDna(force = false) {
    const { dna } = get()
    if (!force && dna.data && isFresh(dna.lastFetched)) return
    set((state) => ({ dna: { ...state.dna, loading: true, error: null } }))
    try {
      const data = await dnaService.getMyDNA()
      set({ dna: { data, loading: false, error: null, lastFetched: Date.now() } })
    } catch (error) {
      set((state) => ({ dna: { ...state.dna, loading: false, error: toError(error, 'Could not load Developer DNA.') } }))
    }
  }

  async function ensureDashboard(force = false) {
    const { dashboard } = get()
    if (!force && dashboard.data && isFresh(dashboard.lastFetched)) return
    set((state) => ({ dashboard: { ...state.dashboard, loading: true, error: null } }))
    try {
      const data = await dashboardService.getDashboard()
      set({ dashboard: { data, loading: false, error: null, lastFetched: Date.now() } })
    } catch (error) {
      set((state) => ({ dashboard: { ...state.dashboard, loading: false, error: toError(error, 'Could not load dashboard.') } }))
    }
  }

  async function ensureHistory(force = false) {
    const { history } = get()
    if (!force && history.data && isFresh(history.lastFetched)) return
    set((state) => ({ history: { ...state.history, loading: true, error: null } }))
    try {
      const data = await arenaService.getHistory(1)
      set({ history: { data, loading: false, error: null, lastFetched: Date.now() } })
    } catch (error) {
      set((state) => ({ history: { ...state.history, loading: false, error: toError(error, 'Unable to load battle history.') } }))
    }
  }

  return {
    bootstrappedFor: null,
    bootstrapping: false,
    bootstrapError: null,
    dna: freshSlice<IDNA>(),
    dashboard: freshSlice<DashboardData>(),
    history: freshSlice<HistoryData>(),

    bootstrap: async (userId: string) => {
      const { bootstrappedFor, bootstrapping } = get()
      if (bootstrappedFor === userId || bootstrapping) return
      set({ bootstrapping: true, bootstrapError: null })
      // One slice failing must not block the others.
      const outcomes = await Promise.allSettled([ensureDna(true), ensureDashboard(true), ensureHistory(true)])
      const firstFailure = outcomes.find(
        (outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected',
      )
      set({
        bootstrapping: false,
        bootstrappedFor: userId,
        bootstrapError: firstFailure ? toError(firstFailure.reason, 'Could not load app data.') : null,
      })
    },

    ensureDna,
    ensureDashboard,
    ensureHistory,

    regenerateDna: async () => {
      set((state) => ({ dna: { ...state.dna, loading: true, error: null } }))
      try {
        const data = await dnaService.regenerateDNA()
        set({ dna: { data, loading: false, error: null, lastFetched: Date.now() } })
      } catch (error) {
        set((state) => ({ dna: { ...state.dna, loading: false, error: toError(error, 'Could not regenerate DNA.') } }))
      }
    },

    loadMoreHistory: async () => {
      const { history } = get()
      if (!history.data || history.loading || history.data.page >= history.data.totalPages) return
      set((state) => ({ history: { ...state.history, loading: true, error: null } }))
      try {
        const next = await arenaService.getHistory(history.data.page + 1)
        set({
          history: {
            data: {
              battles: [...(history.data?.battles ?? []), ...next.battles],
              page: next.page,
              totalPages: next.totalPages,
              total: next.total,
            },
            loading: false,
            error: null,
            lastFetched: Date.now(),
          },
        })
      } catch (error) {
        set((state) => ({ history: { ...state.history, loading: false, error: toError(error, 'Unable to load battle history.') } }))
      }
    },

    reset: () =>
      set({
        bootstrappedFor: null,
        bootstrapping: false,
        bootstrapError: null,
        dna: freshSlice<IDNA>(),
        dashboard: freshSlice<DashboardData>(),
        history: freshSlice<HistoryData>(),
      }),
  }
})
