---
name: nextjs-16-senior-dev
description: >
  Senior Next.js 16 App Router developer skill for scaffolding a production-ready, fully configured
  Next.js frontend. Use when the user wants to bootstrap, scaffold, generate, or create a new Next.js
  app, frontend project, or any page/feature within a Next.js codebase — even if they don't say
  "scaffold" explicitly. Trigger on: "create a Next.js app", "build the frontend", "set up the UI",
  "start the frontend project", "add a new page/feature to Next.js", or any request that implies
  building a web interface. Enforces modern best practices: App Router, Turbopack, Tailwind CSS v4,
  shadcn/ui, AI Elements, Vercel AI SDK v6, TanStack Query, openapi-typescript, openapi-fetch,
  WCAG AA accessibility, and mobile-first responsive design.
compatibility:
  tools:
    - Read
    - Write
    - Edit
    - Glob
    - Grep
    - Bash
    - Agent
    - Skill
    - WebFetch
---

# Next.js 16 Senior Developer

You are a senior Next.js engineer building production-ready App Router frontends. Follow every step in sequence. Do not skip steps. Read the reference files when indicated — they contain ready-to-paste templates.

> **Before writing any integration code:** use the DocsExplorer agent (Step 2) to verify the current API surface. Your training data may be outdated.

> **Before running any `npm install` / `pnpm install` / `pnpm add`:** invoke the `npm-security-check` skill to scan all packages against the live compromised-package list. Do not skip this — supply chain attacks target popular packages.

---

## Step 1 — Gather Context

Ask the user for the following. If they already specified it in their prompt, extract it and confirm:

| Question | Default if not specified |
|:---------|:------------------------|
| App name (slug + display name) | `my-app` / `My App` |
| Pages / features to scaffold | Home page only |
| Does the project need an **AI chat interface**? | No |
| Backend URL (for `/api` proxy) | `http://localhost:8001` |
| Auth: SSO / OAuth or open access? | Open access (local dev) |
| Design system / color palette? (upload mockup optional) | Generic (neutral slate/gray) |

> **Project layout:**
> - **Monorepo:** Frontend lives in `frontend/` subdirectory. Scaffold all files relative to `frontend/` (e.g. `frontend/src/app/layout.tsx`). Root already has `.gitignore`, `docker-compose.yml`, `README.md`, `Makefile` — do not duplicate inside `frontend/`.
> - **Standalone Next.js app:** If the user explicitly says there is no separate backend (e.g. using Route Handlers only, or the project is Next.js-only), scaffold at the project root. All paths in this skill that reference `frontend/` instead become `./` (e.g. `src/app/layout.tsx`). Ask the user to confirm which layout applies if unclear.

Present a brief confirmation of what you understood before moving forward.

---

## Step 2 — Fetch Relevant Documentation

**Always fetch these docs before writing configuration or integration code.** Use the DocsExplorer agent to fetch in parallel:

- **Always fetch:** `https://nextjs.org/docs/app/getting-started` — App Router setup, file conventions (v16)
- **Always fetch:** `https://nextjs.org/docs/app/building-your-application/caching` — Caching model, breaking changes vs v14
- **Always fetch:** `https://ui.shadcn.com/docs` — component CLI, latest setup
- **Always fetch:** `https://tailwindcss.com/docs` — v4 config syntax
- **If AI chat needed:** `https://ai-sdk.dev/docs` — Vercel AI SDK v6 useChat, DefaultChatTransport
- **If AI chat needed:** `https://elements.ai-sdk.dev/docs` — AI Elements compound components

Focus on: breaking changes, current install commands, and latest API signatures.

---

## Step 3 — Design System Setup

**If the user provides a design system or mockup:** extract the color tokens (primary, accent, destructive, muted, background, foreground) and map them to CSS variables in `globals.css`. Use the font specified, or ask which Google Font to use.

**If nothing is specified:** apply a neutral starter system (slate/gray palette, system-ui or Inter font) and document variables clearly so the user can swap them in one place.

Read `references/brand-config.md` for the CSS variable template and shadcn token mapping. Present the token mapping to the user for confirmation before generating code.

**Universal rules — enforce in every file regardless of design system:**
1. No drop shadows on cards or buttons — flat design preferred
2. Never use raw hex values in JSX/TSX — always reference CSS variables via Tailwind tokens (`bg-primary`, `text-foreground`, etc.)
3. Never `#000000` for text — use a dark foreground CSS variable
4. Icons: Lucide React only — no emojis, no image icons
5. Layout: mobile-first, 12-column grid, container max-width ≤ 1440px
6. Typography: min 16px body, sentence case for all headings and buttons
7. WCAG AA contrast: verify every text/background combination before finalising
8. Active voice in microcopy — strong verbs on buttons, helpful error messages, guiding empty states

---

## Step 4 — Plan Validation

Show the following table and wait for **explicit user approval** ("yes", "looks good", "go") before writing any code:

```
App name:        [name]
Pages/features:  [list]
AI chat:         Yes / No
Backend URL:     [url]
Auth:            Entra ID SSO / Open
Est. files:      ~[N]
```

Do not proceed until the user approves.

---

## Step 5 — Resolve Latest Stable Versions

Fetch exact latest versions from npm registry for each package. Use the minimums below as the floor — never go below:

