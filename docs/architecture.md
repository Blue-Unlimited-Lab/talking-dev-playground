# Architecture

## Goals

This playground should stay easy to extend, easy to test, and easy to clean up. Each experiment is a feature namespace. Removing an experiment should mean deleting its namespace folder and removing its registry import.

## Framework Choice

Use Next.js with the App Router because it gives us React, server routes, static rendering, and deployment defaults without assembling a custom toolchain. Keep dependencies boring and common.

## Namespace Layout

Each feature belongs in:

```text
src/features/<namespace>/
  web/
  api/v1/
  persistence/
  migrations/
  index.ts
```

The namespace must be lowercase URL-safe text: letters, numbers, and hyphens. Examples: `todo`, `george`, `test-streaming`.

Web URLs are dispatched through `/<namespace>/*`. API URLs are dispatched through `/API/v1/<namespace>/*`. Feature-local route paths stay relative to the namespace, like `/`, `/create`, or `/edit/123`.

## Feature Registration

A feature exports a `FeatureDefinition` from `src/features/<namespace>/index.ts`. The central registry in `src/features/index.ts` imports enabled features and passes them to `createFeatureRegistry`.

The registry validates namespace names, rejects duplicates, and sorts features for stable presentation.

## Persistence And Migrations

Keep persistence adapters inside `src/features/<namespace>/persistence`. Keep migrations inside `src/features/<namespace>/migrations`. Shared persistence helpers can be added later only when two real namespaces need the same behavior.

## TDD Workflow

Start behavior changes with a failing test close to the feature. Prefer Vitest and Testing Library for components and pure logic. Use Playwright for workflows that need a real browser or route integration.

Before each commit, run:

```sh
npm test
npm run build
npm run test:e2e
```

Keep commits small enough that a failed test points to one decision.
