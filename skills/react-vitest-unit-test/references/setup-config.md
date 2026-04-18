# Setup Configuration Templates

Reference templates for configuring Vitest + React Testing Library + MSW.
Use the correct section based on the versions detected in the project's `package.json`.

---

## Table of Contents

1. [Vitest config template (vite.config.ts)](#vitest-config-template)
2. [test-utils.tsx templates](#test-utils-templates)
   - With React Query + React Router + i18next
   - With React Query + React Router (no i18n)
   - With React Query only
   - With Zustand
3. [MSW server and handler templates](#msw-templates)
   - MSW v2 (React 18/19)
   - MSW v1 (React 16/17)
4. [setup.ts template](#setup-template)

---

## Vitest config template

Integrate into the existing `vite.config.ts`. Import from `'vitest/config'` to get the typed `test` field.

```typescript
// vite.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
// add other plugins already present (tailwindcss, etc.)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    env: {
      // expose the API base URL to tests — never hardcode
      VITE_API_BASE_URL: 'http://localhost:3001',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: [
        'src/tests/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/styles/**',
        'src/i18n/**',
        'src/shared/types/**',
        'src/shared/components/ui/**',
        'src/api/model/**',
        'src/api/services/generated/**',
        'src/app/providers.tsx',
        'src/app/router.tsx',
      ],
    },
  },
});
```

**If the project already has a `vite.config.ts` using `defineConfig` from `'vite'` (not `'vitest/config'`):**

```typescript
import { defineConfig } from 'vite';
// Change to:
import { defineConfig } from 'vitest/config';
// vitest/config re-exports everything from vite, so this is safe
```

---

## test-utils templates

### Template A — React Query + React Router + i18next (most common)

```typescript
// src/tests/test-utils.tsx
import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

function AllProviders({ children }: { readonly children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

### Template B — React Query + React Router (no i18n)

```typescript
// src/tests/test-utils.tsx
import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

function AllProviders({ children }: { readonly children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

### Template C — React Query only (no router)

```typescript
// src/tests/test-utils.tsx
import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function AllProviders({ children }: { readonly children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

### Template D — Adding Zustand store reset

When the app uses Zustand stores with persistent state, reset them between tests to avoid cross-test contamination.

```typescript
// src/tests/test-utils.tsx
import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach } from 'vitest';
// Import Zustand stores to reset
import { useMyStore } from '@/shared/stores/myStore';

// Reset store state after each test
afterEach(() => {
  useMyStore.setState(useMyStore.getInitialState());
});

function AllProviders({ children }: { readonly children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

---

## MSW templates

### MSW v2 (React 18 / 19)

### server.ts

```typescript
// src/tests/msw/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### handlers/index.ts

```typescript
// src/tests/msw/handlers/index.ts
import { featureHandlers } from './feature';
// import other handler files as the API grows

export const handlers = [...featureHandlers];
```

### handlers/[feature].ts — MSW v2 pattern

```typescript
// src/tests/msw/handlers/upload.ts
import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const uploadHandlers = [
  http.post(`${API_URL}/upload`, () => {
    return HttpResponse.json({
      candidateName: 'Jean Dupont',
      links: [
        { type: 'github', url: 'https://github.com/jeandupont' },
      ],
      rawText: 'Texte extrait du CV...',
    });
  }),
];
```

### Per-test handler override pattern

```typescript
import { server } from '@/tests/msw/server';
import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL;

it('handles upload error', async () => {
  server.use(
    http.post(`${API_URL}/upload`, () =>
      HttpResponse.json({ message: 'File too large' }, { status: 413 })
    )
  );
  // ... render and assert
});
```

### Capturing request payload in tests

```typescript
it('sends the correct payload', async () => {
  let capturedBody: unknown;
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  server.use(
    http.post(`${API_URL}/chat`, async ({ request }) => {
      capturedBody = await request.json();
      return HttpResponse.json({ reply: 'OK' });
    })
  );

  // ... render and interact

  await waitFor(() => {
    expect(capturedBody).toMatchObject({ message: 'Hello' });
  });
});
```

---

## setup.ts template

```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Use `onUnhandledRequest: 'error'` (stricter) if you want unhandled requests to fail the test — recommended for mature test suites.

---

---

## MSW v1 handler pattern (React 16 / 17)

Use when `msw` version in `package.json` is `^1.x`.

```typescript
// src/tests/msw/handlers/feature.ts  (MSW v1)
import { rest } from 'msw';

const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export const featureHandlers = [
  rest.get(`${API_URL}/resource`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: [] }));
  }),

  rest.post(`${API_URL}/resource`, async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.status(201), ctx.json({ id: 'new-id', ...body }));
  }),
];
```

Per-test override in MSW v1:
```typescript
import { rest } from 'msw';

it('handles 500 error', async () => {
  server.use(
    rest.get(`${API_URL}/resource`, (req, res, ctx) =>
      res(ctx.status(500), ctx.json({ error: 'Server error' }))
    )
  );
  // ... render and assert
});
```

---

## Biome config override for test files

If the project uses Biome, add this override to `biome.json` to allow `console` in tests:

```json
{
  "overrides": [
    {
      "includes": ["src/tests/**", "**/__tests__/**"],
      "linter": {
        "rules": {
          "suspicious": { "noConsole": "off" }
        }
      }
    }
  ]
}
```
