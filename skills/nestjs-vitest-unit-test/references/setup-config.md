# Setup Configuration Templates

Reference templates for configuring Vitest + @nestjs/testing + unplugin-swc in a NestJS project.
All templates reflect NestJS 11 / Vitest 4 as the current production baseline.

---

## Table of Contents

1. [vitest.config.ts template](#vitestconfigts-template)
2. [vitest.e2e.config.ts template](#viteste2econfigts-template)
3. [Path alias resolution](#path-alias-resolution)
4. [package.json scripts](#packagejson-scripts)
5. [Exact version table](#exact-version-table)
6. [tsconfig.json requirements](#tsconfigjson-requirements)
7. [Biome config override for test files](#biome-config-override)

---

## vitest.config.ts template

This is the unit test config. Lives at the package root alongside `package.json`.

```typescript
// packages/api/vitest.config.ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/dto/**',
        'src/**/*.interface.ts',
        'src/**/*.type.ts',
      ],
    },
  },
  resolve: {
    alias: {
      // Mirror tsconfig.json paths exactly — adapt to your actual alias
      '@api': new URL('./src', import.meta.url).pathname,
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
        keepClassNames: true,
      },
    }),
  ],
});
```

**Why each SWC option matters:**
- `decorators: true` — enables TypeScript decorator syntax parsing in SWC
- `decoratorMetadata: true` — emits `design:type` / `design:paramtypes` metadata that NestJS DI reads at runtime to resolve constructor arguments
- `legacyDecorator: true` — NestJS uses Stage 2 decorators, not the TC39 Stage 3 proposal; this must match the TypeScript behavior configured in `tsconfig.json`
- `keepClassNames: true` — NestJS error messages and logging use class names; minification would produce unintelligible DI error messages

---

## vitest.e2e.config.ts template

E2E tests run the full NestJS application. They need a longer timeout and a separate `include` glob.

```typescript
// packages/api/vitest.e2e.config.ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@api': new URL('./src', import.meta.url).pathname,
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
        keepClassNames: true,
      },
    }),
  ],
});
```

E2E tests do not include coverage — they are too coarse-grained for meaningful branch coverage data. Run `test:cov` only on unit tests.

---

## Path alias resolution

If your `tsconfig.json` uses `paths` like `"@api/*": ["src/*"]`, the `resolve.alias` in `vitest.config.ts` must mirror this exactly. Vitest does not read `tsconfig.json` paths automatically.

Common mapping patterns:

```typescript
// tsconfig.json: "@api/*": ["src/*"]
resolve: {
  alias: {
    '@api': new URL('./src', import.meta.url).pathname,
  },
}

// tsconfig.json: "@/*": ["src/*"]
resolve: {
  alias: {
    '@': new URL('./src', import.meta.url).pathname,
  },
}

// tsconfig.json with multiple aliases
resolve: {
  alias: {
    '@api': new URL('./src', import.meta.url).pathname,
    '@shared': new URL('./src/shared', import.meta.url).pathname,
  },
}
```

After adding an alias, verify it by importing from the alias path in a test and running `pnpm test`. A module resolution failure here produces `Cannot find module '@api/...'` — it means the alias is missing or the path is wrong.

---

## package.json scripts

Add only the scripts that are missing. Do not rename or overwrite existing ones.

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:e2e": "vitest run --config vitest.e2e.config.ts"
  }
}
```

If the project uses `dotenv-cli` to load a `.env.test` for E2E tests (recommended to avoid hitting real services):

```json
{
  "test:e2e": "dotenv -e .env.test -- vitest run --config vitest.e2e.config.ts"
}
```

---

## Exact version table

Validated for NestJS 11. Always run `npm-security-check` before installing.

| Package | Version | `devDependencies` |
|---|---|---|
| `vitest` | `^4.1.0` | yes |
| `@vitest/coverage-v8` | `^4.1.0` | yes |
| `@nestjs/testing` | match `@nestjs/common` exactly | yes |
| `supertest` | `^7.2.0` | yes |
| `@types/supertest` | `^7.2.0` | yes |
| `unplugin-swc` | `^1.5.0` | yes |
| `@swc/core` | `^1.15.0` | yes |

None of these belong in `dependencies`. All are test-only tooling.

---

## tsconfig.json requirements

These two options are mandatory for NestJS decorator-based DI. Confirm they exist before debugging any DI failure:

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

Without `emitDecoratorMetadata`, TypeScript does not emit `design:paramtypes` metadata. SWC's `decoratorMetadata: true` in `vitest.config.ts` covers the test run, but the `tsconfig.json` settings are still required for the NestJS CLI build (`nest build`) and for editors to type-check decorator usage correctly.

---

## Biome config override

Test files legitimately use `console.log` for debugging and cast mocks to `unknown`. Add this override to `biome.json`:

```json
{
  "overrides": [
    {
      "includes": ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noConsole": "off",
            "noExplicitAny": "off"
          }
        }
      }
    }
  ]
}
```

The `noExplicitAny` override is useful because mock objects often require `as unknown as SomeType` casts that Biome flags as `noExplicitAny` violations.
