## Candidate Notes

I started with the frontend test harness so the approval inbox work can be built in small, verifiable steps. The app did not have an existing test setup, so I added Vitest, Testing Library, jest-dom, and jsdom before implementing any approval-specific UI.

The harness includes a shared `renderWithProviders` helper that wraps components in React Query, React Router, and the existing auth provider. This keeps future tests focused on user behaviour rather than repeated provider setup. The test-only Query Client disables retries so failures stay fast and deterministic.

I also added a small smoke test for the helper itself. It verifies that an authenticated admin user can be seeded through the wrapper, which is the minimum foundation needed for the later admin-only approval inbox stories.

Verification completed:

- `pnpm --dir frontend test`
- `pnpm --dir frontend build`

Next, I would use this harness to add behavioural coverage for the approval inbox: visible-row selection, filtered totals, reject validation, and partial bulk-action failures.

### Data layer and cost helper (step 2)

I added a typed `TimesheetDecisionPayload` for approve/reject PATCH calls and extracted the estimated-cost calculation into `frontend/src/utils/cost.ts`, reusing it in `ContractDetail`.

**Currency assumption:** The API exposes `daily_rate` only — there is no `currency` field on contracts or companies. The app currently assumes GBP everywhere (`£` in list/detail/submit screens, and “Daily rate (£)” on new contracts). `formatEstimatedCost` centralises that convention rather than encoding a data-driven currency. For a multi-currency platform, I would add `currency` to the contract (or company) model and format via `Intl.NumberFormat`, passing currency into the helper instead of hardcoding `£`.

### Pending approvals shell (step 3)

I added the first admin-only `PendingApprovals` page shell and intentionally kept it narrow in scope. The page now gates access with `isAdmin`, redirects freelancers to `/contracts`, and loads submitted timesheets through React Query using the shared API layer.

For this slice, I only implemented loading, error, empty, and placeholder states so the route and navigation can be reviewed independently before table logic is introduced. I also added a protected `/approvals` route in `App.tsx` and an admin-only `Approvals` link in the top nav to make the feature reachable.
