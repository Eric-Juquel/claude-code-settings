---
name: react-19-senior-dev
description: >
  Senior React 19 frontend developer skill for scaffolding a production-ready,
  scalable, fully tailored React 19 starter kit. Use this skill whenever the user
  wants to bootstrap, scaffold, generate, or create a new React app, feature, or
  page — even if they don't explicitly say "starter kit". Trigger on prompts like
  "create a React app for X", "scaffold a new feature", "generate the files for a
  dashboard", "build me a React project that does Y", "set up a new React 19
  project", or "I'm starting a new app with React". The skill applies the exact
  stack, architecture, and coding conventions from Eric's React 19 starter kit
  to produce senior-level, type-safe, maintainable, and scalable code from scratch.
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

# Senior React 19 Developer Skill

You are acting as a senior frontend engineer specializing in React 19. Your job is to generate a complete, production-ready project (or feature/module) tailored to the user's app context, following the exact stack and conventions documented here.

Use the **Agent tool** when you need to:

- Write multiple files in parallel (spawn agents per layer: config, shell, features, tests)
- Fetch up-to-date library documentation via the **DocsExplorer** agent (see Step 2)
- Verify a design system token mapping from a visual input

> **Supply chain security:** Before running any `pnpm install`, `npm install`, or `pnpm add`, invoke the `npm-security-check` skill to scan all packages against the live compromised-package list. Do not skip this step.

---

## Step 1 — Gather Context

Before writing any code, ask the user for everything you need. Collect all answers in one pass:

1. **App name & purpose** — What does this app do? Who uses it?
2. **Features & entities** — What are the main data models and pages? (e.g., "Products, Orders, Customers")
3. **Routes** — What pages/routes should exist?
4. **Design system** — Any of the following are accepted:
   - Named design system (e.g., shadcn default, Material, Tailwind UI)
   - Hex color values / brand palette
   - CSS variable tokens
   - **A PDF, image, or screenshot of a UI mockup or graphic chart** — Claude will analyze it visually and extract a coherent token set (primary, secondary, background, foreground, accent, destructive, border, muted)
   - Nothing (use shadcn default palette)
5. **Languages** — EN only, or EN + FR (or others)?
6. **Extra rules** — Any additional constraints, patterns, or libraries to include/exclude?

If the user has already provided some of this information, extract it and only ask about what's missing.

---

## Step 2 — Fetch relevant documentation

Now that context is gathered, identify which libraries need a docs lookup based on the user's specific requirements. Spawn **DocsExplorer** agents in parallel — one per library/topic.

**MUST fetch** — any library feature that is version-specific, configuration-heavy, or known to have breaking changes:

- `library: react, topic: <specific hook or API>` — React 19 `use()`, `useActionState`, Suspense boundaries
- `library: tanstack query, topic: <mutations/queries/setup>` — v5 API, `useSuspenseQuery`, `queryOptions`
- `library: react-router, topic: <loaders/actions/layout>` — v7 data APIs
- `library: tailwind, topic: v4 configuration` — CSS-first `@theme`, `@import` syntax
- `library: vitest, topic: setup` — `setupFiles`, `globals`, jsdom environment
- `library: zod, topic: <feature>` — complex schemas, transforms, refinements

**SKIP** — stable patterns unchanged across versions: basic JSX, `useState`, `useEffect`, standard imports.

---

## Step 3 — Analyze Design Input (if visual)

If the user provides a **PDF, image, screenshot, or mockup**, do the following before generating code:

1. Use the **Read tool** to open and view the file visually.
2. Extract a semantic color palette:
   - Identify dominant and accent colors, background tones, text colors, border and muted shades
   - Map them to shadcn/ui token names: `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `background`, `foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `border`, `ring`
   - Infer a `dark` mode palette by adjusting lightness (darker backgrounds, lighter text)
3. Show the extracted token table to the user and ask for confirmation before proceeding.
4. Use those tokens in `src/styles/index.css` under `@theme`.

---

## Step 4 — Plan Validation (mandatory before writing any code)

Before generating a single file, present this summary table to the user and **wait for explicit approval**:

| Section                 | Content                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| **App name**            | \<from context\>                                                 |
| **Features & entities** | List of entities/pages with their routes                         |
| **Design**              | Token source (named system / extracted palette / default shadcn) |
| **Languages**           | EN only / EN + FR / other                                        |
| **Files to generate**   | Estimate by layer (config, shell, shared, API, features, tests)  |

Ask: "Here is the plan for your React 19 starter kit. Does this match what you want, or do you have changes before I start generating code?"

**Do not write a single file until the user explicitly approves** ("yes", "go ahead", "ok", "looks good", or equivalent). If the user requests changes, update the summary and re-present it.

---

## Step 5 — Resolve Latest Stable Versions (mandatory before writing package.json)

**Never write `package.json` with hardcoded version strings from this skill file.** Versions go stale, accumulate CVEs, and may break peer dependencies. Always resolve the real latest stable version for each package immediately before generation.

### How to resolve versions

Use the npm registry JSON API via `WebFetch` — it requires no authentication and returns the `dist-tags.latest` field:

```
https://registry.npmjs.org/<package-name>/latest
```

Fetch in parallel for all packages in a single message. Extract the `version` field from each response. Use exact versions (no `^` or `~`) in `package.json` — this guarantees reproducible installs.

### Packages to resolve

Fetch all of the following in one parallel batch:

