# Midway Derby

A browser-based pixel carnival horse race built with React 19, TypeScript, Vite, Tailwind CSS 4, and Radix UI components. No Lovable services, server runtime, database, or environment variables are required. Race history is saved in the visitor's browser using localStorage.

## Local development

Use Node.js 22.12 or newer (Node 22 LTS recommended).

```sh
npm ci
npm run dev
```

## Verification and production build

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Vite writes the static site to `dist/`.

## Host on Netlify

Push this repository to GitHub, then import it as a new project in Netlify. The included `netlify.toml` sets:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `22`

Leave the base directory unset when deploying this repository's root. Netlify installs dependencies from `package-lock.json` and deploys on pushes to the connected branch. The SPA rewrite supports direct navigation; unknown paths display the app's 404 screen.

For a manual upload, run `npm ci` and `npm run build`, then upload the `dist` folder at https://app.netlify.com/drop.
