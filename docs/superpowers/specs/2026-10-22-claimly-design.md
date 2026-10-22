# Claimly: a realistic practice app with per-learner variants

Date: 2026-10-22. Status: draft for review.

## Why

QA learners on the Trumio program practise inside a Coder workspace that runs a practice app next to their IDE. Today that app is BookHub: a small book shop with a plain UI, one flow and no bugs. Three problems:

1. It looks cheap and toy-like, so practice does not feel like real work.
2. Every learner gets the same app, so one learner's tests can be copied by everyone.
3. There are no planted bugs, so nothing proves a learner's tests actually catch defects.

The program must scale from learners with a few years of experience up to 10–12 years. That means more flows, more difficulty levels, and more apps over time.

## What Claimly is

A company expense-claims tool: employees submit claims, managers approve, finance pays. This is the kind of enterprise workflow app the learners (IT-services engineers) test in their real jobs. No public practice app covers it.

It must look and behave like real finance software: calm, credible and dense with real data. It must not look like a demo.

### Roles

- **Employee:** submits and tracks their own claims.
- **Manager:** approves or rejects claims, or sends them back, for their reports.
- **Finance admin:** does the final approval above a threshold, marks claims paid, and sees everything.

### Flows

v1 (the first version to ship):

1. **Login with roles.** Real token auth. Wrong role → 403, no token → 401. Seeded users for each role.
2. **Submit a claim.** A multi-step form:
   - category, expense date, amount, currency;
   - merchant, description;
   - project, picked with a search box;
   - receipt upload.
   - Save as draft, then submit.
3. **Policy rules**, enforced in both the API and the UI:
   - nightly hotel limit;
   - meal cap by employee grade;
   - no claims older than N days;
   - receipt required above an amount;
   - no future dates;
   - duplicate-claim detection (same merchant, date and amount).
4. **Approval chain.**
   - The manager approves up to a threshold; above it the claim also goes to finance.
   - A claim can be sent back with a comment, edited and resubmitted.
   - Rejection is final.
   - Statuses: draft → submitted → manager approved → finance approved → paid; plus sent back and rejected.
   - Every status change is recorded in an audit trail shown on the claim.
5. **Money.**
   - Currency conversion to the company currency with fixed seeded rates, and defined rounding.
   - Partial approval: the approver enters an approved amount below the claimed amount.
6. **Lists.** "My claims" and "Approvals queue" with filter (status, category, date range), sort and paging.
7. **Policy page.** An in-app "Expense policy" page showing *this learner's* limits and thresholds. This is the learner's requirements document (see Variants).
8. **Reset.** `POST /reset` restores the seed data.

Later (not v1, but the design must not block them):
- spend dashboard with charts;
- CSV export;
- bulk approve;
- notifications;
- an AI "scan receipt" feature that fills the form, for agentic-QA activities.

## Variants (level 2: same app, small visible swaps)

Every learner gets a different mix of the same product. Two learners side by side see clearly the same app, but copied tests break.

### What varies

1. **Visible UI swaps.**
   - Category picker: dropdown, radio buttons, or a type-to-search box.
   - Date input: calendar picker or a typed field.
   - Button and label wording: "Submit claim" / "Send for approval".
   - Order of table columns.
   - Order of the claim form's steps. The content is the same; only the order changes.
2. **API names.** Field names (`amount` / `claim_amount`) and URL paths (`/claims` / `/expenses`).
3. **Rule numbers.** Hotel limit, meal caps, approval threshold, claim age limit, receipt threshold.
4. **Planted bugs.** Which bugs are turned on (see Bugs).

### Rules

- Every variant has equal difficulty, and one task description fits every learner.
- Never one build per learner. One image per app, and the variant is applied at runtime from settings.
- The same learner always gets the same variant: after a restart, a rebuild and at grading time.

### How a learner's variant is picked and delivered