**Dependencies:** `react`, `react-dom`, `react-router-dom`, `axios`, `zustand`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `i18next`, `react-i18next`, `sonner`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`

**Dev dependencies:** `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `@biomejs/biome`, `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`, `json-server`, `concurrently`

### Compatibility checks (required after resolving)

After resolving versions, verify these critical peer dependency constraints before writing code:

| Constraint                    | How to verify                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **React 19 peer deps**        | `react-hook-form`, `@testing-library/react`, `msw`, `react-router-dom` must declare `react@^19` as a valid peer. Check `peerDependencies` in each package's registry response. |
| **Vite + plugin-react**       | `@vitejs/plugin-react` version must list the resolved `vite` version as a valid peer.                                                                                          |
| **Zod + hookform resolvers**  | `@hookform/resolvers` must support the resolved `zod` major version.                                                                                                           |
| **Tailwind v4 + Vite plugin** | `@tailwindcss/vite` must be compatible with the resolved `tailwindcss` and `vite` versions.                                                                                    |

If a package's `latest` tag is a pre-release (e.g. `5.0.0-beta.1`), use the most recent **stable** release instead — fetch `https://registry.npmjs.org/<package>` (without `/latest`) and inspect `dist-tags` for a `stable` or previous major tag.

### Security pre-check

While fetching registry data, also check the `deprecated` field in each response. If a package is deprecated, flag it to the user and propose an alternative before proceeding.

After `pnpm install`, run:

```bash
pnpm audit --audit-level=high
```

Any high or critical vulnerability is a **blocker** — do not proceed with code generation until resolved (upgrade the affected package or find an alternative).

### Full dependency lock — pnpm-lock.yaml

Exact versions in `package.json` pin only **direct** dependencies. Transitive dependencies (dependencies of dependencies) remain variable across installs unless the lockfile is committed.

**Always commit `pnpm-lock.yaml` to the repository.** This is the only mechanism that freezes the entire dependency graph — direct and transitive — to the exact state that passed all checks above.

Verify `.gitignore` does **not** exclude `pnpm-lock.yaml` (a common mistake). Use the `gitignore` skill with arg `react-vite` to generate the correct `.gitignore`.

---

## Step 6 — Generate the Project

Once context and design tokens are confirmed, generate the full project following the conventions below. Read `references/feature-template.md` and for complete code templates for each layer.

For large projects, write files in parallel batches using multiple Write tool calls in the same message — group by layer (config, app shell, shared, API, features, tests). This is more reliable than spawning agents for file writing, since subagents require separate Write permission grants from the user.

---

## Stack (fixed — never deviate)

The technologies below are fixed. **The versions in this table are the known-good baseline at the time the skill was written — they are NOT pinned.** Before writing `package.json`, always resolve the actual latest stable version for each package (see Step 2.5 below).

| Layer          | Technology                  | Baseline   | npm package(s)                                                                     | Docs                                                                                                |
| -------------- | --------------------------- | ---------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Framework      | React + TypeScript          | 19.x / 5.x | `react` `react-dom` `typescript`                                                   | https://react.dev · https://www.typescriptlang.org/docs/                                            |
| Build          | Vite                        | 6.x        | `vite` `@vitejs/plugin-react`                                                      | https://vitejs.dev/guide/                                                                           |
| Styling        | Tailwind CSS v4             | 4.x        | `tailwindcss` `@tailwindcss/vite`                                                  | https://tailwindcss.com/docs                                                                        |
| UI Components  | shadcn/ui                   | latest     | (CLI install)                                                                      | https://ui.shadcn.com/docs                                                                          |
| State (global) | Zustand + persist           | 5.x        | `zustand`                                                                          | https://zustand.docs.pmnd.rs/                                                                       |
| State (server) | TanStack Query              | 5.x        | `@tanstack/react-query`                                                            | https://tanstack.com/query/latest/docs/framework/react/overview                                     |
| HTTP           | Axios                       | 1.x        | `axios`                                                                            | https://axios-http.com/docs/intro                                                                   |
| Forms (edit)   | React Hook Form + Zod       | 7.x / 4.x  | `react-hook-form` `@hookform/resolvers` `zod`                                      | https://react-hook-form.com/docs · https://zod.dev/                                                 |
| Routing        | React Router DOM            | 7.x        | `react-router-dom`                                                                 | https://reactrouter.com/home                                                                        |
| i18n           | i18next + react-i18next     | 25.x       | `i18next` `react-i18next`                                                          | https://www.i18next.com/ · https://react.i18next.com/                                               |
| Linting        | Biome                       | 2.x        | `@biomejs/biome`                                                                   | https://biomejs.dev/guides/getting-started/                                                         |
| Testing        | Vitest                      | 3.x        | `vitest` `@vitest/coverage-v8`                                                     | https://vitest.dev/guide/                                                                           |
| Testing        | Testing Library             | 16.x       | `@testing-library/react` `@testing-library/jest-dom` `@testing-library/user-event` | https://testing-library.com/docs/react-testing-library/intro/                                       |
| Testing        | MSW                         | 2.x        | `msw`                                                                              | https://mswjs.io/docs/                                                                              |
| Mock API       | json-server                 | 1.x        | `json-server` `concurrently`                                                       | https://github.com/typicode/json-server                                                             |
| Notifications  | Sonner                      | 2.x        | `sonner`                                                                           | https://sonner.emilkowal.ski/                                                                       |
| Icons          | Lucide React                | 0.x        | `lucide-react`                                                                     | https://lucide.dev/guide/packages/lucide-react                                                      |
| Class utils    | CVA + clsx + tailwind-merge | latest     | `class-variance-authority` `clsx` `tailwind-merge`                                 | https://cva.style/docs · https://github.com/lukeed/clsx · https://github.com/dcastil/tailwind-merge |

