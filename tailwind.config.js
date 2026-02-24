/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'sidebar-bg': 'rgb(var(--color-sidebar-bg) / <alpha-value>)',
        'sidebar-text': 'rgb(var(--color-sidebar-text) / <alpha-value>)',
        'sidebar-active-bg': 'rgb(var(--color-sidebar-active-bg) / <alpha-value>)',
        'sidebar-active-text': 'rgb(var(--color-sidebar-active-text) / <alpha-value>)',
        'sidebar-border': 'rgb(var(--color-sidebar-border) / <alpha-value>)',
        'sidebar-heading': 'rgb(var(--color-sidebar-heading) / <alpha-value>)',
        'sidebar-hover': 'rgb(var(--color-sidebar-hover) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        'text-dark': 'rgb(var(--color-text-dark) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'sans-serif'],
      },
      backgroundImage: {
        'motorquote-overlay':
          'linear-gradient(to bottom, rgba(25, 87, 255, 0.05) 0%, rgba(25, 87, 255, 0.7) 50%, rgba(25, 87, 255, 0.95) 100%)',
      },
    },
  },
  plugins: [],
};
