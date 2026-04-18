---
name: nestjs-vitest-unit-test
description: >
  Expert skill for writing unit and integration tests in NestJS applications using Vitest and
  @nestjs/testing. ALWAYS use this skill when the user asks to write, add, or fix tests in a
  NestJS project — "write tests for this service", "add tests before refactoring", "set up
  vitest in NestJS", "write a controller test", "write regression tests", or "check coverage".
  Covers both configuring the test stack from scratch and writing meaningful tests for any
  NestJS artifact type (controller, service, guard, pipe, interceptor, exception filter).
  Never write tests just for coverage — every test must verify observable behavior or guard
  a critical regression path.
---

## How to use this skill

Follow the four phases in order every time. Do not skip Phase 1 even when the stack looks configured — the SWC plugin is the single most common silent failure point and must be confirmed before writing any test code.

---

## Phase 1 — Diagnostic

Read these files to understand the project state:

1. `package.json` — extract exact versions of `vitest`, `@nestjs/testing`, `supertest`, `@vitest/coverage-v8`, `unplugin-swc`, `@swc/core`
2. `vitest.config.ts` — confirm `unplugin-swc` plugin is present, `environment: 'node'`, `globals: true`, path alias resolution
3. `tsconfig.json` — confirm `emitDecoratorMetadata: true` and `experimentalDecorators: true`
4. `package.json` scripts — check which test scripts exist (`test`, `test:cov`, `test:e2e`)
5. `src/` — scan for any existing `*.spec.ts` or `*.e2e-spec.ts` files to understand established patterns

**After reading, decide:**
- SWC plugin present + `@nestjs/testing` installed → go to **Phase 3**
- Missing or partial stack → go to **Phase 2**

**The SWC plugin is non-negotiable.** NestJS decorators (`@Injectable`, `@Controller`, `@Module`) emit TypeScript metadata via `emitDecoratorMetadata`. Vitest's default transpiler (esbuild) does not emit this metadata — it produces silently broken DI containers where every test fails with `Cannot read properties of undefined` or `Nest can't resolve dependencies`. `unplugin-swc` replaces esbuild with SWC, which emits the metadata correctly.

---

## Phase 2 — Configuration plan (stack missing or incomplete)

### 2a. Install dependencies

Before running any install, invoke the `npm-security-check` skill. Then install pinned versions:

```bash
pnpm add -D vitest@4 @vitest/coverage-v8@4 @nestjs/testing supertest @types/supertest unplugin-swc @swc/core
```

Version targets for NestJS 11:
- `vitest` → `^4.x` / `@nestjs/testing` → match `@nestjs/common` version exactly / `supertest` → `^7.x`

See `references/setup-config.md` → **Exact version table** for pinned versions.

### 2b. Create or update vitest.config.ts

Always use a **dedicated** `vitest.config.ts` for NestJS — do not merge into a root Vite config used by the frontend. See `references/setup-config.md` → **vitest.config.ts template**.

Key requirements:
- `plugins: [swc.vite({ jsc: { ... decoratorMetadata: true } })]` — mandatory
- `environment: 'node'` — NestJS runs in Node, not a browser
- `globals: true` — `describe`, `it`, `expect`, `vi` available without imports
- `include: ['src/**/*.spec.ts']` — unit tests only in this config
- Path alias must match `tsconfig.json` `paths` (e.g., `@api/*` → `src/*`)

### 2c. Create vitest.e2e.config.ts

E2E tests need a separate config with `include: ['test/**/*.e2e-spec.ts']` and `testTimeout: 30000`. See `references/setup-config.md` → **vitest.e2e.config.ts template**.

### 2d. Add scripts to package.json

