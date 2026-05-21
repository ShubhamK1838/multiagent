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
        gray: {
          50: 'var(--gray-50, #f9fafb)',
          100: 'var(--gray-100, #f3f4f6)',
          200: 'var(--gray-200, #e5e7eb)',
          300: 'var(--gray-300, #d1d5db)',
          400: 'var(--gray-400, #9ca3af)',
          500: 'var(--gray-500, #6b7280)',
          600: 'var(--gray-600, #4b5563)',
          700: 'var(--gray-700, #374151)',
          800: 'var(--gray-800, #1f2937)',
          900: 'var(--gray-900, #111827)',
          950: 'var(--gray-950, #030712)',
        },
        violet: {
          300: 'var(--accent-300, #c4b5fd)',
          400: 'var(--accent-400, #a78bfa)',
          500: 'var(--accent-500, #8b5cf6)',
          600: 'var(--accent-600, #7c3aed)',
          700: 'var(--accent-700, #6d28d9)',
        },
        surface: {
          50: '#f8f9fa',
          100: '#1a1b1e',
          200: '#141517',
          300: '#0f1011',
        },
        accent: {
          DEFAULT: 'var(--accent-600, #7c3aed)',
          hover: 'var(--accent-700, #6d28d9)',
          light: 'var(--accent-500, #8b5cf6)',
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