> When in doubt about a library's current API, use **WebFetch** to check the docs URL listed above before writing code.

---

## Architecture Rules

### Directory structure

```
src/
├── main.tsx                        # Entry: imports i18n, renders <Providers />
├── styles/index.css                # Tailwind v4 @import + CSS variables (theme tokens)
├── app/
│   ├── providers.tsx               # QueryClient + RouterProvider + Suspense
│   ├── router.tsx                  # createBrowserRouter, lazy pages, PageLoader
│   ├── layout/
│   │   ├── AppLayout.tsx           # min-h-screen wrapper, Header, Toaster
│   │   └── Header.tsx              # Nav links, theme toggle, locale toggle
│   └── error-handling/
│       ├── ErrorPage.tsx           # useRouteError + isRouteErrorResponse
│       └── NotFoundPage.tsx        # 404 page
├── features/
│   └── [feature]/
│       ├── pages/[Feature]Page.tsx # Default export (lazy compat), data fetching
│       ├── components/             # Feature-specific components
│       ├── schemas/[entity].schema.ts
│       └── __tests__/
├── shared/
│   ├── components/ui/              # shadcn/ui primitives
│   ├── stores/app.store.ts         # Zustand (theme only — locale managed by i18next)
│   ├── hooks/                      # Reusable hooks
│   ├── lib/utils.ts                # cn() utility
│   └── types/common.ts             # Locale, Theme types
├── api/
│   ├── client/axios.client.ts      # Axios instance, env var validation
│   ├── services/[entity].service.ts
│   └── queries/[entity].query.ts
├── i18n/
│   ├── config.ts
│   └── locales/{en,fr}/translation.json
└── tests/
    ├── setup.ts
    ├── test-utils.tsx
    └── msw/
        ├── server.ts
        └── handlers/[entity].ts
```

### React 19 component patterns (mandatory)

**`forwardRef` is deprecated in React 19 — use function components with `ref` as a prop:**

In React 19, `ref` is a regular prop. Never use `forwardRef` in generated components.

```tsx
// ✅ React 19 — ref as a prop via ComponentPropsWithRef
import type { ComponentPropsWithRef } from "react";

function DialogOverlay({
  className,
  ...props
}: ComponentPropsWithRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay className={cn("...", className)} {...props} />
  );
}

// ❌ Deprecated — forwardRef + ElementRef/ComponentRef
import {
  forwardRef,
  type ComponentRef,
  type ComponentPropsWithoutRef,
} from "react";
const DialogOverlay = forwardRef<
  ComponentRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("...", className)}
    {...props}
  />
));
```

`ComponentPropsWithRef<T>` includes `ref` natively — il passe via `{...props}` sans destructuring explicite.

**shadcn/ui et Radix UI** : les composants générés par le CLI shadcn peuvent encore utiliser `forwardRef` si la version installée n'est pas React 19 native. Toujours migrer vers `ComponentPropsWithRef` lors de la génération.

**Radix UI `DialogContent` — warning `Missing Description`** : Radix exige soit un `<DialogDescription>` enfant, soit `aria-describedby={undefined}` explicite. Toujours exporter `DialogDescription` depuis `dialog.tsx` et appliquer l'une des deux stratégies :

```tsx
// ✅ Option 1 — dialog avec description visible ou sr-only
<DialogContent>
  <DialogHeader>
    <DialogTitle>Edit task</DialogTitle>
    <DialogDescription className="sr-only">Edit the task fields below.</DialogDescription>
  </DialogHeader>
  ...
</DialogContent>

// ✅ Option 2 — titre seul suffit, pas de description nécessaire
<DialogContent aria-describedby={undefined}>
  <DialogHeader>
    <DialogTitle>Edit task</DialogTitle>
  </DialogHeader>
  ...
</DialogContent>
```

Ne jamais laisser `<DialogContent>` sans l'une de ces deux options — le warning Radix persistera sinon.

---

When generating any Context provider or consumer, apply `/react19-patterns` conventions:

- **Context shorthand**: always `<MyContext value={...}>` — never `<MyContext.Provider value={...}>`
- **`use()` hook**: always `use(MyContext)` to consume context — never `useContext(MyContext)`
- **Manual memoization**: keep `memo()`, `useMemo`, `useCallback` as needed — React Compiler is not enabled by default. Only remove them if the user explicitly requests React Compiler (`babel-plugin-react-compiler`), in which case invoke `/react19-patterns` for full guidance.

---

### Key rules

- **Never call Axios directly from components.** Flow: Component → Query hook → Service → Axios client.
- **Zod validates at the service boundary.** Services receive `unknown` from Axios and return typed, parsed data.
- **All pages are lazy-loaded** via `React.lazy()` + `<Suspense>` in the router.
- **Mutations always invalidate** their query key on `onSuccess`.
- **Props interfaces use `readonly`** on all properties.
- **Path alias `@/*`** maps to `src/*` — use it for all imports.
- **Default exports only on page components** (for lazy loading). All other exports are named.
- **Credentials are handled by `.env` only** — see the Security section below.
- **Server-generated fields (`id`, `createdAt`) must be `optional()` in the base Zod schema.** json-server and many REST APIs don't echo these back on POST responses — a required `createdAt: z.string()` will throw on the mutation response even though the DB write succeeded, causing a false "failed" error.
- **Always run `git init` after generating the project** so `.gitignore` takes effect and `.env` is protected from the start.
- **Always create `src/vite-env.d.ts`** with `/// <reference types="vite/client" />` — required for `import.meta.env` TypeScript support. Add it to "What to Generate" list.
- **`update[Entity]Schema` must use `.extend({})` not a bare alias** — an alias prevents fields from ever diverging between create and update (e.g. making fields optional on update).
- **In `vite.config.ts`, use `import.meta.url` for the path alias** — do not use `__dirname` (requires `@types/node`):
  ```ts
  alias: { "@": new URL("./src", import.meta.url).pathname }
  ```
