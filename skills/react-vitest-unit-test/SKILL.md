---
name: react-vitest-unit-test
description: >
  Expert skill for writing unit tests in React applications using Vitest, React Testing Library, and MSW.
  ALWAYS use this skill when the user asks to write, add, or fix tests in a React project, whether it's
  "write tests for this component", "add tests before refactoring", "set up testing", "write regression tests",
  or "check coverage". Covers both setting up the test stack from scratch and writing meaningful tests on
  already-configured projects. Adapts to any React version (16, 17, 18, 19+) and the specific providers present
  (React Query, React Router, i18n, Zustand, etc.) detected in the project. Never write tests just for
  coverage — every test must verify observable behavior or guard a critical regression path.
---

## How to use this skill

Follow the four phases in order every time. Do not skip Phase 1 even when the stack looks configured — versions and existing patterns must be confirmed before writing a single line of test code.

---

## Phase 1 — Diagnostic

Read these files to understand the project state:

1. `package.json` — extract exact versions of `react`, `vitest`, `@testing-library/react`, `msw`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`
2. `vite.config.ts` (or `vitest.config.ts`) — check for a `test` section
3. `src/tests/setup.ts` (or `src/test/setup.ts`) — MSW lifecycle and jest-dom import
4. `src/tests/test-utils.tsx` — custom render wrapper
5. `src/tests/msw/` or `src/mocks/` — MSW server and handlers
6. `src/app/providers.tsx` (or equivalent) — **identify all providers wrapping the app** (Router, QueryClient, i18n, Zustand, theme, etc.) — the test wrapper must mirror this exactly
7. `package.json` scripts — check which test scripts exist

**After reading, decide:**
- Stack fully configured → go to **Phase 3**
- Stack missing or partial → go to **Phase 2**

---

## Phase 2 — Configuration plan (stack missing or incomplete)

### 2a. Install dependencies

Before running any install, invoke the `npm-security-check` skill. Then install pinned versions compatible with the detected React version. Check the version compatibility table at the bottom of this file first:

**For React 19 (Vitest 4.x):**
```bash
pnpm add -D vitest@4 @vitest/coverage-v8@4 @testing-library/react@16 @testing-library/jest-dom@6 @testing-library/user-event@14 msw@2 jsdom@29
```

**For React 18 (Vitest 2.x):**
```bash
pnpm add -D vitest@2 @vitest/coverage-v8@2 @testing-library/react@15 @testing-library/jest-dom@6 @testing-library/user-event@14 msw@2 jsdom@24
```

**For React 17 or 16 (Vitest 1.x):**
```bash
pnpm add -D vitest@1 @vitest/coverage-v8@1 @testing-library/react@13 @testing-library/jest-dom@6 @testing-library/user-event@14 msw@1 jsdom@21
```

> For React 16/17 with MSW v1, use `rest.get/post()` instead of `http.get/post()` and `res(ctx.json(...))` instead of `HttpResponse.json()`. See `references/setup-config.md` → **MSW v1 handler pattern**.

### 2b. Configure Vitest in vite.config.ts

Add the `test` section — never create a separate `vitest.config.ts` unless the project already uses one. See `references/setup-config.md` → **Vitest config template**.

Key points:
- `environment: 'jsdom'`
- `globals: true`
- `setupFiles: ['./src/tests/setup.ts']`
- Expose the API base URL via `test.env`:
  ```typescript
  env: {
    VITE_API_BASE_URL: 'http://localhost:3001',
  }
  ```

### 2c. Create src/tests/setup.ts

```typescript
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 2d. Create src/tests/test-utils.tsx (wrapper adaptatif)

Read `src/app/providers.tsx` (or the app entry point) to identify every provider. Generate a wrapper that mirrors the real app setup exactly. See `references/setup-config.md` → **test-utils templates** for examples with common combinations.

Rules:
- Create a fresh `QueryClient` per test (`retry: false`, `gcTime: 0`)
- Use `MemoryRouter` (not `BrowserRouter`) for routing in tests
- Import the real i18n config from the project (do not create a fake one)
- Export `customRender as render` and re-export `* from '@testing-library/react'`

### 2e. Create src/tests/msw/

```
src/tests/msw/
├── server.ts          ← setupServer(…handlers)
└── handlers/
    ├── index.ts       ← exports [...allHandlers]
    └── [feature].ts   ← one file per API domain
```

**Never hardcode URLs.** Always use:
```typescript
const API_URL = import.meta.env.VITE_API_BASE_URL;
```

Handler pattern (MSW v2):
```typescript
import { http, HttpResponse } from 'msw';
const API_URL = import.meta.env.VITE_API_BASE_URL;

export const featureHandlers = [
  http.get(`${API_URL}/resource`, () => {
    return HttpResponse.json({ data: [] });
  }),
];
```

