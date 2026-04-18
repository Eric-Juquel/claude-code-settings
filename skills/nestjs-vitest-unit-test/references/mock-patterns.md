# Mock Patterns Reference

Concrete mock patterns for every common NestJS provider type.
Copy the pattern that matches your dependency, then adapt to the actual methods the code under test calls.

**Golden rule:** only mock the methods that the code under test actually calls. A mock with 15 methods for a service that only uses `findOne` obscures intent and breaks when the real interface changes.

---

## Table of Contents

1. [ConfigService](#configservice)
2. [OpenAI SDK](#openai-sdk)
3. [TypeORM Repository](#typeorm-repository)
4. [HttpService (@nestjs/axios)](#httpservice)
5. [ExecutionContext (guards and interceptors)](#executioncontext)
6. [CallHandler (interceptors)](#callhandler)
7. [ArgumentsHost (exception filters)](#argumentshost)
8. [ThrottlerGuard / global guards](#throttlerguard--global-guards)

---

## ConfigService

The most common dependency. Mock `get()` (returns `undefined` for missing keys) and `getOrThrow()` (throws for missing keys).

```typescript
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';

const mockConfig = {
  get: vi.fn(),
  getOrThrow: vi.fn(),
};

// In Test.createTestingModule providers:
{ provide: ConfigService, useValue: mockConfig }
```

**Set return values per test:**

```typescript
it('reads OPENAI_API_KEY from config', async () => {
  mockConfig.getOrThrow.mockImplementation((key: string) => {
    if (key === 'OPENAI_API_KEY') return 'sk-test';
    throw new Error(`Unexpected config key: ${key}`);
  });
  mockConfig.get.mockImplementation((key: string, def?: unknown) => {
    if (key === 'OPENAI_MODEL') return 'gpt-4o-mini';
    return def;
  });

  // Set BEFORE compile() — constructor reads config during module compilation
  const module = await Test.createTestingModule({
    providers: [MyService, { provide: ConfigService, useValue: mockConfig }],
  }).compile();

  const service = module.get(MyService);
  // ...
});
```

When a service reads config in its constructor (`new OpenAI({ apiKey: config.getOrThrow(...) })`), set mock return values **before** calling `compile()` — the constructor runs during module compilation.

---

## OpenAI SDK

The OpenAI client is instantiated inside the service constructor — it cannot be injected as a NestJS provider token. Intercept the module import at the file level using `vi.hoisted()` + `vi.mock()`.

Place this block **at the very top of the test file**, before all other imports:

```typescript
// chat.service.spec.ts

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

// Normal imports follow below
import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
```

**Why `vi.hoisted()`:** The `vi.mock()` call is hoisted to the top of the file by Vitest's transformer, but variables declared with `const` in the outer scope are not — they are in the temporal dead zone (TDZ) when the factory executes. `vi.hoisted()` runs synchronously before any module evaluation, making the variable available when the factory runs.

**Test examples:**

```typescript
describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue(undefined),
            getOrThrow: vi.fn().mockReturnValue('sk-test'),
          },
        },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  afterEach(() => vi.clearAllMocks());

  it('returns the assistant reply', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        finish_reason: 'stop',
        message: { content: 'Hello from AI.', tool_calls: undefined },
      }],
    });

    const result = await service.chat({
      message: 'Hello', history: [], context: '', lang: 'en', candidateName: 'Jane',
    });

    expect(result.reply).toBe('Hello from AI.');
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('loops through tool calls before returning the final reply', async () => {
    mockCreate
      .mockResolvedValueOnce({
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            content: null,
            tool_calls: [{
              id: 'call_1',
              type: 'function',
              function: { name: 'record_unknown_question', arguments: '{"question":"salary?"}' },
            }],
          },
        }],
      })
      .mockResolvedValueOnce({
        choices: [{
          finish_reason: 'stop',
          message: { content: 'I cannot answer that.' },
        }],
      });

    const result = await service.chat({
      message: 'What is the salary?', history: [], context: '', lang: 'en', candidateName: 'Jane',
    });

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.reply).toBe('I cannot answer that.');
  });
});
```

---

## TypeORM Repository

Use `getRepositoryToken(Entity)` as the provider token — never the repository class directly.

```typescript
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { vi } from 'vitest';

const mockUserRepo = {
  findOne: vi.fn(),
  find: vi.fn(),
  save: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
};

// In providers:
{ provide: getRepositoryToken(UserEntity), useValue: mockUserRepo }
```

**Common return value patterns:**

```typescript
// Entity found
mockUserRepo.findOne.mockResolvedValue({ id: '1', email: 'alice@example.com' });

// Entity not found — service should throw NotFoundException
mockUserRepo.findOne.mockResolvedValue(null);

// Save returns entity with generated fields
mockUserRepo.save.mockImplementation(async (entity) => ({
  id: 'generated-uuid',
  createdAt: new Date(),
  ...entity,
}));

// DB error
mockUserRepo.findOne.mockRejectedValue(new Error('Connection refused'));
```

**QueryBuilder** (when the service uses `createQueryBuilder`):

```typescript
const mockQb = {
  where: vi.fn().mockReturnThis(),
  andWhere: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  getMany: vi.fn().mockResolvedValue([]),
  getOne: vi.fn().mockResolvedValue(null),
};

const mockRepo = {
  createQueryBuilder: vi.fn().mockReturnValue(mockQb),
};
```

**DataSource** (when injecting DataSource directly):

```typescript
import { DataSource } from 'typeorm';

const mockDataSource = {
  getRepository: vi.fn().mockReturnValue(mockUserRepo),
  transaction: vi.fn().mockImplementation(async (fn) => fn(mockUserRepo)),
};

{ provide: DataSource, useValue: mockDataSource }
```

---

## HttpService

`HttpService` from `@nestjs/axios` wraps axios and returns RxJS `Observable`s.

```typescript
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import type { AxiosResponse } from 'axios';
import { vi } from 'vitest';

const mockHttpService = {
  get: vi.fn(),
  post: vi.fn(),
};

{ provide: HttpService, useValue: mockHttpService }
```

**Mock a successful response:**

```typescript
const response: AxiosResponse = {
  data: { result: 'ok' },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
};

mockHttpService.get.mockReturnValue(of(response));
```

**Mock a network error:**

```typescript
import { AxiosError } from 'axios';

mockHttpService.post.mockReturnValue(
  throwError(() => new AxiosError('Network Error', 'ECONNREFUSED'))
);
```

---

## ExecutionContext

Used in guard and interceptor tests. Build the minimal shape that `canActivate` or `intercept` actually reads — do not fill in fields the code never accesses.

**Reusable factory for HTTP guards:**

```typescript
import type { ExecutionContext } from '@nestjs/common';

function buildHttpContext(requestOverrides: Record<string, unknown> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        user: null,
        ...requestOverrides,
      }),
      getResponse: () => ({
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      }),
    }),
    getClass: vi.fn(),
    getHandler: vi.fn(),
    getArgs: vi.fn(),
    getArgByIndex: vi.fn(),
    switchToRpc: vi.fn(),
    switchToWs: vi.fn(),
    getType: vi.fn().mockReturnValue('http'),
  } as unknown as ExecutionContext;
}

// Usage:
it('blocks requests without authorization header', async () => {
  const ctx = buildHttpContext({ headers: {} });
  expect(await guard.canActivate(ctx)).toBe(false);
});

it('allows requests with valid bearer token', async () => {
  const ctx = buildHttpContext({ headers: { authorization: 'Bearer valid-token' } });
  expect(await guard.canActivate(ctx)).toBe(true);
});
```

---

## CallHandler

Used in interceptor tests. `handle()` must return an Observable.

```typescript
import type { CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

const mockCallHandler: CallHandler = {
  handle: vi.fn().mockReturnValue(of({ data: 'upstream response' })),
};

it('passes the response through unchanged', async () => {
  const result$ = interceptor.intercept(mockContext, mockCallHandler);
  const result = await firstValueFrom(result$);

  expect(result).toEqual({ data: 'upstream response' });
  expect(mockCallHandler.handle).toHaveBeenCalledOnce();
});
```

**For interceptors that transform the response:**

```typescript
it('wraps the response in a data envelope', async () => {
  mockCallHandler.handle = vi.fn().mockReturnValue(of('raw value'));

  const result$ = interceptor.intercept(mockContext, mockCallHandler);
  const result = await firstValueFrom(result$);

  expect(result).toEqual({ data: 'raw value', timestamp: expect.any(String) });
});
```

---

## ArgumentsHost

Used in exception filter tests. Build the mock around what the filter actually calls.

```typescript
import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';

function buildArgumentsHost(requestOverrides = {}) {
  const mockJson = vi.fn();
  const mockStatus = vi.fn().mockReturnValue({ json: mockJson });

  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status: mockStatus }),
      getRequest: () => ({
        method: 'POST',
        url: '/upload',
        ...requestOverrides,
      }),
    }),
  } as unknown as ArgumentsHost;

  return { host, mockStatus, mockJson };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => { filter = new HttpExceptionFilter(); });

  it('responds with 400 for BadRequestException', () => {
    const { host, mockStatus, mockJson } = buildArgumentsHost();

    filter.catch(new BadRequestException('Invalid file type'), host);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: 'Invalid file type' })
    );
  });

  it('responds with 404 for NotFoundException', () => {
    const { host, mockStatus } = buildArgumentsHost();

    filter.catch(new NotFoundException('Resource missing'), host);

    expect(mockStatus).toHaveBeenCalledWith(404);
  });
});
```

---

## ThrottlerGuard / global guards

When a controller unit test fails because a global guard (e.g., `ThrottlerGuard`) is applied at the `AppModule` level but not in the test module, override it with a pass-through:

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';
import { vi } from 'vitest';

await Test.createTestingModule({
  controllers: [ChatController],
  providers: [
    { provide: ChatService, useValue: mockChatService },
    {
      provide: ThrottlerGuard,
      useValue: { canActivate: vi.fn().mockResolvedValue(true) },
    },
  ],
}).compile();
```

If the controller does not apply the guard at the class level (`@UseGuards`), the guard is only active in the full `AppModule` context and you do not need to mock it in unit tests.

**Global pipes (ZodValidationPipe, ValidationPipe):**

Global pipes registered via `APP_PIPE` in the root module do not apply in unit tests. To test pipe validation behavior, test the pipe directly (SKILL.md Pattern E) rather than via the controller. This is intentional — it keeps unit tests focused on the controller's own logic.