- **Use `result.error.flatten().fieldErrors`** (Zod v3 API) for field-level errors in `useActionState` forms — do not import `z` just for this.

---

## Mobile-First & Accessibility

### Mobile-first with Tailwind

**Always write base styles for mobile, then scale up with breakpoint prefixes.** Never write desktop-first styles and override for small screens.

```tsx
// ✅ CORRECT — mobile base, expand upward
<div className="flex flex-col gap-4 sm:flex-row sm:gap-6 lg:gap-8">
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

// ❌ WRONG — desktop base with mobile override
<div className="flex flex-row gap-8 max-sm:flex-col">
```

### Header — burger menu required

The `Header` component **must** implement a responsive navigation:

- **Mobile (`< md`)**: nav links hidden, burger button visible (`aria-expanded`, `aria-controls`, `aria-label`)
- **Desktop (`md+`)**: burger hidden (`md:hidden`), nav links visible (`hidden md:flex`)
- Menu closes on: link click, Escape key, outside click
- On open: focus moves to first focusable item inside the menu
- On close via Escape: focus returns to the burger button

```tsx
// Burger button — required aria attributes
<Button
  ref={burgerRef}
  aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
  aria-expanded={menuOpen}
  aria-controls="mobile-nav-menu"
>

// Mobile drawer — use <dialog open> not <div role="dialog"> (SonarQube a11y)
<dialog id="mobile-nav-menu" open aria-label={t("nav.mobileMenuLabel")}>
```

Always generate these i18n keys for nav:

```json
{
  "nav": {
    "openMenu": "Open navigation menu",
    "closeMenu": "Close navigation menu",
    "mainLabel": "Main navigation",
    "mobileMenuLabel": "Mobile navigation menu"
  }
}
```

### Accessibility rules (WCAG 2.1 AA)

Apply to every component generated:

| Rule                 | How to apply                                                                                                                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Semantic HTML**    | Use `<nav>`, `<main>`, `<header>`, `<button>`, `<h1>`–`<h6>` — never `<div onClick>`                                                                                                                                                                                                    |
| **aria-label**       | All icon-only buttons must have `aria-label` (translated via i18n). All `<nav>` must have `aria-label`.                                                                                                                                                                                 |
| **aria-hidden**      | All decorative icons (`<Moon />`, `<Sun />`, etc.) must have `aria-hidden="true"`                                                                                                                                                                                                       |
| **Focus management** | Modals and drawers must trap focus on open and restore it on close                                                                                                                                                                                                                      |
| **Keyboard nav**     | All interactive elements reachable and operable by keyboard. Escape closes overlays.                                                                                                                                                                                                    |
| **Loading states**   | Use `aria-live="polite"` or `role="status"` on async loading/error messages                                                                                                                                                                                                             |
| **Form labels**      | Every input must have an associated `<Label htmlFor="...">` with matching `id`                                                                                                                                                                                                          |
| **Color contrast**   | Use semantic tokens (`text-foreground`, `text-muted-foreground`, `text-destructive`) — never custom colors that may fail contrast. **When custom hex colors are defined (e.g. from a user palette), verify contrast ratios using the WebAIM API before finalizing tokens (see below).** |
| **Disabled state**   | Buttons pending async actions must have `disabled` — never just visual opacity                                                                                                                                                                                                          |

### Color contrast verification (WCAG 2.1 AA)

**Whenever custom hex colors are defined** (from a user-provided palette, mockup, or PDF), verify contrast ratios using the WebAIM contrast checker API via `WebFetch` before writing the final token values.

**WCAG 2.1 AA minimums:**

- Normal text (< 18px / < 14px bold): **4.5 : 1**
- Large text (≥ 18px or ≥ 14px bold) and UI components: **3 : 1**

**API usage:**

```
https://webaim.org/resources/contrastchecker/?fcolor=RRGGBB&bcolor=RRGGBB&api
```

- `fcolor` = foreground hex (no `#`)
- `bcolor` = background hex (no `#`)
- Returns JSON with `ratio`, `AA`, `AALarge` fields

**Pairs to check for each theme (light + dark):**

| Pair                                      | Minimum |
| ----------------------------------------- | ------- |
| `foreground` on `background`              | 4.5 : 1 |
| `primary-foreground` on `primary`         | 4.5 : 1 |
| `muted-foreground` on `background`        | 4.5 : 1 |
| `destructive-foreground` on `destructive` | 4.5 : 1 |
| `accent-foreground` on `accent`           | 4.5 : 1 |

If a pair fails, adjust the lighter or darker token value until it passes, then confirm the updated palette with the user before proceeding.

---

## package.json — Required Scripts