- **The catalog is data.** It lives in the app's practice-app record (`practice_apps_md`): each slot, its options, the rule-number ranges and the bug list. It is versioned by `variant_catalog_version`.
- **Code setup picks the variant** (`program_consumer_service`).
  - It seeds a deterministic random pick from the learner's `user_program_id` and picks one option per slot.
  - It saves the resolved variant on the learner's code mapping. That gives one source of truth for the app, the starter code and the grader.
  - It passes the variant to Coder as a template parameter. The template sets it as an env value on both the web and API containers.
- **The app has no randomness of its own.** The API and web read the resolved variant and apply it.
  - The web gets it through the existing runtime `env-config.js` pattern.
  - The API's `/openapi.json` and the Swagger docs show the learner's own names.
  - With no variant set, the app runs a documented default variant, with no bugs. This is used for local development and for CI.
- **Starter code generation is told the learner's variant.** The starter must use the learner's own names and paths, and must never mention the bugs.

## Bugs

- **A catalog of planted bugs**, around 20 for v1, spread across the flows.
- Each bug has:
  - an id;
  - the flow;
  - the layer (UI, API or both);
  - its difficulty tier (junior, mid or senior);
  - how to trigger it;
  - the **expected** behaviour, stated against the learner's policy page or the API contract;
  - the **actual** buggy behaviour.
- Examples by tier:
  - Junior: an error message that names the wrong field.
  - Mid: the receipt-required check uses `>` instead of `>=` at the threshold.
  - Senior: a rounding error in currency conversion, or a manager approving their own claim, or two approvers acting at once.
- **Per activity:** code setup turns on a small set (around 4–6) for each Claimly activity, seeded from the learner and the activity.
  - The set is balanced: different flows, and tiers that match the activity's existing `difficulty` (easy / medium / hard).
  - No new authoring field.
- **Bugs are on in the learner's workspace.** The learner tests against the requirements (policy page, task, API contract), not against what the app happens to do. A test that follows the requirements should fail on a bug.
- **A future grader** (separate project) will use the stored variant and bug list:
  - it runs the learner's tests against the clean app, where they must pass;
  - then against each of the learner's bugs, where they must fail.
  - So the app must let the bug set be overridden at start: none, all, or chosen ids.

### What the learner hands in (decided 2026-10-22; `BUGS.md` to revisit)

- **Tests stay as written.** The learner's tests follow the requirements and stay red where a bug is. Skipping a test or marking it as an expected failure (`test.skip`, `test.fail`, `test.fixme`) is not allowed on requirement tests. The starter README and the task text say so.
- **`BUGS.md` in the repo root.** One entry per bug found: steps, expected result, actual result.
- **The learner is told bugs exist, but not how many.**

### Keeping the bug list hidden (decided 2026-10-22)

- No readable bug ids anywhere the learner can look: not in env values, Coder parameters or `env-config.js`.
- Bugs are referenced only by opaque codes. The mapping from code to bug lives in the practice-app record and on the stored code mapping, never in the workspace.
- API bugs are decided on the server only.
- UI bugs necessarily ship in the browser bundle, so a very determined learner can dig them out. This is accepted.

### Scope of variant vs bugs (builder's call, accepted)

- **The variant is per learner** (one per `user_program`): the UI swaps, the names and the rule numbers. It stays the same across all activities in the program.
- **The bug set is per activity.**
  - Each Claimly activity gets its own seeded set, with tiers from that activity's `difficulty`.
  - The set that is active follows the activity whose branch is checked out, so switching activity switches the bugs.
  - It is passed the same way as `branch_name`.
- **One practice app per program for now.** Mixing apps in one program is out of scope.

### Tracks (builder's call, accepted)

- Claimly always runs both the web and the API containers, whatever the `app_track`.
- An `fe` activity focuses on the UI, and a `be` activity on the API.
- There is no mock backend for Claimly, because it would copy every rule and bug and could drift from the real API.

