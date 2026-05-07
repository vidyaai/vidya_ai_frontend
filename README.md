# VidyaAI Frontend

This repository currently contains multiple frontend code paths, but the active app is the root Next.js project.

## Active App

- App root: `./`
- Framework: Next.js App Router
- Main routes live in `src/app`
- Main shared UI lives in `src/components`

Common commands:

```bash
corepack yarn dev
corepack yarn build
corepack yarn lint
```

The default local dev server runs at `http://localhost:3000`.

## Repo Layout

- `src/app`: active Next.js routes
- `src/components`: shared React components used by the active app
- `public`: static assets used by the active app
- `docs`: product and implementation notes
- `vidya-ai-landing-page`: separate nested landing-page project kept in the repo intentionally
- `src/App.jsx`, `src/main.jsx`, `index.html`, `vite.config.js`: legacy Vite-era files retained for compatibility/reference

## Environment

1. Copy `.env.local.example` to `.env.local`
2. Adjust values for the environment you want to use
3. Start the app with `corepack yarn dev`

## Working Safely In This Repo

- Do not restructure the repository without explicit team agreement
- Treat `vidya-ai-landing-page/` and the legacy Vite files as retained paths, not cleanup targets by default
- Keep cleanup changes narrow and path-local to reduce merge conflicts
- Avoid mixing documentation cleanup with dependency or lockfile changes unless needed

## Notes

- The root `tsconfig.json` excludes `vidya-ai-landing-page/`
- The active Next.js app does not currently define a `/translate` route
- `corepack` is recommended because the repo declares Yarn via `packageManager`
