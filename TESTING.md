# Testing Matrix

This repo now has runnable coverage for all key testing categories.

## 1) Unit tests

- Backend:
  - `cd backend && npm run test:unit`
  - Includes middleware and SKU/business-rule focused tests.
- Frontend:
  - `cd frontend && npm run test`
  - Includes store state and role-guard rendering behavior.

## 2) Integration tests (API + DB)

- `cd backend && npm run test:integration`
- Exercises route -> middleware -> service -> prisma -> database flows.

## 3) Authorization / security tests

- `cd backend && npm run test:security`
- Covers auth endpoints plus role/warehouse access behavior.

## 4) Database correctness tests

- `cd backend && npm run test:db`
- Verifies cross-tenant isolation and uniqueness constraints.

## 5) Smoke / regression tests

- `cd backend && npm run test:smoke`
- Quick critical-path test for login, inventory flow, dashboard, and history.

## 6) Concurrency tests

- `cd backend && npm run test:concurrency`
- Verifies parallel sales requests cannot oversell inventory.

## 7) End-to-end (E2E) tests

- Install browser once:
  - `cd frontend && npx playwright install`
- Run:
  - `cd frontend && npm run test:e2e`
- Current E2E flows:
  - login + history page export controls
  - responsive navigation checks on desktop/mobile pages

## 8) Performance / load tests

- Start backend first (`http://localhost:4000`).
- Export a token for protected routes:
  - `export LOAD_BEARER_TOKEN="<jwt>"`
- Run:
  - `cd backend && npm run test:load`

## 9) Full backend suite

- `cd backend && npm run test:all`

## 10) Root-level combined commands

- `npm run test:backend`
- `npm run test:frontend`
- `npm run test:all`

## Notes

- Integration/security/smoke tests are stateful and reset DB tables in test helpers.
- For reliable runs, avoid running tests in parallel against the same DB instance.
