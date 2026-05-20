/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          50: '#f8f9fa',
          100: '#1a1b1e',
          200: '#141517',
          300: '#0f1011',
        },
        accent: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
          light: '#8b5cf6',
        },
        terminal: {
          green: '#4ade80',
          yellow: '#facc15',
          red: '#f87171',
          blue: '#60a5fa',
          purple: '#c084fc',
          cyan: '#22d3ee',
        }
      }
    }
  },
  plugins: []
}