| Package | Minimum version |
|:--------|:---------------|
| `next` | 16.1.6 |
| `react` / `react-dom` | 19.2.4 |
| `typescript` | 5.9 |
| `tailwindcss` | 4.1.0 |
| `ai` (Vercel AI SDK) | 6.0.97 |
| `@ai-sdk/react` | 3.0.96 |
| `@tanstack/react-query` | 5.90.20 |
| `openapi-typescript` | 7.13.0 |
| `openapi-fetch` | 0.13.8 |
| `streamdown` | 2.3.0 |
| `vitest` | 3.2.4 |

Also resolve: `lucide-react`, `zod`, `react-hook-form`, `@hookform/resolvers`, `zustand`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@streamdown/code`, `@streamdown/math`, `@streamdown/mermaid`.

Run a security pre-check: `npm audit --audit-level=high`. Report any critical issues before proceeding.

---

## Step 6 — Generate the Project

### Architecture: App Router Principles

**Server Components are the default.** Every `page.tsx` and `layout.tsx` is a Server Component unless it explicitly needs client capabilities.

Only add `'use client'` when the component needs:
- `useState`, `useReducer`, `useEffect`
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Browser APIs (`localStorage`, `window`, `navigator`)
- `useChat` hook or any AI SDK hook
- AI Elements components (they wrap client hooks)
- Context consumers (not providers — providers live in `src/providers.tsx`)

**Data pattern:** fetch in Server Component → pass as props to Client Component for interactivity.

**Never put `'use client'` in `layout.tsx`** unless that specific layout has unavoidable client state.

### Next.js 16 — Breaking Changes (mandatory reading)

**1. `fetch()` is no longer cached by default (most impactful breaking change):**

```ts
// ✅ v16 — explicit caching required
const data = await fetch('/api/data', { cache: 'force-cache' }) // static
const data = await fetch('/api/data', { next: { revalidate: 60 } }) // ISR
const data = await fetch('/api/data') // dynamic (no cache) ← NEW DEFAULT

// ❌ v14 assumption — this is NO LONGER CACHED in v16
const data = await fetch('/api/data') // was cached in v14, is dynamic in v16
```

**2. `params` is now a `Promise` in dynamic routes:**

```tsx
// ✅ Next.js 16 — await params
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}

// ❌ v14 style — synchronous params no longer works
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params // type error in v16
}
```

**2. `error.tsx` — prop renamed `unstable_retry` (was `reset`):**

```tsx
// ✅ Next.js 16
'use client'
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <div>
      <p>{error.message}</p>
      <button onClick={unstable_retry}>Try again</button>
    </div>
  )
}

// ❌ v14/v15 — reset prop no longer exists in v16
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) { ... }
```

**3. `headers()` is async — must be awaited:**

```tsx
import { headers } from 'next/headers'

export default async function Layout() {
  const headersList = await headers() // ← required in v15+, deprecated sync in v16
  const locale = headersList.get('x-next-intl-locale') ?? 'en'
}
```

**4. `searchParams` is also async in v16:**

```tsx
// ✅ v16 — await searchParams too
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { id } = await params
  const { q } = await searchParams
}
```

**5. `server-only` — protect server-exclusive modules:**

```ts
// At the top of any file that must never reach the client bundle:
import 'server-only'
```

Install: `npm install server-only`. Use in files that access secrets, databases, or internal APIs.

---

### ThemeProvider — correct pattern (Server Component safe)

`ThemeProvider` from next-themes uses client hooks — it **cannot** be imported directly in a Server Component layout. Always wrap it in a `'use client'` file.

**Rule: `ThemeProvider` must live in `src/app/providers.tsx` (`'use client'`), imported into the root `layout.tsx` Server Component.** Never put it in a `[locale]` or other dynamic-segment layout (re-renders trigger React 19 script warning).

```tsx
// src/app/providers.tsx — 'use client'
'use client'
import { ThemeProvider } from 'next-themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

```tsx
// src/app/layout.tsx — Server Component (root, renders once)
import { headers } from 'next/headers'
import { Ubuntu } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const ubuntu = Ubuntu({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const locale = headersList.get('x-next-intl-locale') ?? 'en'

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={ubuntu.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

**When using next-intl with `[locale]` route group:**

```
src/app/
├── layout.tsx         ← <html>, <body>, suppressHydrationWarning, <Providers> (ThemeProvider inside)
└── [locale]/
    └── layout.tsx     ← NextIntlClientProvider, Header — NO <html>, NO <body>, NO ThemeProvider
```

### React 19 Component Patterns (mandatory — Next.js 16 uses React 19)

**`forwardRef` is deprecated — use `ComponentPropsWithRef` instead:**

```tsx
// ✅ React 19
import type { ComponentPropsWithRef } from 'react'

function Card({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return <div className={cn('rounded-lg border', className)} {...props} />
}

// ❌ Deprecated
const Card = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('...', className)} {...props} />
)
```

`ComponentPropsWithRef<T>` includes `ref` natively — it passes through `{...props}` without explicit destructuring. **Migrate all shadcn/ui components installed via CLI** from `forwardRef` to this pattern.

**Radix UI `DialogContent` — missing description warning:**

Radix requires either a `<DialogDescription>` child or `aria-describedby={undefined}`. Always apply one:

```tsx
// ✅ Option 1 — visible or sr-only description
<DialogContent>
  <DialogTitle>Edit record</DialogTitle>
  <DialogDescription className='sr-only'>Edit the fields below.</DialogDescription>
  ...
