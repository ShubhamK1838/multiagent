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
        },
        jarvis: {
          bg: '#020b18',
          navy: '#030f1c',
          panel: '#071520',
          border: '#0d2d40',
          cyan: '#00d4ff',
          'cyan-dim': '#00a8cc',
          'cyan-glow': 'rgba(0,212,255,0.3)',
          blue: '#0080ff',
          'blue-dim': '#005acc',
          text: '#b0e8f0',
          'text-dim': '#4a7a8a',
          'text-bright': '#e0f8ff',
          alert: '#ff6b35',
          success: '#00ff88',
          warning: '#ffcc00',
        },
      },
      keyframes: {
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '0.3', transform: 'scale(1.05)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'data-cascade': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
      },
      animation: {
        'scan': 'scan 4s linear infinite',
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
      },
    }
  },
  plugins: []
}
