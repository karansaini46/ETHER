import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#020408',
        nebula: '#0d1117',
        cyan: '#00d4ff',
        purple: '#7c3aed',
        amber: '#ff6b35',
        red: '#ff2d55',
      },
    },
  },
  plugins: [],
} satisfies Config
