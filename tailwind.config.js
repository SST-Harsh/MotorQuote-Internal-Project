/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
      },
      fontFamily: {
        racing: ['Racing Sans One', 'sans-serif'],
        public: ['Public Sans', 'sans-serif'],
      },
      backgroundImage: {
        'motorquote-overlay':
          'linear-gradient(to bottom, rgba(25, 87, 255, 0.05) 0%, rgba(25, 87, 255, 0.7) 50%, rgba(25, 87, 255, 0.95) 100%)',
      },
    },
  },
  plugins: [],
};
