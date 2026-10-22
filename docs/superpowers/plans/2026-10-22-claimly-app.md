# Claimly App (Plan 1 of 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Claimly, a realistic expense-claims practice app (FastAPI API + React web, two images). Each learner's variant and planted bugs are applied at runtime from env; with no env it runs a clean default.

**Architecture:**
- **`claimly-api/`:** a FastAPI app built by `create_app(variant, bugs)`. The variant renames URL paths and JSON fields at startup, and planted bugs are toggled by opaque codes. SQLite in `/tmp`, seeded from JSON, `POST /reset`.
- **`claimly-web/`:** a React SPA. It reads the UI variant and its UI bug codes from runtime `env-config.js`, fetches the rules from `GET /policy`, and talks to the API through nginx `/api/`.
- **`catalog/claimly.json`:** describes every variant slot and bug for Plan 2, which picks per-learner values and wires the platform.

**Tech Stack:**
- API: Python 3.12, FastAPI, pydantic-settings, python-jose, uv, ruff, pytest.
- Web: React 19, TypeScript 5.7, Vite 6, Tailwind 4, shadcn (new-york), Zustand 5, axios, react-router-dom 7, react-hook-form + zod, vitest.
- Packaging: nginx (web image), GitHub Actions to GHCR.

**Spec:** `docs/superpowers/specs/2026-10-22-claimly-design.md`

**Out of this plan (Plan 2):**
- the variant/bug pick in `program_consumer_service`;
- the code-mapping storage;
- Coder template params;
- the `practice_apps_md` record;
- the starter `{app_context}`.

## Global Constraints

**Repo and branch**
- Repo `C:\Users\karti\Desktop\trumio\trumio-practise-qa`. Work on branch `feat/claimly`, cut from `tru-dev`. Don't touch `bookhub-*`.
- Commit messages: commitizen (`feat(claimly-api): …`), plain and short. No Claude attribution, no Co-Authored-By. Never `--no-verify`.

**Code style**
- No explanatory comments in code. Enums, not `Literal`.
- Python: single quotes, line length 200, ruff (`extend-select = ["I"]`, `quote-style = "single"`), Python 3.12.

**Layouts to copy**
- API layout mirrors `backend/trumio-program-be`: `app/api/v1/`, `app/services/`, `app/models/`, `app/core/` (config, database), `app/static/` (enums, messages).
  - Routes stay thin.
  - User-facing error strings live in `app/static/messages.py`.
- Web layout mirrors `frontend/flex-project-advisor-fe`:
  - `src/components/ui/` (shadcn) and feature folders `src/components/<feature>/`;
  - `src/pages/`, `src/stores/<domain>-store.ts`, `src/actions/<domain>-actions.ts`, `src/services/<domain>-service.ts`;
  - `src/utils/api.ts` (every URL), `src/utils/core-utils.ts` (`keysToCamelCase`, `keysToSnakeCase`, `showToastMessage`), `src/utils/<domain>-parsing-utils.ts`, `src/constraints/enums/`, `src/constraints/types/`;
  - `@/` → `src/`; merge classes with `cn()`.
- Web data flow: component → store → action → service → axios.
  - Only services touch axios.
  - Actions own loading flags and error toasts.

**Images and ports**
- Ports: web **7450**, API **7460** (BookHub keeps 7410/7420).
- Both images run as uid 1000. Images: `ghcr.io/kartikbhatnagar24/claimly-{api,web}:<sha>|latest`.

**Environment**
- Env names:
  - `CLAIMLY_VARIANT`: JSON of the full variant. Unset means the default variant.
  - `CLAIMLY_BUGS`: comma-separated opaque codes. Unset means none.
  - `API_UPSTREAM`: web nginx target, default `http://127.0.0.1:7460`.
- The web container receives `CLAIMLY_VARIANT` and `CLAIMLY_BUGS` too. `env-config.js` gets only the `ui` + `api` parts of the variant and only the UI bug codes.
- No readable bug ids anywhere at runtime. Code-to-bug maps live in source (`app/static/bugs.py`, `src/constraints/enums/bug-enums.ts`) and in `catalog/claimly.json`.

**Look and accessibility**
- Built with the `frontend-design` skill: write `claimly-web/DESIGN.md` first, the user OKs it, then build.
- None of the generic AI-made look:
  - no neon or acid accents;
  - no cream `#F4F1EA` with terracotta;
  - no identical rounded cards with `rgba(0,0,0,.1)` shadow;
  - no gradient washes;
  - no ALL-CAPS eyebrow labels;
  - no AI decoration.
- Before handoff, run the `web-design-guidelines` skill over `claimly-web/src`.
- Accessible names on every control; no blanket `data-testid`.

**Money**
- Stored as integer paise. API amounts are decimals with 2 places.
- Fixed rates to INR: `USD 83.25`, `EUR 90.10`, `GBP 105.40`, `INR 1`.
- Conversion = `amount × rate`, rounded half-up to 2 places.

**Data and access**
- Seeded password for every user: `Claimly@2026`. Auth is the `Authorization: Bearer <jwt>` header.
- One uvicorn worker. SQLite at `/tmp/claimly.db`.

## Review Focus

