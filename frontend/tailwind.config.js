/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: '#0A0A0C',
          surface: '#151518',
          surface2: '#1D1D22',
          border: '#2A2A31',
          text: '#EDEDEF',
          muted: '#8B8B94',
          orange: '#FF5A1F',
          red: '#E8342A',
          gold: '#FFC24B',
        },
      },
      fontFamily: {
        display: ['"Rajdhani"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(255, 90, 31, 0.25)',
      },
    },
  },
  plugins: [],
};
