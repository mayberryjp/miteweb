# Copilot Instructions — miteweb

## Build & Dev Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server on http://localhost:3030
npm run build        # Type-check (vue-tsc) then production build (vite)
npm run preview      # Preview production build locally
```

No test runner or linter is configured.

## Architecture

This is the **Vue 3 frontend** for [Mite](https://github.com/mayberryjp/miteweb), a syslog monitoring and alerting system. The backend is a separate service exposing a REST API at `/api`. In production, nginx reverse-proxies `/api/` requests to the backend container (`mite-backend:8080`).

### Layers

- **`src/services/`** — Thin API wrappers around Axios. Each file maps to one backend resource (`logs.ts`, `alerts.ts`, `actions.ts`, `rules.ts`, `system.ts`). All use the shared `api.ts` Axios instance.
- **`src/types/index.ts`** — All TypeScript interfaces live in a single file. Import with `import type { ... } from "@/types"`.
- **`src/views/`** — Page-level components, one per route: Dashboard, Logs, Alerts, Hosts, Rules, AI (list + detail), Settings.
- **`src/components/`** — Reusable UI components (`SeverityBadge`, `StatsCard`, `StatusBadge`, `NotificationsBell`, etc.) and `layout/AppLayout.vue` which provides the sidebar + top bar shell.
- **`src/router/`** — Vue Router with HTML5 history mode. All routes are children of `AppLayout`, defined in `routes/appRoutes.ts`.

### State Management

Pinia is installed and configured in `main.ts`. The `usePatternsStore` (`src/stores/patterns.ts`) caches discovered patterns + hourly stats for the pattern list and detail views. Other views fetch data directly via service functions.

## Conventions

- **Path alias**: `@` maps to `src/` (configured in `vite.config.ts`). Always use `@/` imports.
- **API base URL**: Set via `VITE_API_BASE_URL` env var; defaults to `/api` for production (nginx proxy).
- **Component style**: Vue 3 `<script setup lang="ts">` with Composition API throughout.
- **Styling**: Plain CSS in `<style scoped>` blocks and a global `src/style.css`. No CSS framework.
- **Markdown rendering**: Uses the `marked` library (for AI analysis reports).

## Docker

The frontend is containerized with a multi-stage build (Node → nginx). In `docker-compose.yml` it runs alongside the backend:
- Frontend: port `8088:80`
- Backend: port `8080:8080`, syslog on `1514/udp` and `1515/tcp`
