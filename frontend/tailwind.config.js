/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#090D16',
        panel: '#0E1424',
        'panel-2': '#141C30',
        'panel-3': '#1B253F',
        line: '#1F293D',
        'line-light': '#2E3D59',
        'text-main': '#F1F5F9',
        'text-muted': '#94A3B8',
        'text-dim': '#64748B',
        brand: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
          subtle: '#1E1B4B',
        },
        signal: {
          green: '#10B981',
          amber: '#F59E0B',
          red: '#F43F5E',
          cyan: '#0EA5E9',
          violet: '#8B5CF6',
          indigo: '#6366F1',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