## Data and behaviour

- No external database. SQLite in `/tmp`, seed JSON, and `POST /reset`, the same proven pattern as BookHub.
- Seed data is rich enough to look real: dozens of employees, months of claims in every status, several projects, currencies and departments.
- Tests share one database. The starter defaults to one worker, and the README explains why. Activities about parallel runs can ask the learner to fix that.

## Look and feel

- Built with the `frontend-design` skill: write a design plan first (palette as 4–6 named colours, typefaces, layout sketches, principles), review it against this brief, then build.
- Checked with the `web-design-guidelines` skill before shipping.
- Calm, credible finance software.
- None of the generic AI-made traits:
  - no neon or acid accents;
  - no cream-and-terracotta;
  - no identical rounded cards with soft shadows;
  - no gradient washes;
  - no ALL-CAPS eyebrow labels;
  - no AI-presence decoration.
- Responsive, with visible keyboard focus and accessible contrast.
- Elements carry stable, meaningful accessible names, so learners practise good locators. No `data-testid` everywhere.

## Code conventions

Claimly follows the Trumio repos so it reads like our own code and can grow.

### Frontend: `claimly-web/` (same layout as the `flex-*` apps)

- React, TypeScript, Vite, Tailwind; shadcn primitives in `src/components/ui/`.
- Feature folders group similar components: `components/claims/`, `components/approvals/`, `components/policy/`, …
- Data flow: component → store (Zustand) → `actions/*-actions.ts` → `services/*.ts` → axios.
  - Only services call the API.
  - Every URL lives in `src/utils/api.ts`.
  - Requests are sent as snake_case; responses go through `keysToCamelCase` plus parsers.
  - Actions own loading flags and error toasts.
- Runtime env via `window.__ENV__` (`env-config.js`), written by the container on start.
- `@/` → `src/`. Merge classes with `cn()`. Colours and type are defined as tokens in `index.css`.

### Backend: `claimly-api/` (same layout as program-be)

- FastAPI.
- Folders: `app/api/v1/`, `app/services/`, `app/models/`, `app/core/` (config, database), `app/static/` (enums, user-facing messages).
- Thin routes. Enums, not `Literal`. Single quotes, line length 200, ruff, uv.

### Repo

- `trumio-practise-qa` holds one folder per app, next to `bookhub-api` / `bookhub-web`.
- Images are built by the existing GitHub workflow to `ghcr.io/kartikbhatnagar24/claimly-{api,web}`.
- Both images run as uid 1000.
- Ports are picked to avoid BookHub's 7410/7420.

## Platform changes this needs (other repos)

- **Coder template `qa-playwright-poc`:**
  - take the app's images and ports from parameters instead of hard-coded BookHub;
  - accept the variant parameter and pass it to both containers;
  - export generic app URL env names alongside `BOOKHUB_*`.
- **`program_consumer_service`:**
  - pick the variant and bug set at code setup;
  - store them on the code mapping;
  - pass them to Coder and to the starter-code `{app_context}`.
- **Practice-app record:** add a Claimly record holding the catalog, URLs, notes and spec.

## Non-goals

- The grader itself (separate project; Claimly only has to support it).
- Level 3 variants: different navigation, flow shapes or features per learner.
- Replacing BookHub. It stays until Claimly is ready.
- Real email, payments or external services.

## Anti-goals (would be a failure even if it works)

- It looks like a generic AI-built demo.
- Variants make some learners' tasks harder than others'.
- One learner's tests pass on another learner's app unchanged.
- The starter code or README gives away a learner's bugs.
- Per-learner builds or images.

## Left to the builder

- Exact screens and layout, within the look-and-feel rules.
- Exact seed data, port numbers and the slot option lists, within the rules above.
- The deterministic pick algorithm. It must be identical wherever it runs, and be tested with fixed seeds.
- The exact bug list, within the tier and flow spread.