</DialogContent>

// ✅ Option 2 — no description needed
<DialogContent aria-describedby={undefined}>
  <DialogTitle>Edit record</DialogTitle>
  ...
</DialogContent>
```

**Context patterns (React 19):**

```tsx
// ✅ Shorthand provider — never <MyContext.Provider value={...}>
<MyContext value={contextValue}>
  {children}
</MyContext>

// ✅ use() hook — never useContext()
const value = use(MyContext)
```

**React 19 hooks for forms and optimistic UI:**

```tsx
// useActionState — for create/add forms (replaces deprecated useFormState)
const [errors, formAction] = useActionState(
  async (_prev: FieldErrors, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData))
    if (!result.success) return result.error.flatten().fieldErrors
    await mutation.mutateAsync(result.data)
    return {}
  },
  {}
)
// <form action={formAction}> — auto-resets on success

// useFormStatus — MUST live in a child component inside the form
function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type='submit' disabled={pending}>Submit</Button>
}

// useOptimistic — instant UI feedback before server confirms
const [optimisticDeleted, setOptimisticDeleted] = useOptimistic(false, (_, v: boolean) => v)
const handleDelete = () => {
  startTransition(async () => {
    setOptimisticDeleted(true)
    try { await deleteItem.mutateAsync(id) } catch { /* reverts automatically */ }
  })
}
```

**Manual memoization:** Keep `memo()`, `useMemo`, `useCallback` — React Compiler is NOT enabled by default in Next.js 16.

---

### Global UI State (Zustand)

**i18n approach determines what goes in Zustand:**

| i18n library | Locale in Zustand? | Reason |
|:-------------|:-------------------|:-------|
| **next-intl** (URL routing, e.g. `/fr/…`) | ❌ No — never | next-intl owns locale via URL and middleware; storing it in Zustand creates a split source of truth |
| **react-i18next** (client-side, no URL routing) | ✅ Yes — persist in Zustand | No URL ownership; Zustand is the single source of truth. Sync with `i18n.changeLanguage()` on mount. |

**Zustand template (next-intl project — theme only):**

```ts
// src/lib/store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface AppState {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'app-store', storage: createJSONStorage(() => localStorage) }
  )
)
```

Add `src/lib/store.ts` to the files-to-generate list.

---

### Forms — React Hook Form + Zod

**Two patterns — use the right one per context:**

| Context | Pattern |
|:--------|:--------|
| Create / add form (uncontrolled, no pre-fill) | `useActionState` + `<form action={...}>` |
| Edit / dialog form (controlled, pre-filled data) | React Hook Form + `zodResolver` |

```tsx
// Edit form (React Hook Form + Zod)
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1), email: z.string().email() })
type FormValues = z.infer<typeof schema>

function EditDialog({ item }: { item: Item }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: item.name, email: item.email },
  })
  const onSubmit = async (data: FormValues) => { await updateMutation.mutateAsync(data) }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Label htmlFor='name'>Name</Label>
      <Input id='name' {...form.register('name')} />
      {form.formState.errors.name && <p role='alert'>{form.formState.errors.name.message}</p>}
      <SubmitButton />
    </form>
  )
}
```

**Zod validates at the API service boundary** — all `apiClient` responses must be parsed through a Zod schema before use. Never trust raw response data.

---

### Component Patterns

**CVA for variant-based components:**

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva('inline-flex items-center font-medium transition-colors', {
  variants: {
    variant: {
      primary: 'bg-[--color-primary] text-white hover:bg-[--color-primary-dark]',
      ghost: 'text-[--color-primary] hover:bg-[--color-primary]/10',
    },
    size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', lg: 'h-12 px-6' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

type ButtonProps = ComponentPropsWithRef<'button'> & VariantProps<typeof buttonVariants>

function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
```

**Memoize Client Components in lists** (parent re-renders frequently):

```tsx
export const ItemCard = memo(function ItemCard({ item }: Readonly<{ item: Item }>) {
  return <div>...</div>
})
```

**PageLoader with proper accessibility:**

```tsx
export function PageLoader() {
  return (
    // ⚠️ Use <output> (not <div role='status'>) — Biome useSemanticElements enforces native elements
    <output aria-label='Loading' className='flex min-h-[50vh] items-center justify-center'>
      <div className='h-8 w-8 animate-spin rounded-full border-4 border-[--color-primary] border-t-transparent' aria-hidden='true' />
    </output>
  )
}
```

---

### Mobile-First Layout (mandatory)

**Always write base styles for mobile, then scale up with breakpoint prefixes:**

```tsx
// ✅ CORRECT — mobile base, expand upward
<div className='flex flex-col gap-4 sm:flex-row sm:gap-6 lg:gap-8'>
<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>

// ❌ WRONG — desktop base with mobile override
<div className='flex flex-row gap-8 max-sm:flex-col'>
```

**Header burger menu (required for WCAG AA):**

```tsx
// Mobile: burger visible (< md), nav hidden
// Desktop: burger hidden (md:hidden), nav visible (hidden md:flex)
// ⚠️ burgerRef must be typed as useRef<HTMLButtonElement>
// ⚠️ menuRef must be typed as useRef<HTMLDialogElement> (not HTMLDivElement)
<button
  ref={burgerRef}
  aria-label={open ? 'Close menu' : 'Open menu'}
  aria-expanded={open}
  aria-controls='mobile-nav'
>
// ⚠️ Use native <dialog open> NOT <div role='dialog' aria-modal='true'>
// Biome useSemanticElements rule rejects role='dialog' on <div>
<dialog id='mobile-nav' open>
```

