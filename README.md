# MotorQuote Frontend (Next.js)

This project now runs on [Next.js 14](https://nextjs.org/) with the App Router and Tailwind CSS. It renders a responsive MotorQuote admin login experience using modern React Server/Client Components.

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to view the app. Production builds run with `npm run build && npm start`.

## Tech Stack

- Next.js App Router
- React 18 function components
- Tailwind CSS + PostCSS
- Yup for client-side validation

## Project Structure

- `app/` – App Router entrypoints (`layout.jsx`, `page.jsx`, `globals.css`)
- `components/` – Reusable UI pieces (`Login`, `common`, `config`)
- `public/assets` – Static images referenced by the login page

## Linting & Formatting

`npm run lint` runs `next lint` with the `next/core-web-vitals` ruleset. Tailwind classes are applied directly in JSX; consider adding plugins like `prettier-plugin-tailwindcss` if you need class sorting.