Verify these scripts exist — add only the ones missing:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:cov": "vitest run --coverage",
  "test:e2e": "vitest run --config vitest.e2e.config.ts"
}
```

### 2e. Validate with a smoke test

Create one minimal controller test, run `pnpm test`, and confirm it passes before proceeding. A passing smoke test proves the SWC plugin is wired correctly. If the module compiles but inject fails, `decoratorMetadata: true` is missing from the SWC config.

---

## Phase 3 — Analyze the NestJS artifact to test

Before writing tests, identify what kind of artifact you are testing and what it actually does.

### 3a. Identify the artifact type

| Artifact | What to read |
|---|---|
| Controller | Source file + its service dependency + route DTOs |
| Service | Source file + its injected deps (ConfigService, repos, SDK clients) |
| Guard | Source file + understand what `canActivate` reads from the request |
| Pipe | Source file — usually pure transformation / validation logic |
| Interceptor | Source file + understand the `CallHandler` stream it wraps |
| Exception filter | Source file + understand the `ArgumentsHost` it uses |

### 3b. For each artifact, answer these questions

1. **What are the injected dependencies?** — list each `@Inject` token and what it does
2. **What are the public methods / route handlers?** — list them with their input shapes
3. **What are the success paths?** — what does each method return when everything works?
4. **What are the failure paths?** — what exceptions does it throw, and under which conditions?
5. **Is there async behavior?** — does it `await` external calls? Can those calls reject?
6. **Is there conditional logic?** — branches on config values, file types, user roles?

From this analysis, list all test cases **before touching the test file**. Each case must answer: "What observable behavior does this verify?"

---

## Phase 4 — Write the tests

### File location convention

Unit tests live **in the same directory** as the source file, named `*.spec.ts`:

```
src/chat/
├── chat.controller.ts
├── chat.service.ts
├── chat.module.ts
├── chat.controller.spec.ts   ← here
└── chat.service.spec.ts      ← here
```

E2E tests live in a top-level `test/` directory:

```
test/
└── chat.e2e-spec.ts
```

### Test file structure

```typescript
import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MyController } from './my.controller';
import { MyService } from './my.service';

describe('MyController', () => {
  let controller: MyController;
  let service: { doSomething: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = { doSomething: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyController],
      providers: [{ provide: MyService, useValue: service }],
    }).compile();

    controller = module.get(MyController);
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  describe('doSomething()', () => {
    it('delegates to the service and returns its result', async () => {
      service.doSomething.mockResolvedValue({ id: '1' });

      const result = await controller.doSomething({ input: 'test' });

      expect(service.doSomething).toHaveBeenCalledWith({ input: 'test' });
      expect(result).toEqual({ id: '1' });
    });

    it('propagates service errors without catching them', async () => {
      service.doSomething.mockRejectedValue(new Error('DB down'));

      await expect(controller.doSomething({ input: 'x' })).rejects.toThrow('DB down');
    });
  });
});
```

### Pattern A — Controller tests

A controller's job is to receive a request, delegate to a service, and return the result. The test proves the delegation is correct — not the business logic (that belongs in service tests).

```typescript
const mockService = { chat: vi.fn() };

await Test.createTestingModule({
  controllers: [ChatController],
  providers: [{ provide: ChatService, useValue: mockService }],
}).compile();
```

Assert: service was called with the correct DTO, controller returns the service's result, service exceptions propagate unchanged.

### Pattern B — Service tests (with external SDK client)

When the service instantiates an external client in its constructor (e.g., `new OpenAI()`), you cannot inject it as a NestJS provider. You must intercept the module import before it is evaluated with `vi.hoisted()` + `vi.mock()`.

```typescript
// At the very top of the file — before any other imports
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

// Normal imports follow
import { Test, type TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
```

`vi.hoisted()` runs synchronously before any module evaluation. Without it, the variable `mockCreate` is in the temporal dead zone (TDZ) when the `vi.mock()` factory executes — the factory is hoisted by Vitest's transformer but the variable declaration is not.

### Pattern C — Service tests (with TypeORM repository)

```typescript
import { getRepositoryToken } from '@nestjs/typeorm';
import { MyEntity } from './my.entity';

const mockRepo = { findOne: vi.fn(), save: vi.fn(), create: vi.fn() };

await Test.createTestingModule({
  providers: [
    MyService,
    { provide: getRepositoryToken(MyEntity), useValue: mockRepo },
  ],
}).compile();
```

Only mock the repository methods the service actually calls. See `references/mock-patterns.md` → **TypeORM Repository** for common patterns.

### Pattern D — Guard tests (unit)

Test `canActivate()` directly with a mock `ExecutionContext`:

```typescript
const mockContext = {
  switchToHttp: () => ({
    getRequest: () => ({ headers: { authorization: 'Bearer valid' } }),
  }),
} as ExecutionContext;

const result = await guard.canActivate(mockContext);
expect(result).toBe(true);
```

See `references/mock-patterns.md` → **ExecutionContext** for a reusable factory helper.

### Pattern E — Pipe tests

Pipes are pure functions — instantiate directly, no module needed:

```typescript
const pipe = new MyValidationPipe();

it('passes valid input through', () => {
  expect(pipe.transform('valid', { type: 'body' })).toBe('valid');
});

it('throws BadRequestException for invalid input', () => {
  expect(() => pipe.transform(null, { type: 'body' })).toThrow(BadRequestException);
});
```

### Pattern F — Interceptor tests

```typescript
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';

const mockCallHandler: CallHandler = {
  handle: vi.fn().mockReturnValue(of({ data: 'upstream' })),
};

const result$ = interceptor.intercept(mockContext, mockCallHandler);
const result = await firstValueFrom(result$);
expect(result).toEqual({ data: 'upstream' });
```

### Pattern G — E2E tests (Supertest)

```typescript
import request from 'supertest'; // NOT: import * as request from 'supertest'
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Chat E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /chat returns 200 with a reply', async () => {
    await request(app.getHttpServer())
      .post('/chat')
      .send({ message: 'Hello', history: [], context: '', lang: 'en', candidateName: 'Jane' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('reply');
        expect(typeof res.body.reply).toBe('string');
      });
  });
});
```

`import request from 'supertest'` (default import) is required. `import * as request` fails at runtime because supertest exports a callable function as its default export, not a namespace.

### Lifecycle rules

| Scope | Create module | Close module | Clear mocks |
|---|---|---|---|
| Unit test | `beforeEach` | `afterEach` → `module.close()` | `afterEach` → `vi.clearAllMocks()` |
| E2E test | `beforeAll` | `afterAll` → `app.close()` | Not applicable |

Creating a fresh module per unit test (`beforeEach`) prevents state leakage and ensures mock call counts are accurate per test. The overhead is negligible.

### ConfigService mock

```typescript
import { ConfigService } from '@nestjs/config';

