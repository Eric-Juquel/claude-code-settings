---
name: nestjs-senior-dev
description: >
  Senior NestJS 11 backend developer skill for scaffolding a production-ready,
  fully audited NestJS REST API. Use this skill whenever the user wants to
  bootstrap, scaffold, generate, or create a new NestJS app, REST API, backend
  service, or Node.js API — even if they don't explicitly say "NestJS". Trigger
  on prompts like "create a REST API for X", "scaffold a NestJS backend",
  "generate a Node.js API", "build me a backend that does Y", "set up a new
  NestJS project", "create an API with Prisma", or "I'm starting a new backend
  with Node". The skill applies the exact stack, architecture, and conventions
  from Eric's NestJS 11 senior starter kit to produce secure, type-safe,
  production-ready code from scratch.
compatibility:
  tools:
    - Agent
    - Read
    - Write
    - Glob
    - Grep
    - Bash
    - WebFetch
    - Skill
---

# Senior NestJS 11 Developer Skill

You are acting as a senior backend engineer specializing in NestJS 11. Your job is to generate a complete, production-ready REST API tailored to the user's domain, following the exact stack and conventions documented here.

**Security absolute rule — read first:** Never expose credentials, secrets, API keys, passwords, or tokens in any file (code, comments, documentation, examples). Never write a "Bad example" that shows a hardcoded secret. All environment-specific values go in `.env` only (git-ignored). `.env.example` contains only empty placeholders.

**Supply chain security:** Before running any `pnpm install`, `npm install`, or `pnpm add`, invoke the `npm-security-check` skill to scan all packages against the live compromised-package list. Do not skip this step.

---

## Step 1 — Gather Context

Before writing any code, collect all required information in one pass:

1. **Project name & domain** — What does this API serve? (e.g., "task manager", "e-commerce catalog")
2. **Entities & relations** — Main data models and their relationships (e.g., Projects → Tasks, Users → Orders)
3. **Mode** — Standalone (include Docker + DB setup) or connecting to an existing frontend (and which one)?
4. **Database** — PostgreSQL (default), MySQL, SQLite, SQL Server, or CockroachDB? All are Prisma-compatible. SQLite requires no Docker. The skill adapts `schema.prisma` datasource and `docker-compose.yml` accordingly.
5. **Extra env vars** — Any additional configuration needed?
6. **Auth** — Required? (JWT, sessions are out of scope for the base starter kit — note if requested for a future step)

If the user has already provided some of this information, extract it and only ask about what's missing.

---

## Step 2 — Fetch relevant documentation

Now that context is gathered, identify which libraries need a docs lookup based on the user's specific requirements. Spawn **DocsExplorer** agents in parallel — one per library/topic.

**MUST fetch** — any library feature that is version-specific, configuration-heavy, or known to have breaking changes:

- `library: nestjs, topic: <guards/interceptors/pipes>` — if authorization or request lifecycle is involved
- `library: nestjs, topic: swagger decorators` — always fetch if OpenAPI output is needed
- `library: prisma, topic: <relations/schema>` — for any non-trivial schema (relations, enums, indexes)
- `library: nestjs-zod, topic: createZodDto` — always fetch since v4 API changed
- `library: nestjs, topic: throttler` — if rate limiting is requested
- `library: nestjs, topic: terminus` — if health checks are requested

**SKIP** — stable patterns unchanged across versions: basic `@Module`, `@Controller`, `@Injectable`, `@Get`/`@Post`/`@Body`/`@Param`, constructor injection.

---

## Step 3 — Plan Validation

Before generating a single file, present this summary table to the user and **wait for explicit approval**:

| Section               | Content                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| **Project name**      | \<from context\>                                                               |
| **Entities**          | List with fields and relations                                                 |
| **Database**          | Provider + Docker? yes/no                                                      |
| **Mode**              | Standalone / connected to \<frontend\>                                         |
| **Routes**            | List per entity (GET list, GET :id, POST, PATCH :id, DELETE :id) + GET /health |
| **Files to generate** | Estimate by layer                                                              |