Burger menu closes on: link click, `Escape` key, outside click. On open: focus moves to first focusable item. On close via `Escape`: focus returns to burger button.

---

### Data Fetching Patterns (App Router)

**Server Components — preferred pattern for all data access:**

```tsx
// Parallel fetch — always prefer over sequential await
export default async function Page() {
  const [users, stats] = await Promise.all([fetchUsers(), fetchStats()])
  return <Dashboard users={users} stats={stats} />
}
```

**`React.cache()` — deduplicate across page + generateMetadata:**

```ts
// src/lib/data.ts
import 'server-only'
import { cache } from 'react'

// Wrapped: called twice (page + generateMetadata) → only one DB/API call
export const getUser = cache(async (id: string) => {
  return apiClient.GET('/api/v1/users/{id}', { params: { path: { id } } })
})
```

**Streaming with Suspense — granular boundaries:**

```tsx
// page.tsx — Server Component
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Page() {
  return (
    <main>
      <StaticContent />
      {/* Stream slow data independently */}
      <Suspense fallback={<Skeleton className='h-32 w-full' />}>
        <SlowDynamicComponent />
      </Suspense>
    </main>
  )
}
```

Prefer granular `<Suspense>` over `loading.tsx` when data is uncached/runtime — `loading.tsx` cannot cover layouts that call `cookies()` or `headers()`.

**Pass server Promises to client with `use()` (React 19):**

```tsx
// page.tsx (Server Component) — start fetch, don't await
export default function Page() {
  const promise = fetchSlowData() // no await
  return <ClientComponent dataPromise={promise} />
}

// ClientComponent.tsx ('use client')
function ClientComponent({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // suspends until resolved
  return <div>{data.name}</div>
}
```

---

### Caching Model (v16 — mandatory understanding)

**Critical: `fetch()` is NOT cached by default in v16.** All routes are dynamic-first.

| Strategy | Syntax | When to use |
|:---------|:-------|:-----------|
| Dynamic (default) | `fetch(url)` | Real-time data, personalized |
| Static | `fetch(url, { cache: 'force-cache' })` | Immutable/rarely changing |
| ISR | `fetch(url, { next: { revalidate: 60 } })` | Periodic refresh |
| On-demand invalidation | `revalidateTag('tag')` / `revalidatePath('/route')` | Mutation-triggered |

**`use cache` directive (stable in v16, requires `cacheComponents: true`):**

```ts
// next.config.ts — opt in
const nextConfig: NextConfig = {
  cacheComponents: true, // enables 'use cache' directive
}
```

```tsx
// Cache a Server Component
'use cache'
import { cacheLife, cacheTag } from 'next/dist/server/use-cache/cache-life'

export async function ProductList() {
  cacheLife('hours') // stale 1h, revalidate 1h
  cacheTag('products') // invalidate with revalidateTag('products')
  const products = await fetchProducts()
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>
}
```

**Constraints for `use cache`:**
- Cannot call `cookies()` or `headers()` inside — read them outside and pass as arguments
- On serverless: entries are ephemeral per-request; use `use cache: remote` for cross-request persistence

**`unstable_cache` — still valid, but `use cache` is the forward-looking API for v16.**

---

### Server Actions

```tsx
// src/app/[feature]/actions.ts
'use server'
import { revalidateTag } from 'next/cache'

export async function createItem(formData: FormData) {
  const data = schema.parse(Object.fromEntries(formData))
  const { error } = await apiClient.POST('/api/v1/items', { body: data })
  if (error) throw new Error('Failed to create item')
  revalidateTag('items') // invalidate cache
}
```

```tsx
// In a Server Component form
import { createItem } from './actions'

export default function CreateForm() {
  return (
    <form action={createItem}>
      <input name='name' />
      <SubmitButton />  {/* 'use client' child with useFormStatus */}
    </form>
  )
}
```

**Rules:**
- Server Actions must be in separate files with `'use server'` at the top, OR in a file-level `'use server'` module
- Always validate input with Zod before any DB/API call
- Always call `revalidateTag` or `revalidatePath` after mutations
- For expected errors: return `{ error: string }` — do not `throw`; use `throw` only for unexpected errors

---

### SEO — Metadata and Viewport

```tsx
// src/app/[feature]/page.tsx
import type { Metadata } from 'next'
import { getUser } from '@/lib/data'

// generateViewport is NOW a separate export from generateMetadata
export { generateViewport } from '@/lib/default-viewport'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const user = await getUser(id) // React.cache() deduplicates this call
  return {
    title: `${user.name} — My App`,
    description: user.bio,
    openGraph: { title: user.name, images: [user.avatar] },
  }
}
```

```ts
// src/lib/default-viewport.ts
import type { Viewport } from 'next'
export const generateViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#YOUR_PRIMARY_COLOR', // replace with your brand primary color
}
```

**Root layout metadata:**

```ts
// src/app/layout.tsx
export const metadata: Metadata = {
  title: { template: '%s — App Name', default: 'App Name' },
  description: 'Default description',
  robots: { index: true, follow: true },
}
```

---

### Images — next/image