const mockConfig = {
  get: vi.fn((key: string, defaultVal?: unknown) => defaultVal ?? undefined),
  getOrThrow: vi.fn((key: string) => {
    throw new Error(`Config key "${key}" not mocked in this test`);
  }),
};

// In providers:
{ provide: ConfigService, useValue: mockConfig }

// Set per-test return values BEFORE module.compile() when config is read in constructor:
mockConfig.getOrThrow.mockReturnValue('sk-test-key');
mockConfig.get.mockImplementation((key) => key === 'OPENAI_MODEL' ? 'gpt-4o-mini' : undefined);
```

---

## What makes a good NestJS test

Write a test when it answers YES to at least one of these:

- Does it verify that the controller delegates correctly to the service with the right arguments?
- Does it verify that the service throws the right HTTP exception under error conditions?
- Does it verify that a guard blocks requests missing required credentials?
- Does it verify that a pipe rejects invalid data with the correct error message?
- Does it guard against a regression if this code is refactored?

**Do NOT write a test** just to hit coverage. A test that mocks everything and asserts `toEqual(mockReturnValue)` only verifies the mock, not the code.

---

## Anti-patterns

| Avoid | Reason |
|---|---|
| Skipping `unplugin-swc` in vitest.config.ts | esbuild silently drops `emitDecoratorMetadata` — NestJS DI breaks with cryptic errors |
| `import * as request from 'supertest'` | supertest exports a callable default, not a namespace — fails at runtime in Vitest ESM |
| `vi.mock()` factory referencing outer `const` without `vi.hoisted()` | TDZ error — factory runs before variable initialization |
| Importing the real `AppModule` in unit tests | Pulls in real config validation, real DB connections, real API keys |
| Not calling `module.close()` in `afterEach` | Port listeners and async resources leak between tests |
| Asserting mock was called with `expect.any(Object)` on every argument | Tests nothing — be specific about the DTO shape |
| Creating TypeORM mocks with every repository method | Mock only what the service under test actually calls |
| Testing `new OpenAI()` construction without `vi.mock('openai', ...)` | Constructor runs during `compile()` with real credentials |
| `someObj as ReturnType<typeof vi.fn>` (direct cast from unrelated type) | TS2352: types don't overlap. Always go through `unknown` first: `someObj as unknown as ReturnType<typeof vi.fn>` |
| `array.at(-1)` in spec files when `tsconfig.json` targets ES2021 | TS2550: `Array.prototype.at()` is ES2022+, tsc fails in CI. Use `array[array.length - 1]` or bump `"target"` to `"es2022"` |
| Arrow function in `vi.fn()` mock for a constructor: `vi.fn(() => ({...}))` | Arrow functions can't be used with `new`. Use a regular function: `vi.fn(function() { return {...}; })` |

---

## Version compatibility reference

| NestJS | Vitest | @nestjs/testing | supertest | unplugin-swc |
|---|---|---|---|---|
| 11.x | 4.x | 11.x (= @nestjs/common) | 7.x | 1.x |
| 10.x | 2.x | 10.x | 6.x | 1.x |
| 9.x | 1.x | 9.x | 6.x | 1.x |

`@nestjs/testing` version must always match `@nestjs/common` exactly.

For detailed configuration templates, see `references/setup-config.md`.
For all provider mock patterns, see `references/mock-patterns.md`.