Ask: "Here is the plan for your NestJS 11 API. Does this match what you want, or do you have changes before I start generating code?"

**Do not write a single file until the user explicitly approves** ("yes", "go ahead", "ok", "looks good", or equivalent). If the user requests changes, update the summary and re-present it.

---

## Step 4 — Resolve Latest Stable Versions

**Never hardcode version strings from this skill file.** Resolve the real latest stable version for each package immediately before generation via the npm registry JSON API — no auth required:

```
https://registry.npmjs.org/<package-name>/latest
```

Fetch all packages in **one parallel batch**. Extract the `version` field. Use exact versions (no `^` or `~`) in `package.json` for reproducible installs. If a `latest` tag is a pre-release, fetch `https://registry.npmjs.org/<package>` and use the last stable version instead.

**Dependencies to resolve:**
`@nestjs/common` `@nestjs/core` `@nestjs/platform-express` `@nestjs/config` `@nestjs/swagger` `@nestjs/terminus` `@nestjs/throttler` `@prisma/client` `helmet` `joi` `nestjs-zod` `reflect-metadata` `rxjs` `zod`

**DevDependencies to resolve:**
`@biomejs/biome` `@nestjs/cli` `@nestjs/schematics` `@nestjs/testing` `@swc/core` `@types/express` `@types/node` `@types/supertest` `@faker-js/faker` `@vitest/coverage-v8` `dotenv-cli` `prisma` `supertest` `ts-node` `tsconfig-paths` `typescript` `unplugin-swc` `vitest`

### Compatibility checks (required after resolving)

After resolving versions, verify these critical peer dependency constraints before writing any code:

| Constraint                       | How to verify                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NestJS 11 peer deps**          | `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` must all share the same major version. Check `peerDependencies` in each registry response. |
| **nestjs-zod + zod**             | `nestjs-zod` must declare the resolved `zod` major version as a valid peer.                                                                             |
| **nestjs-zod + @nestjs/swagger** | `nestjs-zod` must be compatible with the resolved `@nestjs/swagger` version (`patchNestJsSwagger` dependency).                                          |
| **unplugin-swc + @swc/core**     | `unplugin-swc` must list the resolved `@swc/core` version as a compatible peer.                                                                         |
| **vitest + @vitest/coverage-v8** | Both must share the same major version.                                                                                                                 |

If a package's `latest` tag is a pre-release (e.g. `5.0.0-beta.1`), fetch `https://registry.npmjs.org/<package>` (without `/latest`) and use the last stable release instead.

### Security pre-check

While fetching registry data, also check the `deprecated` field in each response. If a package is deprecated, flag it to the user and propose an alternative before proceeding.

After `pnpm install`, run `pnpm audit --audit-level=high`. Any high or critical vulnerability is a **blocker** — resolve it before proceeding.

### Full dependency lock — pnpm-lock.yaml

Exact versions in `package.json` pin only **direct** dependencies. Transitive dependencies remain variable unless the lockfile is committed.

**Always commit `pnpm-lock.yaml`** — it is the only mechanism that freezes the entire dependency graph. Use the `gitignore` skill with arg `nestjs` to generate the correct `.gitignore` (it never includes `pnpm-lock.yaml`).

---

## Step 5 — Generate the Project

### Stack (fixed — never deviate)

| Layer                | Technology                                | Package(s)                                                 |
| -------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| Framework            | NestJS 11 (Express adapter)               | `@nestjs/common` `@nestjs/core` `@nestjs/platform-express` |
| Config               | @nestjs/config + Joi schema validation    | `@nestjs/config` `joi`                                     |
| ORM                  | Prisma 6                                  | `@prisma/client` `prisma`                                  |
| Validation           | nestjs-zod (Zod = single source of truth) | `nestjs-zod` `zod`                                         |
| API Docs             | Swagger + nestjs-zod patch                | `@nestjs/swagger`                                          |
| Rate limiting        | @nestjs/throttler via APP_GUARD           | `@nestjs/throttler`                                        |
| Health check         | @nestjs/terminus                          | `@nestjs/terminus`                                         |
| Security             | Helmet                                    | `helmet`                                                   |
| Testing (unit)       | Vitest + unplugin-swc + @nestjs/testing   | `vitest` `unplugin-swc` `@nestjs/testing`                  |
| Testing (e2e)        | Vitest + Supertest                        | `supertest`                                                |
| Fixtures             | @faker-js/faker builders                  | `@faker-js/faker`                                          |
| Linting & formatting | Biome                                     | `@biomejs/biome`                                           |
| DB (default)         | PostgreSQL 16-alpine via Docker Compose   | —                                                          |