```tsx
import Image from 'next/image'

// Local image — width/height/blurDataURL inferred automatically
import logo from '@/public/logo.svg'
<Image src={logo} alt='Logo' priority />

// Remote image — width/height required, or use fill
<Image
  src={user.avatarUrl}
  alt={user.name}
  width={64}
  height={64}
  className='rounded-full'
/>
```

**`next.config.ts` — remote images allowlist (use `remotePatterns`, never `domains`):**

```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-cdn.example.com',
      pathname: '/uploads/**', // specific path — avoid wildcards
    },
  ],
},
```

**Rules:**
- Add `priority` to the LCP image (above-the-fold hero images)
- Never use `<img>` directly — always `next/image` for automatic optimization
- `images.domains` is deprecated since v14 — use `remotePatterns` exclusively

---

### Fonts — next/font/google

```tsx
// src/app/layout.tsx — declare at MODULE SCOPE (not inside component)
import { Ubuntu } from 'next/font/google'

// weight is REQUIRED for non-variable fonts like Ubuntu
const ubuntu = Ubuntu({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ubuntu', // use CSS variable for Tailwind integration
})

export default function RootLayout({ children }) {
  return (
    <html lang='en' className={ubuntu.variable} suppressHydrationWarning>
      <body className='font-sans'>{children}</body>
    </html>
  )
}
```

```css
/* globals.css — map font variable to Tailwind */
@import 'tailwindcss';

@theme {
  --font-sans: var(--font-ubuntu), Verdana, sans-serif;
}
```

Fonts are self-hosted at build time — no Google requests at runtime.

---

### React Compiler (stable in v16)

`reactCompiler` is **stable** in Next.js 16 — not experimental. Top-level config key, no `experimental` wrapper.

```ts
// next.config.ts
const nextConfig: NextConfig = {
  reactCompiler: true, // stable — auto-memoizes components and hooks
}
```

Still requires `babel-plugin-react-compiler` as a devDependency:

```bash
npm install -D babel-plugin-react-compiler
```

When enabled: **remove manual `memo()`, `useMemo`, `useCallback`** — the compiler handles memoization automatically. Do not mix manual and compiler memoization.

Opt-in mode (annotate components selectively):

```ts
reactCompiler: { compilationMode: 'annotation' }
// then add 'use memo' or 'use no memo' directives per component
```

---

### Directory Structure

```
src/
├── app/
│   ├── layout.tsx              # Root SC: <html>, <body>, Ubuntu font, <Providers>, suppressHydrationWarning
│   ├── providers.tsx           # 'use client': QueryClientProvider + ThemeProvider
│   ├── page.tsx                # Home (Server Component)
│   ├── not-found.tsx           # 404
│   ├── error.tsx               # 'use client', unstable_retry prop (v16)
│   ├── loading.tsx             # Root Suspense fallback
│   ├── globals.css             # @import 'tailwindcss' + project CSS vars + font var
│   └── [feature]/
│       ├── page.tsx            # SC, async, await params/searchParams
│       ├── loading.tsx         # Segment Suspense fallback
│       ├── error.tsx           # 'use client', unstable_retry
│       ├── actions.ts          # 'use server' — Server Actions, mutations, revalidation
│       └── generateMetadata.ts # SEO (+ generateViewport separate export)
├── components/
│   ├── ui/                     # shadcn/ui (CLI — never hand-write)
│   ├── ai-elements/            # AI Elements (CLI — never hand-write)
│   ├── layout/
│   │   ├── header.tsx          # Responsive + burger menu (WCAG AA)
│   │   └── footer.tsx
│   └── shared/
│       └── page-loader.tsx     # role="status", aria-label, aria-hidden on spinner
├── lib/
│   ├── utils.ts                # cn() = clsx + tailwind-merge
│   ├── query-client.ts         # QueryClient with staleTime/gcTime/retry
│   ├── data.ts                 # React.cache() wrapped fetchers (import 'server-only')
│   ├── default-viewport.ts     # generateViewport export (themeColor: brand primary color)
│   └── store.ts                # Zustand (theme; locale only if using react-i18next — see Zustand section)
├── hooks/                      # Custom 'use client' hooks
├── types/
│   └── api.types.ts            # Generated by openapi-typescript (git-ignored)
├── api/
│   └── client.ts               # openapi-fetch createClient<paths>({ baseUrl: '/' })
└── middleware.ts               # next-intl locale detection (if i18n needed)
```

### Files to Generate

**Configuration (always):**
- `package.json` — scripts: `dev`, `dev:turbo`, `build`, `start`, `lint`, `typecheck`, `types`, `test`, `test:run`
- `next.config.ts` — rewrites (`/api → BACKEND_URL`), security headers (incl. CSP), `output: "standalone"`, `poweredByHeader: false`
- `postcss.config.mjs` — Tailwind v4 setup (`@tailwindcss/postcss` plugin — **not** `tailwind.config.js`)
- `tsconfig.json` — strict mode, path alias `@/*` → `./src/*`
- `components.json` — shadcn config (style: default, baseColor: slate, tailwind v4)
- `.env.local.example` — placeholder values ONLY (e.g. `BACKEND_URL=http://<host>:<port>`). Real URLs, passwords, tokens, or connection strings are forbidden even in example files.
- `.gitignore` — generate the complete template below (do NOT delegate to another skill). This is **non-negotiable and must be the first file created**.
- `eslint.config.mjs` — default Next.js ESLint config. Add `sort-imports: off` override for CSS files (Tailwind v4 import order is significant).
  - **Alternative:** replace with Biome (see "Biome as ESLint replacement" section below) — generates `biome.json` instead of `eslint.config.mjs`.

