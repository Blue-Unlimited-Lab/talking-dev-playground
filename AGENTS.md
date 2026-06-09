# Agent Instructions

Follow these project rules when changing the playground.

- Use TDD for new behavior: write or update the relevant test first, then implement the smallest change that passes.
- Keep experiments inside `src/features/<namespace>` with `web`, `api/v1`, `persistence`, `migrations`, and `index.ts` as needed.
- Route web behavior through `/<namespace>/*` and API behavior through `/API/v1/<namespace>/*`.
- Keep namespaces lowercase and URL-safe: letters, numbers, and hyphens.
- Register enabled namespaces through `src/features/index.ts`.
- Prefer local feature code over shared abstractions until at least two namespaces need the same helper.
- Use `docker compose up --build` for containerized development. Keep Compose mounting the repository and keep `node_modules` plus `.next` in named volumes.
- Run `npm test`, `npm run build`, and `npm run test:e2e` before committing.
- Make separate commits for separate steps.

`AGENTS.md` is the right place for repo-level directives aimed at AI coding agents. Keep human-facing explanations in `README.md` and architecture decisions in `docs/architecture.md`.