1. **Exact rule boundaries:** an amount exactly at `receipt_required_from`, a claim exactly `max_claim_age_days` old, today's date. The clean app accepts or rejects exactly as the policy page words it. Pinned in Task 5.
2. **A variant with every non-default option:** renamed paths and fields work end to end, including Swagger, filters and errors (`loc` uses the variant field name). Pinned in Tasks 4 and 12.
3. **An unknown or malformed `CLAIMLY_BUGS` / `CLAIMLY_VARIANT`:** the API fails at start with a clear message instead of running clean by accident, so the grader never grades a wrong app. Pinned in Task 2.
4. **Two approvers acting on one claim at once:** the second action gets 409, not a double transition. Pinned in Task 6.
5. **Upload edge cases:** a 0-byte file, an exactly 5 MB file, a disallowed type. Respectively: 422, accepted, 415. Pinned in Task 4.

---

### Task 1: API skeleton, config, database, health and reset

**Files:**
- Create: `claimly-api/pyproject.toml`, `claimly-api/app/__init__.py`, `claimly-api/app/main.py`, `claimly-api/app/core/config.py`, `claimly-api/app/core/database.py`, `claimly-api/app/api/v1/system.py`, `claimly-api/app/static/messages.py`, `claimly-api/seed/default.json` (minimal placeholder, replaced in Task 9)
- Test: `claimly-api/tests/conftest.py`, `claimly-api/tests/test_system.py`

**Interfaces:**
- Produces:
  - `Settings` (pydantic-settings), fields: `db_path: Path = /tmp/claimly.db`, `seed_path: Path`, `jwt_secret: str = 'claimly-dev-secret'`, `claimly_variant: str | None`, `claimly_bugs: str | None`.
  - `database.connect() -> sqlite3.Connection` (row factory, `foreign_keys=ON`); `database.reset(seed: dict) -> None`; `database.get_db()`, a FastAPI dependency yielding a connection inside a transaction.
  - `create_app(variant: Variant | None = None, bugs: frozenset[Bug] = frozenset()) -> FastAPI` in `app/main.py`. Module-level `app = create_app_from_settings()`.
  - `conftest.py` fixture `client_for(variant=None, bugs=())`, which returns a `TestClient` on a fresh temp DB.

- [ ] **Step 1:** `git checkout tru-dev && git checkout -b feat/claimly`. Create `pyproject.toml` with the program-be ruff/pytest sections and deps `fastapi[standard]`, `pydantic-settings`, `python-jose[cryptography]`, `python-multipart`; dev deps `pytest`, `ruff`, `httpx`.
- [ ] **Step 2: Write failing tests** in `tests/test_system.py`:

```python
def test_health(client):
    assert client.get('/health').json() == {'status': 'ok'}

def test_reset_restores_seed(client):
    client.post('/reset')
    assert client.post('/reset').status_code == 200
```

- [ ] **Step 3:** Run `uv run pytest tests/test_system.py -v`. Expected: FAIL (no app).
- [ ] **Step 4:** Implement the config, the database (schema created inside `reset`), the `system.py` router (`GET /health`, `POST /reset`) and `create_app`. Docs are at `/docs`, with OpenAPI title `Claimly API`.
- [ ] **Step 5:** Run `uv run pytest -v && uv run ruff check . && uv run ruff format --check .`. Expected: PASS, clean.
- [ ] **Step 6:** Commit: `feat(claimly-api): app skeleton with health and reset`.

---

### Task 2: Variant and bug loading

**Files:**
- Create: `claimly-api/app/core/variant.py`, `claimly-api/app/static/bugs.py`, `claimly-api/app/static/enums.py`
- Test: `claimly-api/tests/test_variant.py`

**Interfaces:**
- Produces:
  - Enums in `app/static/enums.py`:
    - `ClaimsPath(str, Enum)`: `CLAIMS='claims'`, `EXPENSES='expenses'`;
    - `AmountField`: `AMOUNT='amount'`, `CLAIM_AMOUNT='claim_amount'`;
    - `MerchantField`: `MERCHANT='merchant'`, `VENDOR='vendor'`;
    - `DateField`: `EXPENSE_DATE='expense_date'`, `SPENT_ON='spent_on'`;
    - `CategoryPicker`: `SELECT='select'`, `RADIO='radio'`, `COMBOBOX='combobox'`;
    - `DateInput`: `CALENDAR='calendar'`, `TYPED='typed'`;
    - `SubmitLabel`: `SUBMIT_CLAIM='submit_claim'`, `SEND_FOR_APPROVAL='send_for_approval'`;
    - `ColumnOrder`: `DATE_FIRST='date_first'`, `AMOUNT_FIRST='amount_first'`;
    - `StepOrder`: `DETAILS_FIRST='details_first'`, `RECEIPT_FIRST='receipt_first'`;
    - `Grade`: `G1`, `G2`, `G3`.
  - `Variant` (pydantic, `extra='forbid'`):
    - `api: ApiNames(claims_path, amount_field, merchant_field, date_field)`;
    - `rules: Rules(hotel_nightly_limit: int, meal_cap_by_grade: dict[Grade, int], max_claim_age_days: int, receipt_required_from: int, manager_approval_limit: int)`, all in whole rupees;
    - `ui: UiOptions(category_picker, date_input, submit_label, column_order, step_order)`.
  - `DEFAULT_VARIANT`:
    - api: `claims`, `amount`, `merchant`, `expense_date`;
    - rules: `hotel_nightly_limit=5000`, `meal_cap_by_grade={G1:800, G2:1200, G3:1800}`, `max_claim_age_days=60`, `receipt_required_from=2000`, `manager_approval_limit=10000`;
    - ui: `select`, `calendar`, `submit_claim`, `date_first`, `details_first`.
  - `load_variant(raw: str | None) -> Variant`: `None` gives the default; invalid JSON or schema raises `ValueError` naming the field.
  - `Bug(str, Enum)` in `app/static/bugs.py`: names are descriptive, values are the opaque codes listed in Task 8. `parse_bugs(raw: str | None) -> frozenset[Bug]` raises `ValueError` on any unknown code. UI-only codes are accepted and ignored by the API: `UI_BUG_CODES: frozenset[str]` lists them (see Task 17).

