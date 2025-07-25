// ===============================
// tailwind.config.js
// ===============================
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f7fa', // Light Cyan
          100: '#b2ebf2', // Pale Cyan
          200: '#80deea', // Light Blue Cyan
          300: '#4dd0e1', // Cyan
          400: '#26c6da', // Medium Cyan
          500: '#00bcd4', // Deep Cyan (Main Primary)
          600: '#00acc1', // Dark Cyan
          700: '#0097a7', // Very Dark Cyan
          800: '#00838f', // Deep Dark Cyan
          900: '#006064', // Darkest Cyan
          950: '#00363a', // Near Black Cyan
        },
        secondary: {
          50: '#fff3e0', // Light Orange
          100: '#ffe0b2', // Pale Orange
          200: '#ffcc80', // Light Amber
          300: '#ffb74d', // Amber
          400: '#ffa726', // Medium Amber
          500: '#ff9800', // Deep Orange (Main Secondary)
          600: '#fb8c00', // Dark Orange
          700: '#f57c00', // Very Dark Orange
          800: '#ef6c00', // Deep Dark Orange
          900: '#e65100', // Darkest Orange
          950: '#bf360c', // Near Black Orange
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efad',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#0f3d22',
        },
        neutral: {
          50: '#f8fafc', // Slate 50
          100: '#f1f5f9', // Slate 100
          200: '#e2e8f0', // Slate 200
          300: '#cbd5e1', // Slate 300
          400: '#94a3b8', // Slate 400
          500: '#64748b', // Slate 500
          600: '#475569', // Slate 600
          700: '#334155', // Slate 700
          800: '#1e293b', // Slate 800
          900: '#0f172a', // Slate 900
          950: '#020617', // Slate 950
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'custom-light': '0 4px 15px rgba(0, 0, 0, 0.05)',
        'custom-medium': '0 10px 30px rgba(0, 0, 0, 0.1)',
        'custom-heavy': '0 20px 50px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}