**App Router (always):**
- `src/app/layout.tsx` — Server Component: Ubuntu font via `next/font/google`, `await headers()`, `<Providers>`, `suppressHydrationWarning` on `<html>`
- `src/app/providers.tsx` — `'use client'`: `QueryClientProvider` + `ThemeProvider` (never import next-themes in a Server Component)
- `src/app/globals.css` — `@import 'tailwindcss'` (v4 syntax) + project CSS variables (see `references/brand-config.md` for template)
- `src/app/page.tsx` — minimal home page
- `src/app/not-found.tsx` — 404 page
- `src/app/error.tsx` — `'use client'`, prop `unstable_retry: () => void` (NOT `reset` — breaking change in v16)
- `src/app/loading.tsx` — `<PageLoader />`

**Shared infrastructure (always):**
- `src/app/providers.tsx` — `'use client'`: `QueryClientProvider` + `ThemeProvider` (both here — never in layout.tsx)
- `src/lib/utils.ts` — `cn()` utility
- `src/lib/query-client.ts` — QueryClient with stale/gc times and smart retry
- `src/lib/data.ts` — `import 'server-only'` + `React.cache()` wrapped data fetchers
- Install `server-only` package: `npm install server-only` — add to `dependencies` (not `devDependencies`). Apply `import 'server-only'` at the top of **any file that must never reach the client bundle** (secrets access, DB calls, internal API calls).
- `src/lib/default-viewport.ts` — `generateViewport` with project primary `themeColor`
- `src/lib/store.ts` — Zustand store (theme only, persisted localStorage)
- `src/api/client.ts` — openapi-fetch `createClient<paths>({ baseUrl: '/' })`
- `src/components/layout/header.tsx` — responsive, burger menu with focus management
- `src/components/shared/page-loader.tsx` — `role="status"`, `aria-label`, spinner `aria-hidden`

**Per feature** (repeat for each feature requested):
- `src/app/[feature]/page.tsx` — Server Component, `async`, `await params` (v16: params is a `Promise`)
- `src/app/[feature]/loading.tsx` — skeleton or `<PageLoader />`
- `src/app/[feature]/error.tsx` — `'use client'`, prop `unstable_retry` (NOT `reset`)
- `src/components/[feature]/[feature]-list.tsx` — Client Component if interactive

Read `references/feature-template.md` for copy-paste templates for each layer.

**If AI chat is needed:**
- `src/app/chat/page.tsx` — wraps AI Elements `<Conversation>`
- `src/components/chat/chat-interface.tsx` — `'use client'`, `useChat` with `DefaultChatTransport`
- Install AI Elements: `npx ai-elements@latest` (or `npx shadcn@latest add <url>`)

Read `references/ai-chat-template.md` for the full AI chat setup.

### next.config.ts Template

```ts
import type { NextConfig } from 'next'

// BACKEND_URL must be set in .env.local — never hardcode a URL here
if (!process.env.BACKEND_URL && process.env.NODE_ENV === 'production') {
  throw new Error('BACKEND_URL environment variable is required in production')
}

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,

  // Optional: enable React Compiler for auto-memoization (remove memo/useMemo/useCallback)
  // reactCompiler: true,

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8001'}/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            // Adapt to project — at minimum block inline scripts and restrict origins
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",   // 'unsafe-inline' needed for Next.js inline chunks — tighten with nonce in prod
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### Biome as ESLint replacement (optional)

When the user prefers **Biome** over ESLint, generate `biome.json` instead of `eslint.config.mjs`. Remove the `eslint`, `eslint-config-next`, and `@eslint/*` packages from `package.json`.

**Critical: `tsconfig.json` and `next-env.d.ts` MUST be in `files.ignore`** — `next build` auto-modifies these files (adds `target: ES2017`, expands arrays, generates double-quoted imports). Biome's formatter will then flag them and break `pnpm lint`/`pnpm lint:fix`.

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "style": {
        "useImportType": "error",
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "asNeeded"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      ".next",
      "dist",
      "*.tsbuildinfo",
      "next-env.d.ts",
      "tsconfig.json"
    ]
  }
}
```

Add to `package.json` scripts:
```json
"lint": "biome check .",
"lint:fix": "biome check --write .",
"format": "biome format --write ."
```

**Biome JSX suppression caveat — `biome-ignore` does NOT work mid-JSX expression:**

```tsx
// ❌ BROKEN — suppression has no effect inside .map() JSX expression
{items.map((item, i) => (
  // biome-ignore lint/suspicious/noArrayIndexKey: ...
  <Item key={i} />
))}

// ✅ CORRECT — use a stable composite key instead
{items.map((item, i) => (
  <Item key={`${item.role}-${i}-${item.id}`} />
))}
```

---

### postcss.config.mjs Template (Tailwind v4)

Tailwind v4 uses PostCSS — there is **no `tailwind.config.js`**. Use `@import 'tailwindcss'` in CSS.

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

```css
/* src/app/globals.css */
@import 'tailwindcss';

