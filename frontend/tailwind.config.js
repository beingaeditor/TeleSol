/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TeleSol NOC Dark Theme
        telesol: {
          bg: '#0D1117',
          card: '#1A2332',
          border: '#374151',
          cyan: '#00D9FF',
          green: '#00FF88',
          orange: '#FF8C00',
          purple: '#9B59B6',
          red: '#FF4444',
          yellow: '#FFE135',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
