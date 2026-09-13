export interface IThemeVars {
  bg: string
  surface: string
  surfaceElevated: string
  surfaceRaised: string
  border: string
  borderHover: string
  text: string
  textMuted: string
  textSubtle: string
  primary: string
  secondary: string
  accent: string
  shadow: string
}

export interface ITheme {
  themeId: string
  name: string
  description: string
  vars: IThemeVars
  isLight: boolean
  isDefault: boolean
}

/** CSS variables driven by the active theme (channels: "R G B"). */
export const THEME_VAR_KEYS = [
  ['bg', '--bg'],
  ['surface', '--surface'],
  ['surfaceElevated', '--surface-elevated'],
  ['surfaceRaised', '--surface-raised'],
  ['border', '--border'],
  ['borderHover', '--border-hover'],
  ['text', '--text'],
  ['textMuted', '--text-muted'],
  ['textSubtle', '--text-subtle'],
  ['primary', '--primary'],
  ['secondary', '--secondary'],
  ['accent', '--accent'],
  ['shadow', '--shadow'],
] as const

export function hexToChannels(hex: string): string {
  let h = hex.trim().replace('#', '')
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = [...h].map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return '0 0 0'
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/** Paint the theme onto :root. Pure DOM write — safe before React mounts. */
export function paintThemeVars(vars: IThemeVars): void {
  const root = document.documentElement
  for (const [field, cssVar] of THEME_VAR_KEYS) {
    root.style.setProperty(cssVar, hexToChannels(vars[field]))
  }
}

export function paintColorScheme(isLight: boolean): void {
  document.documentElement.style.colorScheme = isLight ? 'light' : 'dark'
}
