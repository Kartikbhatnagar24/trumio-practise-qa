# trumio-practise-qa

Practice apps that QA learners test from their Coder workspace. Each app is one Docker image; behaviour is picked at runtime with env values, never with a separate build.

| App | Port | What it is |
|---|---|---|
| `bookhub-web` | 7410 | React bookshop: login, catalog (search, filters, sort, paging), book detail, cart (coupon, remove dialog), 3-step checkout, order confirmation, admin "Add book" modal |
| `bookhub-api` | 7420 | FastAPI bookshop API on SQLite. Swagger UI at `/docs` (`/` redirects there) |
| `claimly-web` | 7450 | Expense-claims app for employees, managers and finance: claims list, two-step claim form, approvals, policy page. See `claimly-web/README.md` |
| `claimly-api` | 7460 | FastAPI expense-claims API on SQLite. Swagger UI at `/docs`. See `claimly-api/README.md` |
| `catalog/claimly.json` | — | Claimly's variant options and planted-bug list, read by the platform when it sets up a learner's workspace. Never shipped in an image |
| `app-preview-extension` | — | VS Code extension installed in QA workspaces: one status bar button per app listed in `TRIDE_APP_PREVIEWS` (e.g. `Shop:7410,API docs:7420/docs`), each opening the app in a panel. CI commits `builds/app-preview-<version>.vsix`; bump `version` in its `package.json` to publish a new file |

## Run locally

```bash
# API
cd bookhub-api
python -m venv .venv && .venv/Scripts/pip install -r requirements-dev.txt   # .venv/bin/pip on Linux/macOS
.venv/Scripts/python -m app                                                # http://localhost:7420/docs
.venv/Scripts/python -m pytest -q

# Web (mock data built in)
cd bookhub-web
npm ci
npm run dev                                                                # http://localhost:7410
VITE_API_MODE=api npm run dev                                              # same UI, calls the API on 7420
```

Demo accounts: `customer@bookhub.test` / `Customer@123`, `admin@bookhub.test` / `Admin@123`. Coupon: `SAVE10`. Free shipping from $50.

## Env values

**bookhub-api**

| Name | Default | Meaning |
|---|---|---|
| `PORT` | `7420` | Listen port |
| `DB_PATH` | `/tmp/bookhub.db` | SQLite file, rebuilt from seed on every start and on `POST /reset` |
| `SEED_PATH` | `seed/default.json` | Seed data |

**bookhub-web**

| Name | Default | Meaning |
|---|---|---|
| `PORT` | `7410` | nginx listen port |
| `API_MODE` | `mock` | `mock` = built-in demo data (FE-only track), `api` = call the API |
| `API_UPSTREAM` | `http://127.0.0.1:7420` | Where nginx forwards `/api/*` when `API_MODE=api` |

The web app works under any path prefix (relative assets, hash routes, relative `api/` calls), so it loads through code-server's `/proxy/<port>/` URL.

## Images

`.github/workflows/images.yml` builds both apps on every push to `tru-dev` that touches them and pushes to the GitHub Container Registry of whoever owns the repo:

- `ghcr.io/<owner>/bookhub-api:<sha>` and `:latest`
- `ghcr.io/<owner>/bookhub-web:<sha>` and `:latest`
- `ghcr.io/<owner>/claimly-api:<sha>` and `:latest`
- `ghcr.io/<owner>/claimly-web:<sha>` and `:latest`

## Workspace layouts

| Track | Containers next to `dev` | Env |
|---|---|---|
| FE only | `bookhub-web` | `API_MODE=mock` |
| BE only | `bookhub-api` | — |
| Integrated | `bookhub-web` + `bookhub-api` | web: `API_MODE=api` |

Containers in one pod share `localhost`, so the web container reaches the API at `127.0.0.1:7420`.
