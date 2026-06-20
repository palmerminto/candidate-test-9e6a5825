## Candidate Notes

I started with the frontend test harness so the approval inbox work can be built in small, verifiable steps. The app did not have an existing test setup, so I added Vitest, Testing Library, jest-dom, and jsdom before implementing any approval-specific UI.

The harness includes a shared `renderWithProviders` helper that wraps components in React Query, React Router, and the existing auth provider. This keeps future tests focused on user behaviour rather than repeated provider setup. The test-only Query Client disables retries so failures stay fast and deterministic.

I also added a small smoke test for the helper itself. It verifies that an authenticated admin user can be seeded through the wrapper, which is the minimum foundation needed for the later admin-only approval inbox stories.

Verification completed:

- `pnpm --dir frontend test`
- `pnpm --dir frontend build`

Next, I would use this harness to add behavioural coverage for the approval inbox: visible-row selection, filtered totals, reject validation, and partial bulk-action failures.
