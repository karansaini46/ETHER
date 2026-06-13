import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#020204',
        dark: '#0a0a0f',
        panel: 'rgba(10, 10, 15, 0.75)',
        cyber: {
          blue: '#00d4ff',
          purple: '#7c3aed',
          amber: '#ff6b35',
          pink: '#ec4899',
          green: '#22c55e',
          red: '#ff2d55',
          slate: '#94a3b8',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        interface: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 212, 255, 0.35)',
        'neon-purple': '0 0 15px rgba(124, 58, 237, 0.35)',
        'neon-red': '0 0 15px rgba(255, 45, 85, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit': 'orbit 60s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