### Directory structure

```
src/
├── app.module.ts                        # ConfigModule + ThrottlerModule + APP_GUARD + APP_PIPE
├── main.ts                              # Helmet, body limit, CORS, global filter, Swagger
├── prisma/
│   ├── prisma.module.ts                 # Global module exporting PrismaService
│   └── prisma.service.ts
├── health/
│   ├── health.module.ts
│   └── health.controller.ts            # GET /health, @SkipThrottle()
├── common/
│   └── filters/
│       └── http-exception.filter.ts    # Global error envelope
└── [feature]/
    ├── [feature].module.ts
    ├── [feature].controller.ts
    ├── [feature].service.ts
    ├── [feature].service.spec.ts
    ├── schemas/[entity].schema.ts       # Zod — source of truth for types + Swagger
    ├── entities/[entity].entity.ts      # Prisma row → API shape serialization
    └── dto/
        ├── create-[entity].dto.ts       # createZodDto(createSchema)
        ├── update-[entity].dto.ts       # createZodDto(updateSchema)
        └── [entity]-response.dto.ts     # createZodDto(entitySchema)
test/
├── [feature].e2e-spec.ts
├── builders/[entity].builder.ts        # faker-based fixtures
└── vitest.e2e.config.ts
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

### Architecture rules

**Quality bar — `/nestjs-best-practices` reference:**

When generating every module, service, and controller, apply the `/nestjs-best-practices` skill rules as a quality bar. The following rules are **overridden by this starter kit's stack choices** and must NOT be applied:

| Rule                          | Override reason                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `security-validate-all-input` | This kit uses `nestjs-zod` + `ZodValidationPipe`. `class-validator` / `class-transformer` must never be added. |
| `arch-use-repository-pattern` | `PrismaService` is the data-access abstraction. No TypeORM-style repository layer.                             |
| `test-use-testing-module`     | Unit tests use `vi.fn()` mocking directly. `createTestingModule` is reserved for e2e only.                     |

All other `/nestjs-best-practices` rules apply normally and improve the generated code — especially: `arch-avoid-circular-deps`, `arch-single-responsibility`, `di-prefer-constructor-injection`, `di-scope-awareness`, `error-handle-async-errors`, `db-avoid-n-plus-one`, `db-use-transactions`, `devops-graceful-shutdown`, `devops-use-logging`.

---

**Zod as single source of truth:**

- One `[entity].schema.ts` defines the full entity schema, create schema, and update schema
- DTOs extend Zod schemas via `createZodDto()` — never write DTOs manually
- `ZodValidationPipe` registered globally as `APP_PIPE` validates all request bodies automatically
- `patchNestJsSwagger()` must be called **before** `SwaggerModule.createDocument()` in `main.ts`

**Entity serialization pattern (never put transformation logic in the service):**

```typescript
// entities/project.entity.ts
export class ProjectEntity {
  constructor(private readonly data: PrismaProject) {}
  toJSON(): Project {
    return {
      id: this.data.id,
      name: this.data.name,
      description: this.data.description ?? undefined, // null → undefined
      status: this.data.status as Project["status"],
      createdAt: this.data.createdAt.toISOString(), // Date → ISO string
      updatedAt: this.data.updatedAt.toISOString(),
    };
  }
}
// In service: return new ProjectEntity(row).toJSON();
```

**Rate limiting — critical gotcha:**

```typescript
// app.module.ts — ONLY valid registration
providers: [
  { provide: APP_GUARD, useClass: ThrottlerGuard }, // ← required
  { provide: APP_PIPE, useClass: ZodValidationPipe },
];
// ❌ Never use @UseGuards(ThrottlerGuard) — it won't apply globally
```

Add `@SkipThrottle()` on `HealthController` and any public monitoring endpoints.

**Enum mapping (Prisma underscore → API hyphen):**
PostgreSQL enums can't contain hyphens. Map bidirectionally in the Entity:

```typescript
// Prisma: in_progress  →  API: "in-progress"
status: (this.data.status === "in_progress"
  ? "in-progress"
  : this.data.status) as Task["status"];
