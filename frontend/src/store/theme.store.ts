import { create } from 'zustand'
import { themeService } from '../services/theme.service'
import { userService } from '../services/user.service'
import { useAuthStore } from './auth.store'
import { paintColorScheme, paintThemeVars, type ITheme } from '../utils/theme'

const STORAGE_KEY = 'devarena:themeId'

function storedThemeId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeThemeId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // persistence is best-effort
  }
}

interface ThemeState {
  themes: ITheme[]
  activeThemeId: string
  defaultThemeId: string
  loading: boolean
  error: string | null
  saving: boolean
  loadThemes: () => Promise<void>
  setTheme: (themeId: string) => Promise<void>
  syncWithUser: (themeId: string | null | undefined) => void
}

function applyTheme(themes: ITheme[], themeId: string, fallbackId: string): string {
  const theme =
    themes.find((t) => t.themeId === themeId) ??
    themes.find((t) => t.themeId === fallbackId) ??
    themes[0]
  if (!theme) return themeId
  paintThemeVars(theme.vars)
  paintColorScheme(theme.isLight)
  return theme.themeId
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themes: [],
  activeThemeId: storedThemeId() ?? 'midnight',
  defaultThemeId: 'midnight',
  loading: false,
  error: null,
  saving: false,

  loadThemes: async () => {
    if (get().loading || get().themes.length > 0) return
    set({ loading: true, error: null })
    try {
      const data = await themeService.getThemes()
      const userThemeId = useAuthStore.getState().user?.settings?.themeId ?? null
      const wanted = userThemeId ?? storedThemeId() ?? data.defaultThemeId
      const active = applyTheme(data.themes, wanted, data.defaultThemeId)
      storeThemeId(active)
      set({ themes: data.themes, defaultThemeId: data.defaultThemeId, activeThemeId: active, loading: false })
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Unable to load themes.' })
    }
  },

  setTheme: async (themeId: string) => {
    const { themes, defaultThemeId, activeThemeId } = get()
    if (themeId === activeThemeId || get().saving) return
    const active = applyTheme(themes, themeId, defaultThemeId)
    storeThemeId(active)
    set({ activeThemeId: active, saving: true })
    try {
      const settings = await userService.updateSettings({ themeId: active })
      const user = useAuthStore.getState().user
      if (user) useAuthStore.getState().setUser({ ...user, settings })
    } catch {
      // Theme stays applied locally; server sync retries on next change.
    } finally {
      set({ saving: false })
    }
  },

  syncWithUser: (themeId: string | null | undefined) => {
    const { themes, defaultThemeId, activeThemeId } = get()
    if (!themeId || themeId === activeThemeId) return
    if (themes.length === 0) return
    const active = applyTheme(themes, themeId, defaultThemeId)
    storeThemeId(active)
    set({ activeThemeId: active })
  },
}))

/** Instant paint before React mounts (avoids a theme flash on reload). */
export function paintBootTheme(): void {
  const id = storedThemeId()
  if (!id) return
  void themeService
    .getThemes()
    .then((data) => {
      const theme = data.themes.find((t) => t.themeId === id)
      if (theme) {
        paintThemeVars(theme.vars)
        paintColorScheme(theme.isLight)
      }
    })
    .catch(() => undefined)
}