### 2f. Add scripts to package.json

Verify these three scripts exist — add only the ones missing:
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```
Do not add `test:ui`, `test:watch`, or other scripts unless explicitly requested.

### 2g. Minimal example test

Once the stack is configured, create one minimal test for the simplest component to validate the setup end-to-end. Run `pnpm test:run` and confirm it passes before proceeding.

---

## Phase 3 — Analyze the component to test

Before writing tests, understand what the component actually does:

1. **Read the component source** — identify props, internal state, conditional renders
2. **Identify API calls** — which hooks call which endpoints (React Query keys, axios calls)
3. **Identify user interactions** — buttons, form fields, keyboard events
4. **Identify async behavior** — loading states, error states, success states
5. **Identify edge cases** — empty data, null props, permission checks, i18n strings

From this analysis, list the test cases to write **before touching the test file**. Each case must answer: "What observable behavior does this verify?"

---

## Phase 4 — Write the tests

### File location

Tests live in `__tests__/ComponentName.test.tsx` in the same feature directory as the component:

```
src/features/home/
├── components/
│   └── DropZone.tsx
└── __tests__/
    └── DropZone.test.tsx    ← here
```

### Test file structure

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '@/tests/msw/server';
import { http, HttpResponse } from 'msw';
import { ComponentName } from '../components/ComponentName';

describe('ComponentName', () => {
  // Group by behavior, not by method
  describe('initial render', () => { ... });
  describe('user interactions', () => { ... });
  describe('API success', () => { ... });
  describe('API error', () => { ... });
});
```

### Query priority (always use in this order)

1. `getByRole` — most robust, tests accessibility
2. `getByLabelText` — form fields
3. `getByText` — non-interactive content
4. `getByDisplayValue` — current form values
5. `getByAltText` — images
6. `getByTestId` — last resort only

### Interaction pattern

```typescript
it('submits form with valid data', async () => {
  const user = userEvent.setup();
  render(<MyForm />);

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### Override MSW for error cases

```typescript
it('displays error when API fails', async () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  server.use(
    http.post(`${API_URL}/resource`, () =>
      HttpResponse.json({ error: 'Server error' }, { status: 500 })
    )
  );

  render(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
  });
});
```

### Async patterns

- Use `findBy*` (auto-waits) when a single element appears after async work
- Use `waitFor()` when asserting on multiple elements or state changes
- Never use arbitrary `setTimeout` — always wait for DOM changes

---

## What makes a good test

Write a test when it answers YES to at least one of these:

- Does it verify that a user can complete a critical workflow?
- Does it guard against a regression if this code is refactored?
- Does it verify the component handles an API error gracefully?
- Does it verify an accessibility behavior (role, label, disabled state)?
- Does it verify a conditional render that's not obvious from the code?

**Do NOT write a test** just because a line of code exists. Empty renders with a single `toBeInTheDocument()` assertion on a static element add no value.

---

## Anti-patterns

| Avoid | Reason |
|---|---|
| `fireEvent.click()` | Doesn't simulate real browser events — use `userEvent` |
| `wrapper.find('.class-name')` | Tests implementation, not behavior |
| Hardcoded URLs like `'http://localhost:3001'` | Use `import.meta.env.VITE_API_BASE_URL` |
| `screen.getByTestId` as first choice | Signals missing semantic markup |
| Asserting on text inside a JSON mock | Tests the mock, not the component |
| `await new Promise(r => setTimeout(r, 500))` | Flaky — use `waitFor` or `findBy*` |
| Testing private functions directly | Test through the public component interface |
| One giant test covering everything | Split into focused `it()` blocks per behavior |

---

## Version compatibility reference

| React version | Vitest | RTL | MSW | jsdom | Notes |
|---|---|---|---|---|---|
| React 19 | 4.x | 16.x | 2.x | 29.x | |
| React 18 | 2.x | 15.x | 2.x | 24.x | |
| React 17 | 1.x | 14.x | 1.x | 21.x | `act` warnings possible — wrap async tests carefully |
| React 16 | 1.x | 13.x | 1.x | 20.x | No `@testing-library/user-event` v14 — use v13 |

**MSW v1 vs v2 API** — if MSW v1 is detected, handler syntax differs:
```typescript
// MSW v1 (React 16/17 projects)
import { rest } from 'msw';
const API_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export const handlers = [
  rest.get(`${API_URL}/resource`, (req, res, ctx) => {
    return res(ctx.json({ data: [] }));
  }),
];
```

For detailed configuration templates, see `references/setup-config.md`.