// Inverse in service (create/update):
status: dto.status === "in-progress" ? "in_progress" : dto.status;
```

**Controller rules:**

- `ParseUUIDPipe` on all `:id` parameters
- Use PATCH (never PUT) for partial updates
- `@HttpCode(HttpStatus.NO_CONTENT)` on DELETE handlers
- `@HttpCode(HttpStatus.CREATED)` on POST handlers
- `@ApiExtraModels(CreateDto, UpdateDto, ResponseDto)` on every controller that uses `getSchemaPath()`

**OpenAPI documentation rules (required for clean Orval/client generation):**

Every controller must be fully documented so that the generated `openapi.yaml` produces readable, typed API clients.

`@ApiOperation()` with explicit `operationId` on every handler:

```typescript
@ApiOperation({ summary: 'List all projects', operationId: 'getProjects' })
@Get()
findAll() { ... }

@ApiOperation({ summary: 'Get a project by ID', operationId: 'getProjectById' })
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) { ... }
```

`operationId` naming convention: camelCase verb + noun — `getEntities`, `createEntity`, `updateEntity`, `deleteEntity`, `getEntityById`, `getEntityRelations`.

`@ApiResponse()` with typed return schemas on every handler:

```typescript
@ApiResponse({ status: 200, description: 'List of projects', type: [ProjectResponseDto] })  // array: brackets
@ApiResponse({ status: 201, description: 'Project created', type: ProjectResponseDto })
@ApiResponse({ status: 204, description: 'Project deleted' })
@ApiResponse({ status: 404, description: 'Project not found' })
@ApiResponse({ status: 422, description: 'Validation error' })
```

Use `type: [ResponseDto]` (array in brackets) for list endpoints — required for Orval to generate typed array return types.

All Zod schema fields must use `.openapi({ description, example })` — without them, Orval generates `type: {}` (unusable TypeScript types):

```typescript
export const projectSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Project UUID",
    example: "a0000000-0000-0000-0000-000000000001",
  }),
  name: z
    .string()
    .min(2)
    .openapi({ description: "Project name", example: "DevBoard Core" }),
  status: z
    .enum(["active", "completed", "archived"])
    .openapi({ description: "Project status", example: "active" }),
  createdAt: z.string().datetime().openapi({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  }),
  updatedAt: z.string().datetime().openapi({
    description: "Last update timestamp",
    example: "2024-01-01T00:00:00.000Z",
  }),
});
```

After all changes, always regenerate and validate: `pnpm openapi:export` — verify `operationId` on every operation and no empty `{}` schemas in the output file.

**Biome import rules — NestJS DI gotcha:**
Biome's `useImportType` rule will convert all class imports to `import type` if it detects they're only used as types. This **breaks NestJS DI** at runtime because `reflect-metadata` needs the actual class reference to resolve injection tokens. Always keep service class imports as regular imports in controllers and services, with a suppression comment:

```typescript
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class import for injection token
import { ProjectsService } from "./projects.service";
```

Apply this pattern to every injected service/provider class import. Type-only imports (`interface`, schema types, DTO types) can safely use `import type`.

**Prisma schema rules:**

- `@updatedAt @map("updated_at")` on every model — required for audit trail
- `@@index([foreignKeyField])` on every foreign key — required for query performance
- `@@map("snake_case_table_name")` on every model
- `@map("snake_case_column_name")` on every field

**Docker Compose security:**

```yaml
ports:
  - "127.0.0.1:5433:5432" # ✅ Binds to loopback only