- [ ] **Step 1: Write failing tests:**
  - `test_default_when_unset` (`load_variant(None) == DEFAULT_VARIANT`);
  - `test_full_variant_roundtrip` (every non-default option);
  - `test_bad_variant_raises` (missing `rules` → `ValueError` mentioning `rules`);
  - `test_unknown_bug_code_raises` (`parse_bugs('zzzz')` → `ValueError`);
  - `test_ui_codes_accepted` (`parse_bugs(<a UI code>) == frozenset()`);
  - `test_app_start_fails_on_bad_env` (`create_app_from_settings()` with `CLAIMLY_BUGS=zzzz` raises).
- [ ] **Step 2:** Run `uv run pytest tests/test_variant.py -v`. Expected: FAIL.
- [ ] **Step 3:** Implement `variant.py` and `bugs.py`. `create_app_from_settings()` calls `load_variant` and `parse_bugs`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(claimly-api): runtime variant and bug codes`.

---

### Task 3: Auth and roles

**Files:**
- Create: `claimly-api/app/api/v1/auth.py`, `claimly-api/app/services/auth_service.py`, `claimly-api/app/core/security.py`, `claimly-api/app/models/users.py`
- Test: `claimly-api/tests/test_auth.py`

**Interfaces:**
- Consumes: `get_db`, `Settings.jwt_secret`.
- Produces:
  - `Role(str, Enum)`: `EMPLOYEE`, `MANAGER`, `FINANCE_ADMIN`, in `enums.py`.
  - `POST /auth/login {email, password} -> {access_token, token_type: 'bearer', user}`. `GET /me -> User` (`id, name, email, role, grade, department, manager_id`).
  - `current_user` dependency; `require_roles(*roles: Role)` dependency factory.
  - JWT HS256 with a 12-hour expiry. The OpenAPI security scheme is HTTP bearer, so Swagger shows Authorize.

- [ ] **Step 1: Write failing tests:**
  - `test_login_ok` returns a token;
  - `test_login_wrong_password_401`;
  - `test_login_missing_email_422`;
  - `test_me_without_token_401`;
  - `test_me_with_expired_token_401`;
  - `test_role_guard_403` (an employee calling a finance-only probe route registered in the test).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Passwords are hashed with `hashlib.pbkdf2_hmac('sha256', …, 100_000)` and a per-user salt in the seed.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(claimly-api): bearer auth with roles`.

---

### Task 4: Claims, drafts, money, receipts, projects (variant-named)

**Files:**
- Create: `claimly-api/app/api/v1/claims.py`, `claimly-api/app/api/v1/projects.py`, `claimly-api/app/models/claims.py`, `claimly-api/app/services/claims_service.py`, `claimly-api/app/services/money.py`
- Test: `claimly-api/tests/test_claims.py`, `claimly-api/tests/test_money.py`

**Interfaces:**
- Consumes: `Variant`, `current_user`, `get_db`.
- Produces:
  - `Category(str, Enum)`: `HOTEL`, `MEALS`, `LOCAL_TRANSPORT`, `AIRFARE`, `CLIENT_ENTERTAINMENT`, `OFFICE_SUPPLIES`.
  - `Currency(str, Enum)`: `INR`, `USD`, `EUR`, `GBP`.
  - `ClaimStatus(str, Enum)`: `DRAFT`, `SUBMITTED`, `SENT_BACK`, `MANAGER_APPROVED`, `FINANCE_APPROVED`, `PAID`, `REJECTED`.
  - `money.to_inr_paise(amount: Decimal, currency: Currency) -> int`: half-up to 2 dp, then ×100.
  - `build_claim_models(variant) -> ClaimModels`, using `pydantic.create_model`, so request and response bodies carry the variant names for amount, merchant and date.
    - Canonical internal names: `amount`, `merchant`, `expense_date`.
    - Other fields: `category`, `currency`, `description`, `project_id`, `nights` (required when `category=HOTEL`, ≥ 1).
    - Response adds: `id`, `status`, `amount_inr`, `approved_amount_inr`, `receipt` (`{filename, size, content_type} | null`), `employee`, `created_at`, `submitted_at`, `events`.
  - Routes, under the prefix `/{variant.api.claims_path}`:
    - `POST /` create draft → 201;
    - `GET /{id}`;
    - `PATCH /{id}` (DRAFT or SENT_BACK only, else 409);
    - `DELETE /{id}` (DRAFT only) → 204;
    - `POST /{id}/receipt` multipart: pdf/jpeg/png, 1 byte to 5 MB inclusive. Empty → 422, too big → 413, wrong type → 415.
  - `GET /projects?q=` returns active projects whose name or code contains `q`, case-insensitive, max 20.
  - Access: only the owner sees and edits their claim. Others get 404, never 403. Managers see their reports' claims; finance sees all.

