/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#07080d',
        surface: '#0e1016',
        surfaceElevated: '#151824',
        surfaceRaised: '#1b1f2e',
        border: '#232738',
        borderHover: '#343a52',
        text: '#e8eaf2',
        textMuted: '#9aa1b5',
        textSubtle: '#5d6478',
        primary: '#00d4aa',
        primaryGlow: 'rgba(0, 212, 170, 0.12)',
        secondary: '#7c5cff',
        secondaryGlow: 'rgba(124, 92, 255, 0.12)',
        accent: '#ff5c8a',
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
          'linear-gradient(to right, rgba(120, 128, 160, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(120, 128, 160, 0.06) 1px, transparent 1px)',
        'glow-radial': 'radial-gradient(circle at 50% 0%, rgba(124, 92, 255, 0.15), transparent 60%)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(0, 212, 170, 0.35)',
        card: '0 8px 30px -12px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
