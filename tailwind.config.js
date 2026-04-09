import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,vue}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#10b981'
      },
      animation: {
        'gradient-slow': 'gradient 8s ease infinite'
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          }
        }
      },
      typography: {
        DEFAULT: {
          css: {
            a: {
              color: '#3b82f6',
              '&:hover': {
                color: '#2563eb'
              }
            },
            h1: {
              color: '#1e293b'
            },
            h2: {
              color: '#1e293b'
            },
            h3: {
              color: '#1e293b'
            }
          }
        }
      }
    }
  },
  plugins: [typography]
}