- [ ] **Step 1: Write failing tests:**
  - `test_money.py`:
    - `to_inr_paise(Decimal('10.005'), Currency.USD) == 83292` (10.005 × 83.25 = 832.91625 → 832.92 → paise);
    - `to_inr_paise(Decimal('1'), Currency.INR) == 100`.
  - `test_claims.py`:
    - `test_create_draft_default_names`;
    - `test_create_draft_variant_names` (`claim_amount`, `vendor`, `spent_on`, path `/expenses`; the default names now give 422 with `loc` naming `claim_amount`);
    - `test_openapi_uses_variant_names` (`/openapi.json` contains `/expenses` and `claim_amount`, not `/claims`);
    - `test_hotel_requires_nights_422`;
    - `test_other_employee_gets_404`;
    - `test_patch_submitted_409`;
    - receipt tests: `test_receipt_zero_bytes_422`, `test_receipt_exactly_5mb_ok`, `test_receipt_over_5mb_413`, `test_receipt_gif_415`;
    - `test_projects_search`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Receipts are stored under `/tmp/claimly-receipts/<claim_id>`. Models are built once in `create_app` and passed to the routers by closure.
- [ ] **Step 4:** Run the whole suite. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(claimly-api): claims with variant names, money and receipts`.

---

### Task 5: Policy rules and the policy endpoint

**Files:**
- Create: `claimly-api/app/services/policy_service.py`, `claimly-api/app/api/v1/policy.py`
- Modify: `claimly-api/app/services/claims_service.py` (submit runs the checks)
- Test: `claimly-api/tests/test_policy.py`

**Interfaces:**
- Consumes: `Rules`, the claim row, the employee, `bugs`.
- Produces:
  - `PolicyCode(str, Enum)`: `HOTEL_OVER_LIMIT`, `MEAL_OVER_CAP`, `TOO_OLD`, `FUTURE_DATE`, `RECEIPT_REQUIRED`, `DUPLICATE`.
  - `check_claim(claim, employee, rules, bugs, today: date) -> list[PolicyViolation(code, field, message)]`.
  - `POST /{claims_path}/{id}/submit`:
    - from DRAFT or SENT_BACK; violations → 422 `{detail: [{code, field, message}]}` with `field` in variant names;
    - `DUPLICATE` → 409;
    - else status → SUBMITTED and an event is added.
  - `GET /policy`, open to any logged-in user, returns `rules` plus `currency_rates`.
- Rules (clean behaviour), comparing amounts in INR:
  - hotel: `amount_inr / nights ≤ hotel_nightly_limit`;
  - meals: `≤ meal_cap_by_grade[employee.grade]`;
  - age: `(today − expense_date).days ≤ max_claim_age_days`;
  - future: `expense_date > today` is a violation;
  - receipt: needed when `amount_inr ≥ receipt_required_from`;
  - duplicate: another non-REJECTED claim by the same employee with the same merchant, date and amount.

- [ ] **Step 1: Write failing boundary tests**, all with default rules and `today=date(2026, 6, 15)` injected:
  - `test_receipt_at_threshold_required` (2000.00 INR with no receipt → `RECEIPT_REQUIRED`);
  - `test_receipt_just_below_ok` (1999.99);
  - `test_age_exactly_limit_ok` (60 days);
  - `test_age_one_over_rejected` (61);
  - `test_today_ok_tomorrow_future`;
  - `test_hotel_per_night` (3 nights, 15000 ok; 15000.01 rejected);
  - `test_meal_cap_by_grade` (G3 1800 ok, G1 801 rejected);
  - `test_duplicate_409`;
  - `test_violation_field_uses_variant_name`;
  - `test_policy_endpoint_returns_variant_rules`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. `today` comes from a `clock` dependency that tests override.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(claimly-api): policy rules and policy endpoint`.

---

### Task 6: Approval chain and audit trail

**Files:**
- Create: `claimly-api/app/services/approval_service.py`, `claimly-api/app/api/v1/approvals.py`
- Test: `claimly-api/tests/test_approvals.py`

**Interfaces:**
- Produces, all under `/{claims_path}/{id}`, every action writing an `events` row (`actor, action, from_status, to_status, comment, amount_inr, at`):
  - `POST …/approve {approved_amount?, comment?}`:
    - MANAGER of the claim owner: SUBMITTED → MANAGER_APPROVED;
    - FINANCE_ADMIN: MANAGER_APPROVED → FINANCE_APPROVED. Only allowed when `approved_amount_inr > manager_approval_limit`, otherwise 409.
    - `approved_amount` defaults to the full amount. It must be > 0 and ≤ the claimed amount, else 422. If it's below the claimed amount, a comment is required (422).
  - `POST …/send-back {comment}`: comment required. Manager from SUBMITTED, or finance from MANAGER_APPROVED → SENT_BACK.
  - `POST …/reject {comment}`: comment required. Same actors and states → REJECTED (final).
  - `POST …/pay`: FINANCE_ADMIN. FINANCE_APPROVED → PAID, or MANAGER_APPROVED → PAID when `approved_amount_inr ≤ manager_approval_limit`; otherwise 409.
  - A manager acting on their own claim → 403. An action from a wrong state → 409.
  - Atomic: each transition is one `UPDATE … WHERE id=? AND status=?` checked by `rowcount`, so a second concurrent action gets 409.