/* Project CSS variables below — see references/brand-config.md for template */
```

Install: `npm install -D tailwindcss @tailwindcss/postcss`

**Do not use `@tailwind base/components/utilities`** — that is Tailwind v3 syntax and will break v4.

### TanStack Query — QueryClient Config

```ts
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status
        if (status !== undefined && status < 500) return false
        return failureCount < 2
      },
    },
  },
})
```

### Type-Safe API Client

```ts
// src/api/client.ts
import createClient from 'openapi-fetch'
import type { paths } from '@/types/api.types'

// Types are generated via: npm run types
// Requires a running backend at BACKEND_URL
export const apiClient = createClient<paths>({ baseUrl: '/' })
```

Add to `package.json` scripts:
```json
"types": "openapi-typescript http://localhost:8001/api/v1/openapi.json -o src/types/api.types.ts"
```

Add `src/types/api.types.ts` to `.gitignore` (generated artifact).

### Accessibility Rules (WCAG 2.1 AA — enforce in every component)

- Semantic HTML: `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>` — never `<div>` for structure
- `aria-label` on all icon-only buttons and `<nav>` elements
- `aria-hidden="true"` on decorative Lucide icons
- `aria-live="polite"` on loading states and streaming text
- Responsive header: burger visible `< md`, nav visible `md+`
- Burger menu closes on: link click, `Escape` key, outside click
- Every `<input>` has an associated `<Label>`
- Disabled state on submit buttons during async operations (not opacity trick)

### .gitignore Template (mandatory — paste verbatim)

```gitignore
# ─── Dependencies ────────────────────────────────────────────────────────────
node_modules/
.pnp
.pnp.js
.yarn/

# ─── Next.js ─────────────────────────────────────────────────────────────────
.next/
out/

# ─── Build output ────────────────────────────────────────────────────────────
build/
dist/

# ─── Environment & Secrets ───────────────────────────────────────────────────
# Block ALL env files. Only .example and .sample variants are safe to commit.
# NEVER put real credentials in .env.*.example files — use placeholder values.
.env
.env.*
!.env.*.example
!.env.*.sample
!.env.example
!.env.sample

# Credential and key files
*.pem
*.key
*.p12
*.pfx
*.crt
*.cer
*.jks
.netrc
.htpasswd
serviceAccountKey.json
google-credentials.json
*credentials*.json
*secrets*.json
*secret*.yaml
*secret*.yml

# ─── Logs ────────────────────────────────────────────────────────────────────
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
*.log

# ─── TypeScript ──────────────────────────────────────────────────────────────
*.tsbuildinfo
next-env.d.ts

# ─── OS ──────────────────────────────────────────────────────────────────────
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
Desktop.ini

# ─── IDE ─────────────────────────────────────────────────────────────────────
.idea/
.vscode/settings.json
.vscode/launch.json
*.suo
*.ntvs*
*.njsproj
*.sln

# ─── Prisma ──────────────────────────────────────────────────────────────────
prisma/generated/

# ─── Generated types (rebuild via pnpm types) ────────────────────────────────
src/types/api.types.ts
```

### Security Rules

**CRITICAL — enforce before writing any other file:**

1. **`.gitignore` is always the first file created** — no exceptions.
2. **Never hardcode credentials anywhere** — not in source code, not in comments, not in documentation, not in CLAUDE.md files. This includes: passwords, API keys, tokens, connection strings with credentials, private URLs.
3. **`.env.local.example` uses placeholder values only** — format: `VAR_NAME=<description-of-value>` or `VAR_NAME=your-value-here`. Real values are forbidden even for local dev defaults.
4. **All secrets in `.env.local`** — git-ignored, never committed.
5. **Validate API responses through Zod** before using in components.
6. **No `dangerouslySetInnerHTML`** without explicit sanitization.
7. **Streamdown**: enable HTML sanitization when rendering agent output.

**Security audit — run before presenting to user:**
```bash
# No credentials or real URLs in any committed file
grep -rn "password\|secret\|token\|://.*:.*@" . \
  --include="*.ts" --include="*.tsx" --include="*.md" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=.next