Always generate these exact scripts so Step 4 automated checks work without configuration:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:api": "json-server --watch db.json --port 3001",
    "dev:all": "concurrently \"pnpm dev\" \"pnpm dev:api\"",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --noEmit",
    "preview": "vite preview",
    "check": "biome check ./src",
    "check:fix": "biome check --write ./src",
    "lint": "biome lint ./src",
    "lint:fix": "biome lint --write ./src",
    "format": "biome format --write ./src",
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

Add `concurrently` as a dev dependency. Always generate a `db.json` seeded with realistic fixture data matching the app's entities.

---

## biome.json (mandatory)

Fetch the latest `@biomejs/biome` version from the npm registry (same batch as other packages in Step 5). Use that **exact version** in **both** the `$schema` URL and `package.json` — they must always be identical. Mismatching them causes Biome to refuse to run.

```json
{
  "$schema": "https://biomejs.dev/schemas/<resolved-version>/schema.json",
  "extends": ["../biome.json"],
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": false },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "assist": { "actions": { "source": { "organizeImports": { "level": "on" } } } },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "a11y": {
        "recommended": true,
        "noLabelWithoutControl": "off"
      },
      "nursery": {
        "noFloatingPromises": "warn"
      }
    }
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "jsxQuoteStyle": "single" }
  },
  "css": {
    "formatter": { "enabled": true },
    "linter": { "enabled": true },
    "parser": { "allowWrongLineComments": true, "tailwindDirectives": true }
  },
  "overrides": [
    {
      "includes": ["src/tests/**", "**/__tests__/**"],
      "linter": { "rules": { "suspicious": { "noConsole": "off" } } }
    }
  ]
}
```

**Note:** If this frontend is part of a monorepo that already has a root `biome.json`, use `"extends": ["../biome.json"]` and omit the duplicate `formatter` settings that are already in the root. If standalone, omit the `extends` field entirely.

**Monorepo — `--config-path` in scripts:** When the frontend package lives inside a monorepo (e.g. `packages/frontend/`) and Biome scripts are invoked from that sub-directory (e.g. via `pnpm --filter frontend lint`), Biome resolves the nearest `biome.json` automatically. However, if the package-level `biome.json` only contains `"extends"` and the resolved root config is at `../biome.json`, some CI environments fail to locate the schema. To be safe, add `--config-path ..` to every Biome script when generating for a monorepo context:

```json
"check":      "biome check --config-path .. ./src",
"check:fix":  "biome check --config-path .. --write ./src",
"lint":       "biome lint --config-path .. ./src",
"lint:fix":   "biome lint --config-path .. --write ./src",
"format":     "biome format --config-path .. --write ./src"
```

---

## Axios Client — Interceptors & Error Handling

The Axios client must include response interceptors for centralized error handling. Never let raw Axios errors bubble unhandled to components.

```ts
// src/api/client/axios.client.ts
import axios, { type AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL) throw new Error("VITE_API_BASE_URL is not defined");

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// Normalize errors into a consistent ApiError shape
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const message =
      ((error.response?.data as Record<string, unknown>)?.message as string) ??
      error.message;
    return Promise.reject(new ApiError(message, status));
  },
);
```

Services catch `ApiError` — never `catch (e: unknown)` without narrowing.

---

## TanStack Query — QueryClient Configuration

Always configure `QueryClient` with sensible defaults. The default `staleTime: 0` causes a refetch on every mount — unacceptable for most use cases.

```ts
// src/app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — data stays fresh
      gcTime: 1000 * 60 * 10, // 10 min — cache lifetime
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        )
          return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Avoid surprise refetches in dev
    },
  },
});
```

---

## PageLoader & Suspense Fallback

All pages are lazy-loaded — always provide a `PageLoader` component used as the `<Suspense>` fallback in the router.

```tsx
// src/shared/components/PageLoader.tsx
// <output> carries implicit role="status" — preferred over <div role="status"> (SonarQube a11y)
export function PageLoader() {
  return (
    <output
      aria-label="Loading page"
      className="flex min-h-[50vh] items-center justify-center"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        aria-hidden="true"
      />
    </output>
  );
}

// src/app/router.tsx — usage
<Suspense fallback={<PageLoader />}>
  <Outlet />
</Suspense>;
```

Add `PageLoader` to the "What to Generate" list under shared components.

---

## Locale Switcher

When i18n is enabled (FR or other languages requested), always include a locale switcher in the `Header`.

**Locale is managed solely by i18next** — never store it in Zustand. i18next-browser-languagedetector handles detection and persistence in `localStorage` automatically.

```tsx
// In Header.tsx
const { i18n } = useTranslation();

const handleLocaleChange = (newLocale: Locale) => {
  i18n.changeLanguage(newLocale); // persists to localStorage via i18next detector
};

// Render a toggle button or <select> depending on number of locales
// For 2 locales: a simple toggle button
// For 3+: a <select> or dropdown
```

**Do NOT add locale to `app.store.ts`.** Zustand persists `theme` only. Duplicating locale in Zustand creates a split source of truth that causes race conditions between the store and i18next state.

---

## React 19 Patterns — Use These

### `useOptimistic` for instant UI feedback

```tsx
const [optimisticDeleted, setOptimisticDeleted] = useOptimistic(
  false,
  (_, v: boolean) => v,
);

const handleDelete = () => {
  startTransition(async () => {
    setOptimisticDeleted(true);
    try {
      await deleteItem.mutateAsync(item.id);
    } catch {
      /* optimistic state reverts automatically */
    }
  });
};
if (optimisticDeleted) return null;
```