- [ ] **Step 1: Write failing tests:**
  - `test_manager_approves_under_limit_then_finance_pays`;
  - `test_over_limit_needs_finance_before_pay` (pay on MANAGER_APPROVED above the limit → 409);
  - `test_partial_needs_comment`;
  - `test_partial_over_claimed_422`;
  - `test_self_approval_403`;
  - `test_send_back_resubmit_flow`;
  - `test_reject_is_final` (a further action → 409);
  - `test_wrong_state_409`;
  - `test_concurrent_approve_second_gets_409` (call the service twice with the same expected status; the second raises the conflict);
  - `test_events_recorded`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(claimly-api): approval chain with audit trail`.

---

### Task 7: Lists: my claims and the approvals queue

**Files:**
- Modify: `claimly-api/app/api/v1/claims.py`, `claimly-api/app/api/v1/approvals.py`, `claimly-api/app/services/claims_service.py`
- Test: `claimly-api/tests/test_lists.py`

**Interfaces:**
- Produces:
  - `GET /{claims_path}` (own claims) and `GET /approvals` (manager: their reports' SUBMITTED claims; finance: MANAGER_APPROVED plus FINANCE_APPROVED).
  - Query params:
    - `status` (repeatable), `category`, `date_from`, `date_to`;
    - `sort` ∈ `{date, -date, amount, -amount, submitted, -submitted}`, default `-date`;
    - `page` ≥ 1, default 1; `page_size` 1–100, default 20.
  - Response: `{items, total, page, page_size}`. `total` counts after filters.

- [ ] **Step 1: Write failing tests:**
  - `test_filter_status_and_dates_total`;
  - `test_sort_amount_desc`;
  - `test_page_size_bounds_422` (0 and 101);
  - `test_manager_queue_only_reports`;
  - `test_finance_queue_states`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(claimly-api): claim lists with filters, sort and paging`.

---

### Task 8: Planted API bugs

**Files:**
- Modify: `claimly-api/app/static/bugs.py`, plus the services named per bug
- Test: `claimly-api/tests/test_bugs.py`

**Interfaces:**
- Produces: the `Bug` enum members below, each with its exact opaque code and exact buggy behaviour. Clean behaviour is the Task 4–7 rule.

| Name | Code | Tier | Flow | Buggy behaviour |
|---|---|---|---|---|
| `RECEIPT_AT_THRESHOLD` | `q7m2` | mid | submit | receipt needed only when `amount_inr > receipt_required_from` |
| `AGE_OFF_BY_ONE` | `t4k9` | mid | submit | accepts `max_claim_age_days + 1` |
| `FUTURE_DATE_ALLOWED` | `b8x1` | junior | submit | future dates pass |
| `MEAL_CAP_WRONG_GRADE` | `n2v6` | mid | submit | meal cap always uses `G1` |
| `FX_TRUNCATES` | `h5r3` | senior | money | conversion truncates instead of rounding half-up |
| `SELF_APPROVAL` | `w9c4` | senior | approvals | a manager can approve their own claim |
| `PARTIAL_OVER_CLAIMED` | `d3p8` | mid | approvals | approved amount above the claimed amount is accepted |
| `PAY_SKIPS_FINANCE` | `k6f2` | senior | approvals | MANAGER_APPROVED above the limit can be paid |
| `DUPLICATE_ALLOWED` | `z1j7` | mid | submit | the duplicate check is skipped |
| `OTHER_CLAIM_VISIBLE` | `e8s5` | senior | claims | `GET /{id}` returns another employee's claim (200) |
| `TOTAL_IGNORES_FILTERS` | `y2g9` | junior | lists | `total` counts all of the user's claims |
| `SORT_DIRECTION_IGNORED` | `c5u3` | junior | lists | the `-` prefix is ignored |
| `ERROR_WRONG_FIELD` | `r4a6` | junior | claims | a 422 for the amount field reports `loc` as the merchant field |

- [ ] **Step 1: Write a failing parametrized test** `test_bug_changes_behaviour[<name>]`. For each bug, the same request gives the clean result with no bugs and the buggy result with `bugs={Bug.X}`. Use the boundary inputs from Tasks 5–7.
- [ ] **Step 2:** Run. Expected: FAIL (members missing).
- [ ] **Step 3:** Implement each as `if Bug.X in bugs:` at the single place the rule lives.
- [ ] **Step 4:** Run the whole suite. Expected: PASS. Clean tests are untouched.
- [ ] **Step 5:** Commit: `feat(claimly-api): planted bugs behind opaque codes`.

---

### Task 9: Realistic seed data

**Files:**
- Create: `claimly-api/scripts/generate_seed.py`; regenerate `claimly-api/seed/default.json`
- Test: `claimly-api/tests/test_seed.py`