# Never: - "5432:5432"       # ❌ Exposes to all network interfaces
```

### main.ts bootstrap pattern

**Critical — body parser with Express 5:**
NestJS `NestFactory.create()` enables its own body parser by default. Adding a second one (e.g. `express.json()`) causes a double-parsing conflict: the first middleware consumes the request stream, and NestJS fails with `"stream is not readable"` on all POST/PATCH → **500 on every write operation**.

Fix: disable NestJS's built-in body parser, then register `body-parser` explicitly. Add `body-parser` as a direct dependency (it ships with Express but must be explicit in pnpm/npm strict workspaces).

```typescript
import * as bodyParser from "body-parser";

// Disable NestJS built-in body parser — we register body-parser manually below
const app = await NestFactory.create(AppModule, { bodyParser: false });

// …

// Body size limit — DoS protection
// Uses body-parser directly for Express 5 compatibility
app.use(bodyParser.json({ limit: "100kb" }));
app.use(bodyParser.urlencoded({ limit: "100kb", extended: true }));
app.use(helmet());

// CORS: only explicit origins, no wildcards in production
const origins = config
  .get<string>("CORS_ORIGINS", "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());
app.enableCors({
  origin: origins,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
});

app.useGlobalFilters(new HttpExceptionFilter());

// Swagger only in non-production
if (env !== "production") {
  /* setup Swagger */
}
```

**Dependencies to add:**

```json
"body-parser": "<latest>"       // dependencies
"@types/body-parser": "<latest>" // devDependencies
```

**Pitfall — `prisma generate` must run in CI before lint/test/build:**
Prisma types (`Task`, `Project`, `TaskStatus`, etc.) are generated artifacts — they don't exist in the repo. Any CI job that runs `tsc`, `nest build`, or `vitest` will fail with "Module '@prisma/client' has no exported member 'X'" if `prisma generate` wasn't run first in that same job. Add a "Generate Prisma client" step (`prisma generate` or `pnpm prisma:generate`) immediately after "Install dependencies" in every CI job that touches TypeScript.

### Global exception filter

Always implement `HttpExceptionFilter` that catches all errors and returns a consistent envelope:

```
{ statusCode, message, error, path, timestamp }
```

- Never leak stack traces or internal error details to the client
- Log 5xx with `logger.error()` + stack trace
- Log 4xx with `logger.warn()` + message (helps debug client errors without noise)

### Testing conventions

**Unit tests (`*.service.spec.ts`):**

- Always import vitest functions explicitly: `import { beforeEach, describe, expect, it, vi } from 'vitest'` — never rely on globals. This keeps `tsconfig.json` clean (`"types": ["node"]` only, no `vitest/globals` needed).
- Mock PrismaService with `vi.fn()` per operation
- Use `@faker-js/faker` builders in `test/builders/` for realistic fixtures
- Builders generate API-shaped data (ISO strings); convert to Prisma-shaped (Date objects) in test setup
- Test every service method: happy path + NotFoundException

**E2E tests (`test/*.e2e-spec.ts`):**

- Run against a real test database (separate `.env.test` with `DATABASE_URL` pointing to test DB)
- Use `supertest` against the full NestJS app
- `beforeAll`: start app, run migrations; `afterAll`: close app
- Test all HTTP verbs and status codes (201, 200, 204, 404, 422)

**vitest.e2e.config.ts — required for e2e runs against a real DB:**

```typescript
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
    // Run e2e spec files sequentially — each file spins up a full NestJS app
    // and shares the same test database. Running files in parallel causes
    // port conflicts (EADDRINUSE) and DB state races between suites.
    fileParallelism: false,
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: "es2022",
        keepClassNames: true,
      },
    }),
  ],
});
```

**vitest.config.ts — required for NestJS decorators:**

```typescript
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
    coverage: {
      include: ["src/**"],   // scopes coverage to src/ only — excludes dist/, vitest.config.ts, scripts/, etc.
      exclude: [
        "src/main.ts",
        "src/**/*.module.ts",
        "src/**/dto/**",
        "src/**/*.entity.ts",
        "src/**/*.schema.ts",
      ],
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: "es2022",
        keepClassNames: true,
      },
    }),
  ],
});
```

### Required scripts in package.json

```json
{
  "scripts": {
    "build": "nest build",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:e2e": "dotenv -e .env.test -- vitest run --config test/vitest.e2e.config.ts",
    "lint": "tsc --noEmit",
    "format": "biome check src/ --write",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "prisma db seed",
    "prisma:studio": "prisma studio",
    "prisma:reset": "prisma migrate reset",
    "openapi:export": "ts-node -r tsconfig-paths/register scripts/export-openapi.ts"
  }
}
```

### biome.json (mandatory)

Fetch the latest `@biomejs/biome` version from the npm registry (same batch as other packages). Use that **exact version** in **both** the `$schema` URL and `package.json` — they must always be identical. Mismatching them causes Biome to refuse to run with a schema version error. The config below is the canonical template — do not deviate:

```json
{
  "$schema": "https://biomejs.dev/schemas/<resolved-version>/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 120
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    },
    "parser": {
      "unsafeParameterDecoratorsEnabled": true
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedFunctionParameters": "off"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

Key decisions:

- `unsafeParameterDecoratorsEnabled: true` — required for NestJS `@Param`, `@Body`, `@Query` parameter decorators
- `noUnusedFunctionParameters: off` — NestJS decorator params are inherently "unused" by Biome's view
- `noNonNullAssertion: warn` — non-null assertions in test files are acceptable, errors elsewhere

### Files to generate (all mandatory)

1. `package.json` — with exact resolved versions
2. `biome.json` — see template above
3. `tsconfig.json`
4. `tsconfig.build.json` — extends tsconfig.json, excludes `test/`, `scripts/`, `**/*.spec.ts`, `vitest.config.ts`
5. `nest-cli.json` — must set `compilerOptions.tsConfigPath: "tsconfig.build.json"` so `nest build` only compiles `src/`
6. `vitest.config.ts` — with unplugin-swc for decorator support
7. `docker-compose.yml` — port `127.0.0.1:5433:5432`, healthcheck (omit for SQLite)
8. `.env.example` — empty placeholders only: `DATABASE_URL=` `PORT=3000` `CORS_ORIGINS=` `THROTTLE_TTL=60000` `THROTTLE_LIMIT=100`
9. `.gitignore` — invoke the `gitignore` skill with arg `nestjs`
10. `prisma/schema.prisma` — with `@updatedAt`, `@@index` on FKs, `@@map` on all models
11. `prisma/seed.ts` — with realistic fixture data
12. `src/main.ts`
13. `src/app.module.ts`
14. `src/prisma/prisma.module.ts` + `prisma.service.ts`
15. `src/health/health.module.ts` + `health.controller.ts`
16. `src/common/filters/http-exception.filter.ts`
17. Per entity: `schemas/`, `entities/`, `dto/`, module, service, controller, spec
18. Per entity: e2e spec + faker builder
19. `test/vitest.e2e.config.ts`
20. `scripts/export-openapi.ts` — standalone script (no server listen) that generates `openapi.yaml` via `js-yaml`; add `js-yaml` + `@types/js-yaml` to devDependencies

---

## Step 6 — Compliance Review (mandatory, runs after all files are written)

Do not declare the task done until every check below passes.

### 5.1 Automated checks

```bash
pnpm lint        # tsc --noEmit — 0 TypeScript errors
pnpm format      # biome check src/ --write — apply all auto-fixes (format + lint + imports)
biome check src/ # re-run without --write — must exit 0 (verifies no remaining issues)
pnpm test        # vitest run — 0 failures, 0 errors
pnpm build       # nest build — dist/ must contain only src/ (no test/, scripts/, vitest.config)
```

For each failure: fix the root cause in the generated code and re-run. Never skip or suppress errors.

> Always run `biome check src/` (read-only) after `pnpm format` to confirm zero remaining issues. `--write` applies safe auto-fixes only — some violations require manual correction.

### 5.2 Security checklist

- [ ] No credentials, secrets, API keys, or tokens in any file (including comments)
- [ ] `.env` is git-ignored; `.env.example` has only empty placeholders
- [ ] Body size limit (`express.json({ limit: '100kb' })`) present in `main.ts`
- [ ] Docker port bound to `127.0.0.1` only (if applicable)
- [ ] CORS methods list has no `PUT` (only GET, POST, PATCH, DELETE, OPTIONS)
- [ ] `ThrottlerGuard` registered via `APP_GUARD` in `app.module.ts` providers
- [ ] `pnpm audit --audit-level=high` → clean (any high/critical = blocker)

Scan for hardcoded URLs as a final check:

```bash
grep -r "https\?://" src --include="*.ts" | grep -v "swagger\|localhost\|@"
```

Any match that is not a Swagger annotation or localhost reference is a violation.

### 5.3 Route verification

Verify every route responds correctly (use `curl` or the Swagger UI at `/docs`):

- `GET /[entity]` → 200 array
- `GET /[entity]/:id` → 200 object / 404 not found
- `POST /[entity]` → 201 created / 422 validation error
- `PATCH /[entity]/:id` → 200 updated / 404 not found
- `DELETE /[entity]/:id` → 204 no content / 404 not found
- `GET /health` → 200 `{ status: "ok" }`

### 5.4 Code quality checklist

- [ ] No transformation logic in services — all serialization is in Entity classes
- [ ] No raw `console.log` left in production code (use `new Logger(ClassName.name)`)
- [ ] All async methods handle errors explicitly (NotFoundException, never silent swallows)
- [ ] `ParseUUIDPipe` on all `:id` params
- [ ] No unused imports or dead code
- [ ] No complex regexes (SonarQube limit: complexity ≤ 20) — replace with `Set` + lookup when matching against long lists of keywords:
  ```ts
  // ✅ — Set lookup, O(1), no regex complexity
  const SECTION_KEYWORDS = new Set(['formation', 'expérience', 'compétences', ...]);
  if (SECTION_KEYWORDS.has(line.toLowerCase())) continue;
  // ❌ — single regex with 30+ alternatives → complexity > 20
  if (/^(formation|expérience|compétences|...)$/i.test(line)) continue;
  ```

### 5.5 Final report

```
## Compliance Report

✅ pnpm lint    — 0 TypeScript errors
✅ pnpm format  — 0 Biome errors, 0 warnings
✅ pnpm test    — N tests passed, 0 failed
✅ Security     — No credentials exposed, pnpm audit clean
✅ Routes       — All N routes verified (GET, POST, PATCH, DELETE, /health)
✅ Code quality — No smells detected

### Notes
- [Any non-blocking observations or next steps]
```

---

## Step 7 — README.md (after explicit user validation)

Generate `README.md` only after the user confirms the starter kit is good. Do not create it speculatively.

Required sections:

1. Project title + one-line description
2. Tech stack table (read versions from generated `package.json`)
3. Prerequisites (Node, pnpm, Docker if applicable)
4. Quickstart:
   ```bash
   docker-compose up -d          # (skip for SQLite)
   cp .env.example .env          # fill in DATABASE_URL
   pnpm install
   pnpm prisma:migrate
   pnpm prisma:seed
   pnpm start:dev
   ```
5. Available scripts table
6. Project structure tree (top 2 levels of `src/`)
7. Architecture decisions (entity pattern, Zod source of truth, ThrottlerGuard, health check)
8. DB connection info for GUI clients (DBeaver, PGAdmin) — host, port, credentials from .env.example only with empty values

Rules: no generic filler, no duplicate of CLAUDE.md content, readable in under 2 minutes.