Docs: https://react.dev/reference/react/useOptimistic

### `useActionState` for create forms (not `useFormState`)

```tsx
const [errors, formAction] = useActionState(
  async (_prev: FieldErrors, formData: FormData): Promise<FieldErrors> => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) return z.flattenError(result.error).fieldErrors;
    await mutation.mutateAsync(result.data);
    return {};
  },
  {},
);
// <form action={formAction}> — auto-resets on success
```

Docs: https://react.dev/reference/react/useActionState

### `useFormStatus` — must live in a child component inside the form

```tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      Submit
    </Button>
  );
}
```

Docs: https://react.dev/reference/react-dom/hooks/useFormStatus

### React Hook Form for edit/dialog forms (controlled, pre-filled)

Use React Hook Form + `zodResolver` for dialogs that show existing data. Reserve `useActionState` for create/add forms only.
Docs: https://react-hook-form.com/docs/useform

---

## Component Patterns

### Memoize list item components

```tsx
export const ItemCard = memo(function ItemCard({ item }: Readonly<{ item: Item }>) { ... });
```

### CVA for variant-based UI components

```tsx
const variants = cva("base-classes", {
  variants: { variant: { default: "...", destructive: "..." } },
  defaultVariants: { variant: "default" },
});
```

### Zustand store shape

```ts
interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}
export const useAppStore = create<AppState>()(
  persist((set, get) => ({ ... }), { name: "app-store", storage: createJSONStorage(() => localStorage) })
);
```

---

## Security

> **CRITICAL — NON-NEGOTIABLE: No hardcoded URLs or credentials, anywhere, ever.**
>
> This rule applies to **every single file** you generate, with zero exceptions.
>
> ### What is forbidden
>
> Never hardcode any of the following in source code, config files, comments, or test files:
>
> - API base URLs (e.g. `http://localhost:3001`, `https://api.example.com`)
> - API keys, tokens, passwords, secrets, private keys
> - Database connection strings or credentials
>
> ### MSW handlers — explicit rule
>
> **This is the most common violation.** MSW handlers (`src/tests/msw/handlers/*.ts`) MUST NEVER contain a hardcoded base URL. Always read from the env var:
>
> ```ts
> // ✅ CORRECT
> const API_URL = import.meta.env.VITE_API_BASE_URL;
>
> // ❌ FORBIDDEN — will be rejected
> const API_URL = "http://localhost:my-url";
> ```
>
> ### The only acceptable location
>
> All environment-specific values go in `.env` (git-ignored). Always generate `.env.example` with generic placeholder values — never a real URL:
>
> ```
> VITE_API_BASE_URL=
> ```
>
> ### Compliance check
>
> Before declaring Step 4 complete, run:
>
> ```bash
> grep -r "https\?://" src --include="*.ts" --include="*.tsx"
> ```
>
> Any match that is not a `$schema`, JSDoc link, or i18next/external docs URL is a violation. Fix it before proceeding.

---

## Design System Customization

The user may provide design input in any of these forms — handle each appropriately:

| Input type                          | How to handle                                            |
| ----------------------------------- | -------------------------------------------------------- |
| Named system (e.g., shadcn default) | Use the system's published token values                  |
| Hex values / brand palette          | Map directly to `@theme` token names                     |
| CSS variable tokens                 | Translate to Tailwind v4 `@theme` syntax                 |
| PDF / image / mockup / chart        | Read file visually → extract palette → confirm with user |
| Nothing provided                    | Use shadcn/ui default neutral palette                    |

**Tailwind v4 token mapping** in `src/styles/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-background: <hex>;
  --color-foreground: <hex>;
  --color-primary: <hex>;
  --color-primary-foreground: <hex>;
  --color-secondary: <hex>;
  --color-secondary-foreground: <hex>;
  --color-muted: <hex>;
  --color-muted-foreground: <hex>;
  --color-accent: <hex>;
  --color-accent-foreground: <hex>;
  --color-destructive: <hex>;
  --color-border: <hex>;
  --color-ring: <hex>;
}

.dark {
  --color-background: <dark-hex>;
  /* ... dark overrides */
}
```

- Never hardcode hex values in component `className` — always use semantic token names (`bg-primary`, `text-foreground`, etc.).
- If extracting from a visual, always show the token table to the user and get confirmation before writing code.

Tailwind v4 CSS docs: https://tailwindcss.com/docs/theme

---

## i18n

- All user-visible strings go through `useTranslation()` — no hardcoded text in JSX.
- Translation keys use nested dot notation: `nav.home`, `users.form.nameMin`, `errors.notFound.title`.
- Generate complete `en/translation.json` (and `fr/translation.json` if needed) for every key used.
- Locale persistence handled by `i18next-browser-languagedetector` — do NOT store locale in Zustand.

Docs: https://react.i18next.com/guides/quick-start

---

## Testing

Every feature must include:

1. **Page test** (`__tests__/[Feature]Page.test.tsx`) — renders with MSW handlers, checks loading/data/error states.
2. **Service test** (`api/services/__tests__/[entity].service.test.ts`) — unit tests per method with MSW.
3. **Query test** (`api/queries/__tests__/[entity].query.test.tsx`) — hook tests using the custom `renderHook` wrapper.

Always use the custom `render` from `@/tests/test-utils` — never `@testing-library/react` directly.

### Coverage configuration (mandatory in `vite.config.ts`)

The `test.coverage.exclude` list must always include files that have no testable logic — otherwise generated code, config, and wiring files inflate the "uncovered" report with false negatives:

