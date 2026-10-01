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
        bg: '#0B0F14',
        panel: '#121821',
        'panel-2': '#18212D',
        'panel-3': '#1E293B',
        line: '#243041',
        'line-light': '#334155',
        'text-main': '#E6EDF5',
        'text-muted': '#8A97A8',
        'text-dim': '#57677D',
        signal: {
          green: '#3DDC97',
          amber: '#FFB547',
          red: '#FF5C6C',
          cyan: '#4CC9F0',
          violet: '#A78BFA',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
