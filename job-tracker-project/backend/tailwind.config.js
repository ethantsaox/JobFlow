/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'matcha': {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bde5bd',
          300: '#8fd48f',
          400: '#5cbf5c',
          500: '#3aa83a',
          600: '#2d8a2d',
          700: '#276d27',
          800: '#245724',
          900: '#1f471f',
        },
        'tulip': {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        'spanish': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        }
      },
      fontFamily: {
        script: ['Dancing Script', 'cursive'],
        cute: ['Quicksand', 'sans-serif'],
      },
    },
  },
  plugins: [],
}