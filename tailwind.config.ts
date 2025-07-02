import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pregnancy-friendly color palette - soft, calming colors
        primary: {
          50: '#fef5f1',
          100: '#fde6de',
          200: '#facfc0',
          300: '#f6ac98',
          400: '#ef7d5f',
          500: '#e85b3c',
          600: '#d4412a',
          700: '#b23021',
          800: '#932a21',
          900: '#7a2720',
          950: '#421109',
        },
        secondary: {
          50: '#f5f9f5',
          100: '#e7f2e8',
          200: '#d0e4d2',
          300: '#aacfad',
          400: '#7db281',
          500: '#5c955f',
          600: '#487949',
          700: '#3b613c',
          800: '#334e33',
          900: '#2a412b',
          950: '#142214',
        },
        accent: {
          50: '#fef8ef',
          100: '#fdedd8',
          200: '#f9d7af',
          300: '#f5b97c',
          400: '#f09247',
          500: '#ed7823',
          600: '#de5d18',
          700: '#b84517',
          800: '#93381a',
          900: '#772f19',
          950: '#40170b',
        },
        neutral: {
          50: '#f8f8f8',
          100: '#f0f0f0',
          200: '#e4e4e4',
          300: '#d1d1d1',
          400: '#b4b4b4',
          500: '#9a9a9a',
          600: '#818181',
          700: '#6a6a6a',
          800: '#5a5a5a',
          900: '#4e4e4e',
          950: '#282828',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [],
}
export default config