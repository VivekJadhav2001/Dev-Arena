/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        surfaceElevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
        surfaceRaised: 'rgb(var(--surface-raised) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        borderHover: 'rgb(var(--border-hover) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        textMuted: 'rgb(var(--text-muted) / <alpha-value>)',
        textSubtle: 'rgb(var(--text-subtle) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        primaryGlow: 'rgb(var(--primary) / 0.12)',
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        secondaryGlow: 'rgb(var(--secondary) / 0.12)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        danger: '#ff4757',
        warning: '#ffa502',
        success: '#00d4aa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Syne', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, rgb(var(--text) / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--text) / 0.05) 1px, transparent 1px)',
        'glow-radial': 'radial-gradient(circle at 50% 0%, rgb(var(--secondary) / 0.15), transparent 60%)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgb(var(--primary) / 0.35)',
        card: '0 8px 30px -12px rgb(var(--shadow) / 0.6)',
      },
    },
  },
  plugins: [],
}