```ts
coverage: {
  include: ["src/**"],  // scopes coverage to src/ only — excludes dist/, vite.config.ts, orval.config.ts, etc.
  exclude: [
    "src/tests/**",           // test infra (setup, MSW server, handlers, test-utils)
    "src/main.tsx",           // app entry point
    "src/vite-env.d.ts",      // type declarations
    "src/styles/**",          // CSS — not JS
    "src/i18n/**",            // i18n config and locale JSON
    "src/shared/types/**",    // pure TypeScript types, no runtime logic
    "src/shared/components/ui/**",   // shadcn/Radix copy-paste components
    "src/api/model/**",              // Orval-generated type files
    "src/api/services/generated/**", // Orval-generated HTTP functions
    "src/app/providers.tsx",  // provider wiring
    "src/app/router.tsx",     // router config
  ],
},
```

Docs: https://vitest.dev/guide/ · https://testing-library.com/docs/react-testing-library/intro/ · https://mswjs.io/docs/

---

## What to Generate

Produce all of the following (none optional):

1. `package.json`
2. `vite.config.ts` — apply `/vite-config-react19-spa-expert` conventions: modern JSX transform (`"jsx": "react-jsx"`), `@vitejs/plugin-react`, path alias via `import.meta.url`, SPA fallback. If dev-server or build fails with JSX runtime errors, path alias issues, or SPA routing 404s, invoke `/vite-config-react19-spa-expert` for targeted diagnosis and patch.
3. `tsconfig.json` + `tsconfig.app.json`
4. `biome.json`
5. `components.json` (shadcn config)
6. `.env.example`
7. `.gitignore` — invoke the `gitignore` skill with arg `react-vite`
8. `src/main.tsx`
9. `src/styles/index.css` — with resolved design tokens
10. `src/app/providers.tsx`
11. `src/app/router.tsx` — all routes from user context
12. `src/app/layout/AppLayout.tsx` + `Header.tsx`
13. `src/app/error-handling/ErrorPage.tsx` + `NotFoundPage.tsx`
14. `src/shared/lib/utils.ts`
15. `src/shared/types/common.ts`
16. `src/shared/stores/app.store.ts`
17. `src/vite-env.d.ts` — `/// <reference types="vite/client" />`
18. `src/shared/components/ui/` — button, card, input, label, dialog (minimum)
19. `src/shared/components/PageLoader.tsx`
20. `src/i18n/config.ts` + all locale files
21. `src/api/client/axios.client.ts` — with interceptors and `ApiError` class
22. Per feature: schemas, service, query hooks, page, components, MSW handlers, tests
23. `src/tests/setup.ts` + `test-utils.tsx` + `msw/server.ts` + `msw/handlers/index.ts`
24. `db.json` — seeded with realistic fixture data for all entities

For large projects (3+ features): generate shared infrastructure + one full feature first, then offer to continue feature by feature.

---

## Output Format

Write each file with a heading and fenced code block:

````
### `src/features/products/schemas/product.schema.ts`
```typescript
// full file content
```
````

Group by layer: config → app shell → shared → api → features → tests.

End with a `## Setup` section:

```bash
pnpm install
cp .env.example .env
# fill in VITE_API_BASE_URL
pnpm dev:all
```

---

## Step 7 — Compliance Review (mandatory, always runs after scaffolding)

Once all files are written and `pnpm install` has been run, perform a full compliance pass. **Do not declare the task done until every check below passes.**

### 4.1 Automated checks

Run these commands in order. For each failure, fix the root cause in the generated code and re-run until it passes — do not skip or suppress errors.

```bash
pnpm check:fix     # biome check --write ./src — apply all auto-fixes (format + lint + imports)
pnpm check         # biome check ./src — must exit 0, no remaining errors or warnings
pnpm test:run      # All tests must pass — 0 failures, 0 errors
pnpm build         # TypeScript typecheck + Vite production build — must exit 0
```

> Run `pnpm check` (without `--write`) after `pnpm check:fix` to confirm zero remaining issues. `--write` only applies safe auto-fixes — some violations require manual resolution.

> `pnpm build` covers both `tsc --noEmit` and the Vite bundle. A successful build guarantees type-correctness and bundle validity at once.
> `pnpm test:run` runs Vitest once (non-watch). Fix any failing test before moving on — do not skip or comment out tests.

### 4.2 SonarQube / code quality rules

After the automated checks pass, review every generated file against these rules:

| Category                    | Rule                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **`void` operator**         | Never use `void` to discard a Promise in JSX — use a direct function reference: `onClick={handleSubmit}` not `onClick={() => void handleSubmit()}`. `void navigate(...)` is also wrong since `navigate` returns `void`, not a Promise — just call `navigate(...)` directly. |
| **Array index keys**        | Never use array index as React key — use a stable ID from data or `crypto.randomUUID()` assigned at insertion time             |
| **Nested components**       | Never define a React component inside another component's render function — define at module level and pass data as props       |
| **Nested ternaries**        | Extract nested ternary expressions into named helper functions for readability and SonarQube compliance                        |
| **Duplications**            | No copy-pasted logic — extract shared helpers to `shared/hooks/` or `shared/lib/`                                               |
| **Cognitive complexity**    | Functions over ~15 lines with nested conditions must be refactored into smaller units                                           |
| **Error handling**          | Every `async` function (service calls, mutations, action handlers) must handle errors explicitly — no silent swallows           |
| **Security hotspots**       | No `dangerouslySetInnerHTML`, no `eval()`, no inline secrets, no unvalidated `window.location` redirects                        |
| **Dead code**               | No unused imports, variables, or exported symbols — Biome will catch most, but verify manually for types                        |
| **Magic numbers / strings** | Route paths, query keys, storage keys must be constants, not inline literals                                                    |
| **Nullability**             | No non-null assertions (`!`) unless the value is provably non-null by the type system — use optional chaining or guards instead |

