# Talking Dev Playground

A small Next.js playground for experiments around the Talking Dev AI app.

## Stack

- Next.js App Router
- TypeScript
- Vitest and Testing Library for unit/component tests
- Playwright for browser smoke tests

## Commands

`npm run dev` starts the app.
`npm test` runs Vitest.
`npm run test:e2e` runs Playwright.
`npm run build` checks the production build.

## Docker Dev

`docker compose up --build` starts the app at `http://localhost:3000`.

Compose mounts this codebase into the container for live edits. `node_modules` and `.next` stay in Docker volumes so host dependencies and container dependencies do not overwrite each other.

## Feature Namespaces

Experiments live under `src/features/<namespace>`. A namespace owns its web routes, API routes, persistence code, migrations, and public registration from one folder.

See `docs/architecture.md` for the conventions agents and humans should follow.
