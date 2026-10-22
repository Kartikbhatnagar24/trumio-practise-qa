# claimly-api

Expense-claims API for the Claimly practice app. FastAPI on SQLite, seeded with a company of 48 people and about 220 claims. Swagger UI at `/docs`.

## Run

```bash
uv sync
uv run python -m app          # http://localhost:7460/docs
uv run pytest -q
uv run ruff check . && uv run ruff format --check .
```

Every start and every `POST /reset` rebuilds the database from `seed/default.json`, with the seed's dates moved so the newest claims are a few days old.

## Logins

Every account uses the password `Claimly@2026`.

| Email | Role |
|---|---|
| `asha.verma@claimly.in` | Employee (grade G2), reports to Rahul |
| `rahul.mehta@claimly.in` | Manager |
| `neha.iyer@claimly.in` | Finance admin |

Log in with `POST /auth/login`, then send `Authorization: Bearer <access_token>` (the **Authorize** button in Swagger).

## Env values

| Name | Default | Meaning |
|---|---|---|
| `PORT` | `7460` | Listen port |
| `DB_PATH` | `/tmp/claimly.db` | SQLite file |
| `RECEIPTS_DIR` | `/tmp/claimly-receipts` | Uploaded receipts |
| `SEED_PATH` | `seed/default.json` | Seed data |
| `CLAIMLY_VARIANT` | unset | JSON of the learner's variant: API names, rule numbers, UI options. Unset runs the default |
| `CLAIMLY_BUGS` | unset | Comma-separated codes of planted bugs. Unknown codes stop the app from starting |

## Seed data

`scripts/generate_seed.py` writes `seed/default.json` deterministically:

```bash
uv run python scripts/generate_seed.py > seed/default.json
```

Unit tests use the small `tests/seed_minimal.json` instead.
