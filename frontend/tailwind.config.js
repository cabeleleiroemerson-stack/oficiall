/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1034A6',
          hover: '#0D2A85'
        },
        secondary: {
          DEFAULT: '#0A1F5C'
        },
        accent: {
          DEFAULT: '#1548C9'
        },
        background: '#FAFAFA',
        paper: '#FFFFFF',
        textPrimary: '#1B262C',
        textSecondary: '#52616B',
        textMuted: '#9CA3AF'
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif']
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
      boxShadow: {
        card: '0 8px 30px rgb(0 0 0 / 0.04)',
        'card-hover': '0 8px 30px rgb(0 0 0 / 0.08)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}