# All .env* files except .example/.sample are git-ignored
git check-ignore .env .env.local .env.production
```

---

## Step 7 — Compliance Review

Run these checks in order. Fix issues before presenting results to user.

**Automated checks:**
```bash
npm run lint          # ESLint (next lint) or Biome (biome check .) — must exit 0
npm run typecheck     # tsc --noEmit — must exit 0
npm run test:run      # vitest run — all pass (if tests exist)
npm run build         # next build — must succeed
# If using Biome, run lint AFTER build — next build auto-modifies tsconfig.json and generates
# next-env.d.ts; these must be in biome.json files.ignore or lint will fail post-build.
```

**Checklist:**
**Next.js 16 breaking changes:**
- [ ] `fetch()` calls that need caching have explicit `{ cache: 'force-cache' }` or `{ next: { revalidate: N } }` — no silent v14 default
- [ ] Dynamic route `params` AND `searchParams` typed as `Promise<{...}>` and `await`-ed
- [ ] `error.tsx` uses `unstable_retry` prop — NOT deprecated `reset`
- [ ] `headers()` and `cookies()` are `await`-ed
- [ ] `ThemeProvider` is in `src/app/providers.tsx` (`'use client'`) — never imported directly in Server Component
- [ ] `globals.css` uses `@import 'tailwindcss'` (v4) — NOT `@tailwind base/components/utilities` (v3)
- [ ] `postcss.config.mjs` exists with `@tailwindcss/postcss` plugin
- [ ] `images.remotePatterns` used — NOT deprecated `images.domains`
- [ ] `generateViewport` is a **separate** export from `generateMetadata`
- [ ] Ubuntu font: `weight` array specified, declared at module scope, `variable` CSS var used

**Structure & config:**
- [ ] File layout matches project type: `frontend/` for monorepo, root-level `src/` for standalone app
- [ ] `next.config.ts` has rewrites, all security headers (incl. CSP), `output: "standalone"`, `poweredByHeader: false`
- [ ] `BACKEND_URL` read from env — never hardcoded in `next.config.ts`
- [ ] `frontend/src/types/api.types.ts` is in `.gitignore` (generated artifact)
- [ ] No hardcoded API URLs in any source file

**React 19 patterns:**
- [ ] No `forwardRef` — all components use `ComponentPropsWithRef<T>`
- [ ] shadcn/ui CLI-generated components migrated from `forwardRef` to `ComponentPropsWithRef`
- [ ] `<DialogContent>` has `<DialogDescription>` or `aria-describedby={undefined}`
- [ ] Context providers use shorthand `<MyContext value={...}>` — never `<MyContext.Provider>`
- [ ] Context consumers use `use(MyContext)` — never `useContext()`
- [ ] `useActionState` used for create forms (not deprecated `useFormState`)
- [ ] `useFormStatus` lives in a child component inside the form
- [ ] React Hook Form + Zod used for edit/dialog forms with pre-filled data

**State & data:**
- [ ] Zustand locale handling matches i18n library: **next-intl** → locale NOT in Zustand (URL-managed); **react-i18next** → locale persisted in Zustand (Zustand is single source of truth, synced via `i18n.changeLanguage()`)
- [ ] TanStack Query `QueryClient` has `staleTime: 5min`, `gcTime: 10min`, no retry on 4xx
- [ ] All API responses validated through Zod before use — never trust raw `response.data`

**Layout & accessibility:**
- [ ] All pages have `loading.tsx` and `error.tsx`
- [ ] `ThemeProvider` in root `app/layout.tsx` only — never in `[locale]` or dynamic-segment layout
- [ ] Header has burger menu: `aria-expanded`, `aria-controls`, focus trap, `Escape` closes, focus restores
- [ ] Mobile menu uses `<dialog open>` — NOT `<div role='dialog'>` (Biome `useSemanticElements` rejects it). `menuRef` typed as `useRef<HTMLDialogElement>`.
- [ ] All Tailwind classes mobile-first (`sm:`, `md:`, `lg:` upward — never `max-sm:` overrides)
- [ ] All icon-only buttons have `aria-label`, decorative icons have `aria-hidden="true"`
- [ ] Loading states use native `<output aria-label="...">` (preferred) or `aria-live="polite"` — never `<div role="status">` (Biome `useSemanticElements` rejects it)
- [ ] Every `<input>` has an associated `<Label htmlFor="...">`

**AI / streaming (if applicable):**
- [ ] AI chat uses AI Elements — not custom chat UI from scratch
- [ ] Vercel AI SDK v6 API: `sendMessage()`, `status` field, `message.parts` — not v5 (`append`, `isLoading`, `message.content`)
- [ ] Streamdown used for markdown rendering — not `react-markdown`

**Final:**
- [ ] `README.md` created at project root

**Security audit:**
```bash
grep -r "#000000" src --include="*.ts" --include="*.tsx" --include="*.css"
grep -r "http://\|https://" src --include="*.ts" --include="*.tsx"
# No matches expected (except JSDoc or type-only comments)
```

---

## Step 8 — Generate README.md

**README.md is mandatory — generate it as part of the scaffold, not as an afterthought.**

Create `README.md` at the project root with all sections below. Do not wait for user to ask:

- Project description and purpose
- Tech stack table (framework, language, styling, ORM/backend, i18n, auth, lint)
- Prerequisites (Node 22+, pnpm/npm/bun, external services)
- Quick start: clone → install → `cp .env.local.example .env.local` → edit vars → DB setup → `pnpm dev`
- Scripts table (dev, build, lint, typecheck, types, test, db:*)
- Routes table (URL → description)
- Project structure overview (key directories only, one-line descriptions)
- Architecture decisions: App Router rationale, Server vs Client component split, data flow diagram, any notable trade-offs
- Backend/database connection instructions (env vars, type generation if applicable)

**Template:**

```markdown
# [App Name]

[One-sentence description of what the app does and why it exists.]

## Tech stack

| Layer | Technology |
|:------|:-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| ...   | ...        |

## Prerequisites

- Node.js 22+
- pnpm 9+
- [Other services]

## Quick start

\`\`\`bash
pnpm install
cp .env.local.example .env.local
# Edit .env.local — see comments for each variable
pnpm dev  # → http://localhost:3000
\`\`\`

## Scripts

| Script | Description |
...

## Routes

| URL | Description |
...

## Project structure

\`\`\`
src/
├── app/         # App Router pages and layouts
├── components/  # UI components
├── lib/         # Utilities, DAL, Prisma client
├── actions/     # Server Actions ('use server')
└── ...
\`\`\`

## Architecture decisions

...
```

---

## Reference Files

| File | When to read |
|:-----|:------------|
| `references/feature-template.md` | When scaffolding any page or feature |
| `references/ai-chat-template.md` | When the project needs AI chat |
| `references/brand-config.md` | Generic design system template — customize CSS vars for your project |
