/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a5e3f',
          dark: '#123f2a',
          light: '#237a53',
          50: '#e8f3ee',
          100: '#c9e3d5',
          600: '#1a5e3f',
          700: '#154d33',
        },
        /* Blue accent for primary actions (buttons, tabs, links, focus) while
           the green `primary` stays as the government brand color used by the
           sidebar, logo and watermark. */
        accent: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#60a5fa',
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        risk: {
          high: '#dc2626',
          medium: '#f59e0b',
          low: '#16a34a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
}