**Interfaces:**
- Produces a seed with:
  - 1 company (INR);
  - 6 departments: Engineering, Sales, Delivery, Finance, People, Operations;
  - 48 users: 40 employees across grades G1–G3, 6 managers, 2 finance admins. Each employee has a manager and a department.
  - 14 projects (code + name; 2 inactive);
  - ~220 claims over the 6 months before 2026-06-15. Every status and category is present, foreign currency is ~15%, every claim has a matching events history, and ~40% have receipt metadata.
- Seeded with `random.Random(2026)` so it is reproducible.
- Known logins, documented in the README:
  - `asha.verma@claimly.test` (EMPLOYEE G2);
  - `rahul.mehta@claimly.test` (MANAGER of Asha);
  - `neha.iyer@claimly.test` (FINANCE_ADMIN).
- Realistic Indian and international merchant names. No lorem ipsum.

- [ ] **Step 1: Write failing tests:**
  - `test_seed_counts` (48 users, 14 projects, ≥ 200 claims, all 7 statuses);
  - `test_seed_logins_work`;
  - `test_seed_claims_reference_valid_users_projects`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Write the generator, run `uv run python scripts/generate_seed.py > seed/default.json`, and commit the output.
- [ ] **Step 4:** Run the whole suite. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(claimly-api): realistic seed data`.

---

### Task 10: API image and CI

**Files:**
- Create: `claimly-api/Dockerfile`, `claimly-api/.dockerignore`, `claimly-api/app/__main__.py` (uvicorn on `0.0.0.0:7460`, 1 worker)
- Modify: `.github/workflows/images.yml` (add `claimly-api` to the build matrix, with a smoke test running as `--user 1000` and curling `/health`)

- [ ] **Step 1:** Write the Dockerfile on `python:3.12-slim` with a uv install. Run as `USER 1000`, `EXPOSE 7460`.
- [ ] **Step 2:** Update the workflow by mirroring the `bookhub-api` job entries.
- [ ] **Step 3:** Push the branch. Expected: CI is green, and `ghcr.io/kartikbhatnagar24/claimly-api:<sha>` exists.
- [ ] **Step 4:** Commit: `ci(claimly-api): build and smoke-test image`.

---

### Task 11: Design plan (frontend-design skill), user checkpoint

**Files:**
- Create: `claimly-web/DESIGN.md`

- [ ] **Step 1:** Invoke the `frontend-design` skill. Brief: Claimly, internal expense-claims software for Indian IT-services companies. Users are employees, managers and finance admins. Its job is a calm, credible, data-dense work tool. Apply the Global Constraints look rules.
- [ ] **Step 2:** Write `DESIGN.md`:
  - palette as 4–6 named hex values plus semantic status colours for the 7 claim statuses;
  - typefaces and their roles, from Google Fonts or self-hosted;
  - a type scale;
  - ASCII wireframes for login, the app shell, My claims, the claim form, claim detail, the approvals queue and the policy page;
  - the one memorable element;
  - principles.
- [ ] **Step 3:** Run the skill's self-review against the generic defaults. Revise the plan and note what changed.
- [ ] **Step 4:** **Stop. Show `DESIGN.md` to the user and wait for OK before Task 12.**
- [ ] **Step 5:** Commit: `docs(claimly-web): design plan`.

---

### Task 12: Web skeleton, runtime env, API wiring

**Files:**
- Create:
  - `claimly-web/` Vite React TS project: `package.json`, `vite.config.ts` (`@` alias), `tsconfig*.json`, `index.html`, `components.json` (new-york, lucide), `src/main.tsx`, `src/App.tsx`, `src/index.css` (tokens from DESIGN.md);
  - `src/lib/utils.ts` (`cn`), `src/configs/env.ts`;
  - `src/utils/api.ts`, `src/utils/core-utils.ts`, `src/utils/claim-parsing-utils.ts`;
  - `src/constraints/enums/claim-enums.ts`, `src/constraints/enums/variant-enums.ts`, `src/constraints/types/claim-types.ts`, `src/constraints/types/variant-types.ts`;
  - `public/env-config.js` (empty placeholder);
  - `nginx/default.conf.template`, `nginx/40-env-config.sh`, `Dockerfile`.
- Test: `claimly-web/src/utils/claim-parsing-utils.test.ts` (vitest)

**Interfaces:**
- Produces:
  - `RUNTIME_ENV = (window as any).__ENV__ ?? import.meta.env` and `getVariant(): WebVariant` (`{api, ui}`), falling back to the default variant matching Task 2.
  - `getUiBugs(): Set<UiBug>`.
  - `routes` in `api.ts`, built from `getVariant().api.claimsPath`, base `/api`.
  - `parseClaim(raw, variant): Claim` and `toClaimPayload(form, variant)`, which map the variant field names to and from the canonical camelCase `Claim`.
  - `40-env-config.sh` writes `window.__ENV__ = {VARIANT: <ui+api of CLAIMLY_VARIANT or null>, UI_BUGS: [<UI codes from CLAIMLY_BUGS>]}`. It uses `jq`, which must be in the image, and drops non-UI codes.
  - nginx serves on 7450 with an SPA fallback and proxies `/api/` → `${API_UPSTREAM}/`. The pid is in `/tmp`, so it runs as non-root (copy BookHub's fix).

- [ ] **Step 1: Write failing vitest tests:**
  - `parseClaim` maps `claim_amount` / `vendor` / `spent_on` to `amount` / `merchant` / `expenseDate`;
  - `toClaimPayload` maps back;
  - the default variant is used when `__ENV__` is empty.
- [ ] **Step 2:** Run `npx vitest run`. Expected: FAIL.
- [ ] **Step 3:** Scaffold and implement. Add the shadcn primitives the plan needs (button, input, label, select, radio-group, command/popover combobox, calendar, dialog, table, badge, sonner, tabs, dropdown-menu, textarea).
- [ ] **Step 4:** Run `npx vitest run && npx tsc -b && npx vite build`. Expected: all pass.
- [ ] **Step 5:** Commit: `feat(claimly-web): app skeleton with runtime variant`.

---

### Task 13: Login and app shell

**Files:**
- Create: `src/pages/auth/LoginPage.tsx`, `src/layout/AppLayout.tsx`, `src/components/common/sidebar/*`, `src/stores/auth-store.ts`, `src/actions/auth-actions.ts`, `src/services/auth-service.ts`, `src/routes/index.ts`, `src/routes/router.tsx`, `src/utils/axios-config.ts`

**Interfaces:**
- Produces:
  - The token lives in the store and in `sessionStorage`. The axios interceptor adds the bearer token; a 401 clears the store and redirects to `/login`.
  - The nav follows the role: Employee sees My claims, New claim and Policy. Manager adds Approvals. Finance sees Approvals, All claims and Policy.

- [ ] **Step 1:** Implement following DESIGN.md.
- [ ] **Step 2:** Verify:
  - `npx tsc -b && npx vite build` passes;
  - run the API locally (`uv run python -m app`) and `npx vite` with a dev proxy;
  - log in as each seeded user;
  - a wrong password shows the API message;
  - a reload keeps the session.
- [ ] **Step 3:** Commit: `feat(claimly-web): login and role-based shell`.

---

### Task 14: New claim form with variant UI swaps

**Files:**
- Create:
  - `src/pages/claims/NewClaimPage.tsx`;
  - `src/components/claims/{ClaimForm,CategoryField,DateField,AmountField,ReceiptDropzone,ProjectSearch,ClaimStepper}.tsx`;
  - `src/stores/claims-store.ts`, `src/actions/claims-actions.ts`, `src/services/claims-service.ts`, `src/schemas/claim-schema.ts`

**Interfaces:**
- Consumes: `getVariant().ui`, `parseClaim` / `toClaimPayload`, `routes`.
- Produces:
  - `CategoryField` renders select | radio | combobox from `ui.categoryPicker`.
  - `DateField` renders calendar | typed (`DD/MM/YYYY`) from `ui.dateInput`.
  - `ClaimStepper` orders "Details" and "Receipt" steps per `ui.stepOrder`.
  - The submit button reads "Submit claim" or "Send for approval" per `ui.submitLabel`.
  - Users can save a draft, then submit. API violations are shown next to their fields. A summary shows the INR amount from `/policy` rates.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Verify with two variants, by setting `window.__ENV__` in `public/env-config.js` locally:
  - default: select / calendar / details-first / "Submit claim";
  - all-alternate: combobox / typed / receipt-first / "Send for approval", plus API names `expenses` / `claim_amount` / `vendor` / `spent_on`.
  - With each one: create, upload, submit; see the receipt-required error at exactly 2000.
  - `npx tsc -b && npx vite build`.
- [ ] **Step 3:** Commit: `feat(claimly-web): claim form with variant swaps`.

---

### Task 15: Lists, claim detail, approval actions

**Files:**
- Create:
  - `src/pages/claims/MyClaimsPage.tsx`, `src/pages/claims/ClaimDetailPage.tsx`, `src/pages/approvals/ApprovalsPage.tsx`;
  - `src/components/claims/{ClaimsTable,ClaimFilters,StatusBadge,AuditTrail}.tsx`;
  - `src/components/approvals/{ApproveDialog,SendBackDialog,RejectDialog}.tsx`;
  - `src/stores/approvals-store.ts`, `src/actions/approvals-actions.ts`, `src/services/approvals-service.ts`

**Interfaces:**
- Produces:
  - Tables with filters (status, category, date range), sortable headers and a footer pager. Column order follows `ui.columnOrder`.
  - Claim detail shows the fields, receipt, amounts and audit trail.
  - Dialogs: approve with an optional partial amount (comment required when partial), send back (comment required), reject (comment required). Finance has Pay.
  - The `StatusBadge` label and colour come from DESIGN.md status tokens, one per `ClaimStatus`.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Verify end to end as Asha, Rahul and Neha:
  - submit → approve partially with a comment → pay under the limit;
  - an over-limit claim needs finance approval;
  - send back → edit → resubmit;
  - filters, sorting and paging work;
  - `npx tsc -b && npx vite build`.
- [ ] **Step 3:** Commit: `feat(claimly-web): lists, detail and approval actions`.

---

### Task 16: Policy page

**Files:**
- Create: `src/pages/policy/PolicyPage.tsx`, `src/components/policy/PolicyRules.tsx`, `src/services/policy-service.ts`, `src/actions/policy-actions.ts`, `src/stores/policy-store.ts`

**Interfaces:**
- Produces: the page renders `GET /policy` as plain-language rules with the learner's numbers. Example: "Receipts are needed for claims of ₹2,000 or more." It also shows the hotel limit per night, meal caps by grade, the claim age limit, who approves above ₹10,000, and the currency rates.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Verify with the default and the all-alternate rules: every number shown matches `/policy`. `npx tsc -b && npx vite build`.
- [ ] **Step 3:** Commit: `feat(claimly-web): expense policy page`.

---

### Task 17: Planted UI bugs, guidelines review, web image

**Files:**
- Create: `src/constraints/enums/bug-enums.ts`
- Modify: the components named per bug; `.github/workflows/images.yml` (add `claimly-web`)
- Modify: `claimly-api/app/static/bugs.py` (`UI_BUG_CODES` lists the codes below)

**Interfaces:**
- Produces `UiBug` (string enum, values = opaque codes):

| Name | Code | Tier | Flow | Buggy behaviour |
|---|---|---|---|---|
| `ERROR_UNDER_WRONG_FIELD` | `f6l2` | junior | claim form | the merchant's required-error renders under Description |
| `SUMMARY_UNROUNDED` | `m3t8` | mid | claim form | the INR summary shows the unrounded product (e.g. 832.91625) |
| `DOUBLE_SUBMIT` | `v7b4` | mid | claim form | the submit button stays enabled while the request is in flight |
| `FILTER_KEEPS_PAGE` | `a9q5` | junior | lists | changing a filter keeps the current page number |
| `DATE_SHIFTS_DAY` | `s2h7` | senior | claim form | the date is sent via `toISOString()`, so in IST it's sent one day earlier |
| `SENT_BACK_AS_REJECTED` | `p8n3` | junior | lists | the SENT_BACK badge reads "Rejected" |
| `GENERIC_ERROR_TOAST` | `j4w6` | mid | approvals | API error details are replaced with "Something went wrong" |

- [ ] **Step 1: Write failing vitest tests** for the pure parts:
  - `getUiBugs()` reads only known codes;
  - the date formatter returns `2026-06-14` for 15 June IST only when `DATE_SHIFTS_DAY` is on;
  - the summary formatter rounds unless `SUMMARY_UNROUNDED` is on.
- [ ] **Step 2:** Run `npx vitest run`. Expected: FAIL.
- [ ] **Step 3:** Implement each bug as `if (getUiBugs().has(UiBug.X))` at one place.
- [ ] **Step 4:** Run vitest. Expected: PASS. Then verify each bug by hand with `UI_BUGS` set in `env-config.js`.
- [ ] **Step 5:** Invoke `web-design-guidelines` on `claimly-web/src`. Fix accessibility and UX findings that don't conflict with the planted bugs.
- [ ] **Step 6:** Write the web Dockerfile (node build → nginx, `USER 1000`, `EXPOSE 7450`, `jq` installed) and the workflow entry, with a smoke test curling `/` and `/env-config.js`.
- [ ] **Step 7:** Push. Expected: CI is green, with `claimly-web:<sha>`.
- [ ] **Step 8:** Commit: `feat(claimly-web): planted UI bugs, guidelines fixes, image`.

---

### Task 18: Catalog, README, end-to-end check

**Files:**
- Create: `catalog/claimly.json`, `claimly-api/tests/test_catalog.py`, `claimly-api/README.md`, `claimly-web/README.md`
- Modify: root `README.md` (list Claimly)

**Interfaces:**
- Produces `catalog/claimly.json`, version 1, for Plan 2:
  - `slots`: each variant field with its option list. Rule numbers as `{min, max, step}`:
    - `hotel_nightly_limit` 4000–7000 step 500;
    - meal caps per grade, G1 600–1000, G2 1000–1500, G3 1500–2200, step 100;
    - `max_claim_age_days` 30–90 step 15;
    - `receipt_required_from` 1000–3000 step 500;
    - `manager_approval_limit` 10000–30000 step 5000.
  - `default`: the variant.
  - `bugs`: one entry per API and UI bug: `{code, name, layer (api|ui), tier (junior|mid|senior), flow, trigger, expected, actual}`, with `expected` worded against the policy page or the API contract.
  - `ports`: `{web: 7450, api: 7460}`; `images`; `env`: the names.

- [ ] **Step 1: Write a failing test** `test_catalog_matches_code`:
  - every `Bug` value and every `UI_BUG_CODES` code is in the catalog exactly once, with matching layer;
  - every enum option is in the catalog slots;
  - `default` equals `DEFAULT_VARIANT`;
  - every range contains the default value.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Write the catalog and the READMEs (run steps, seeded logins, env names, ports; no bug details in the app READMEs).
- [ ] **Step 4:** End-to-end with the images, using `docker run` locally if available, otherwise the CI smoke:
  - start both images with an all-alternate variant and 3 API + 2 UI codes;
  - `/openapi.json` shows the variant names;
  - the policy page shows the variant numbers;
  - each enabled bug reproduces;
  - with the env unset, the app is clean.
- [ ] **Step 5:** Run the whole suite: `cd claimly-api && uv run pytest -v && uv run ruff check . && uv run ruff format --check . && cd ../claimly-web && npx vitest run && npx tsc -b && npx vite build`. Expected: all green.
- [ ] **Step 6:** Commit: `docs(claimly): catalog and readmes`.