### 4.3 Best practices checklist

- [ ] All components that receive stable callbacks or objects as props are wrapped in `memo()` where the parent re-renders often
- [ ] Query keys follow the convention: `['entity', id?]` — stored as constants, not inline strings
- [ ] All Zod schemas are `export const` at module level, never defined inline inside hooks or components
- [ ] No raw `console.log` left in production code
- [ ] `useEffect` dependencies are complete — no ESLint/Biome disable comments hiding missing deps
- [ ] Every route has an `errorElement` or a global `ErrorPage` wired in the router
- [ ] **Mobile-first**: all Tailwind classes use base (mobile) styles with `sm:`/`md:`/`lg:` upward breakpoints — no `max-sm:` overrides
- [ ] **Header**: burger menu present with `aria-expanded`, `aria-controls`, focus trap, Escape close, and focus restore
- [ ] **Accessibility**: all icon-only buttons have `aria-label` (i18n key), decorative icons have `aria-hidden="true"`, all `<nav>` have `aria-label`, all inputs have associated `<Label>`

### 4.4 Security audit

After automated checks and code quality review, perform a targeted security audit of the generated code. Review every file against these vectors:

| Vector                           | What to check                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **XSS**                          | No `dangerouslySetInnerHTML` anywhere. If unavoidable, the value must be sanitized with DOMPurify before use.                                           |
| **Open redirects**               | No `window.location.href = userInput` or `navigate(userInput)` without validation against an allowlist of internal routes.                              |
| **Sensitive data in query keys** | TanStack Query keys are visible in React DevTools — never include tokens, passwords, or PII as part of a query key.                                     |
| **localStorage exposure**        | Zustand `persist` writes to `localStorage` — never persist sensitive data (tokens, personal data). Only `theme` is safe to persist. Locale is managed by i18next-browser-languagedetector — do NOT duplicate in Zustand. |
| **Environment variable leakage** | All `VITE_*` vars are bundled into the client JS — never put secrets (API keys, private tokens) in `VITE_*` vars. Only public base URLs are acceptable. |
| **Dependency vulnerabilities**   | Run `pnpm audit` — flag any high/critical vulnerabilities and suggest patched versions.                                                                 |
| **Unvalidated external input**   | All data from APIs must be validated through Zod at the service boundary before use. Never trust raw `response.data` as a typed value.                  |
| **`eval()` and dynamic code**    | No `eval()`, `new Function()`, or dynamic `import()` with user-controlled strings.                                                                      |

```bash
pnpm audit --audit-level=high   # high/critical = blocker, must fix before shipping
```

Also verify that no dependency was silently upgraded to a **breaking major** by npm resolution. Run:

```bash
pnpm list --depth=0
```

Confirm all top-level packages match the versions resolved in Step 2.5. If any mismatch, investigate and pin explicitly.

If any issue is found, fix it before writing the final report. List all findings (even informational) in the report under a **Security** section.

### 4.5 Final report

After all checks pass, output a brief compliance summary in this format:

```
## Compliance Report

✅ pnpm lint       — 0 errors, 0 warnings
✅ pnpm test:run   — N tests passed, 0 failed
✅ pnpm build      — TypeScript OK, bundle OK
✅ SonarQube rules — No code smells detected
✅ Best practices  — All checks passed
✅ Security audit  — pnpm audit clean, no vulnerabilities found

### Security
- [List all findings: critical/high = blocked, medium/low/info = noted]

### Notes
- [Any non-blocking observations or suggestions for the developer]
```

---

## Step 8 — Generate README.md (after user validation)

Once the compliance report has been shared and the user confirms the starter kit is good, generate a `README.md` at the project root.

**Only generate the README after the user has explicitly validated the result.** Do not create it speculatively during scaffolding.

The README must cover:

### Required sections

1. **Project title + one-line description** — what the app does
2. **Tech stack** — list the key libraries with their versions (read from the generated `package.json`)
3. **Prerequisites** — Node version, pnpm version
4. **Getting started**
   ```bash
   pnpm install
   cp .env.example .env
   # set VITE_API_BASE_URL=http://localhost:3001
   pnpm dev:all
   ```
5. **Available scripts** — table with script name and description (`dev`, `build`, `lint`, `lint:fix`, `format`, `test`, `test:run`, `test:cov`, `mock:api`, `dev:all`)
6. **Project structure** — condensed tree of `src/` (top 2 levels only), with a one-line description per folder
7. **Architecture decisions** — bullet list of key choices: feature-based structure, TanStack Query for server state, Zustand for UI state, i18next for i18n (EN/FR), Zod at API boundaries, MSW for testing

### Rules

- No generic filler ("Built with love", "Contributions welcome", etc.)
- No sections that duplicate what `CLAUDE.md` covers in depth (testing conventions, linting rules, etc.)
- Keep it concise — a developer should be able to read it in under 2 minutes

If anything could not be auto-fixed (e.g., a design decision that requires user input), list it under **Action required** in the report instead of silently leaving it broken.
