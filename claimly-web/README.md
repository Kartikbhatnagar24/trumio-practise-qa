# claimly-web

The Claimly website: an expense-claims tool for employees, managers and finance admins. React, TypeScript, Vite, Tailwind and shadcn primitives; served by nginx in the image.

## Run

```bash
npm ci
npm run dev        # http://localhost:7450, calls the API on 7460 through /api
npm test
npm run build
```

Point the dev server at another API with `API_UPSTREAM=http://127.0.0.1:7462 npm run dev`.

Log in with the practice accounts listed on the login page (password `Claimly@2026`).

## Env values (image)

| Name | Default | Meaning |
|---|---|---|
| `PORT` | `7450` | nginx listen port |
| `API_UPSTREAM` | `http://127.0.0.1:7460` | Where nginx forwards `/api/*` |
| `CLAIMLY_VARIANT` | unset | Same JSON as the API. Only its `api` and `ui` parts reach the browser |
| `CLAIMLY_BUGS` | unset | Same codes as the API. Only the website's own codes reach the browser |

On start the container writes `env-config.js`, which the app reads as `window.__ENV__`. Locally that file is empty and the app runs the default variant.

The app works under any path prefix (relative assets, hash routes, relative `api/` calls), so it loads through code-server's `/proxy/<port>/` URL.

## Code layout

Component → store (Zustand) → `actions/*-actions.ts` → `services/*-service.ts` → axios. Every URL is in `src/utils/api.ts`. Design notes are in `DESIGN.md`.
