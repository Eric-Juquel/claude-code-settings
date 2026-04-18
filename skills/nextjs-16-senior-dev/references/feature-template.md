# Feature Template — Next.js 16 App Router

Copy-paste templates for scaffolding pages and features in the App Router. Each feature typically has a Server Component page (for data fetching) and Client Components (for interactivity).

---

## 1. Server Component Page (`src/app/[feature]/page.tsx`)

The page is an `async` Server Component. It fetches data directly — no `useEffect`, no `useState`.

```tsx
// src/app/dashboard/page.tsx
import { apiClient } from '@/api/client'
import { DashboardList } from '@/components/dashboard/dashboard-list'

export const metadata = {
  title: 'Dashboard — My App',
}

export default async function DashboardPage() {
  // Fetch data server-side — safe, no credentials exposed to browser
  const { data, error } = await apiClient.GET('/api/v1/items', {})

  if (error) {
    throw new Error('Failed to load dashboard data')
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-light text-foreground mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Overview of your items.</p>
      {/* Pass server-fetched data to a Client Component */}
      <DashboardList initialItems={data?.items ?? []} />
    </main>
  )
}
```

---

## 2. Loading UI (`src/app/[feature]/loading.tsx`)

Next.js automatically wraps this in a `<Suspense>` boundary.

```tsx
// src/app/dashboard/loading.tsx
import { PageLoader } from '@/components/shared/page-loader'

export default function DashboardLoading() {
  return <PageLoader label="Loading dashboard..." />
}
```

---

## 3. Error Boundary (`src/app/[feature]/error.tsx`)

Must be `'use client'` — Next.js requirement for error boundaries.

```tsx
// src/app/dashboard/error.tsx
'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
        <h2 className="text-xl font-medium text-foreground">Something went wrong</h2>
        <p className="text-muted-foreground max-w-sm">
          We hit a snag loading this page. Try again or contact support if the problem persists.
        </p>
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
      </div>
    </main>
  )
}
```

---

## 4. Interactive Client Component (`src/components/[feature]/[feature]-list.tsx`)

Use `'use client'` only when the component needs interactivity. It receives server-fetched data as props to avoid redundant client-side fetching.

```tsx
// src/components/dashboard/dashboard-list.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { ItemCard } from './item-card'
import { PageLoader } from '@/components/shared/page-loader'

interface Item {
  id: string
  name: string
  status: string
}

interface DashboardListProps {
  initialItems: Item[]
}

export function DashboardList({ initialItems }: DashboardListProps) {
  const [filter, setFilter] = useState<string>('all')

  // Hydrate from server-fetched initialData — avoids loading flash
  const { data, isError } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/items', {})
      if (error) throw new Error('Failed to fetch items')
      return data
    },
    initialData: { items: initialItems },
    staleTime: 5 * 60 * 1000,
  })

  if (isError) {
    return (
      <p role="status" className="text-destructive">
        Failed to load items. Please refresh.
      </p>
    )
  }

  const filtered = data?.items?.filter(
    (item) => filter === 'all' || item.status === filter,
  ) ?? []

  return (
    <section aria-label="Items list">
      {/* Filter controls */}
      <div className="flex gap-2 mb-6" role="group" aria-label="Filter items">
        {['all', 'active', 'archived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No items found. Start by creating your first one.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Items">
          {filtered.map((item) => (
            <li key={item.id}>
              <ItemCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

---

## 5. TanStack Query — Mutation with Invalidation

```tsx
// src/hooks/use-items.ts
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/v1/items/{id}', {
        params: { path: { id } },
      })
      if (error) throw new Error('Failed to delete item')
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
```

---

## 6. openapi-fetch Typed Call Patterns

```ts
// GET with query params
const { data, error } = await apiClient.GET('/api/v1/items', {
  params: { query: { page: 1, limit: 20 } },
})

// GET with path param
const { data, error } = await apiClient.GET('/api/v1/items/{id}', {
  params: { path: { id: '123' } },
})

// POST with body
const { data, error } = await apiClient.POST('/api/v1/items', {
  body: { name: 'New item', status: 'active' },
})

// PUT
const { data, error } = await apiClient.PUT('/api/v1/items/{id}', {
  params: { path: { id: '123' } },
  body: { name: 'Updated name' },
})

// DELETE
const { error } = await apiClient.DELETE('/api/v1/items/{id}', {
  params: { path: { id: '123' } },
})
```

All types are inferred from `src/types/api.types.ts` — no manual interfaces needed.

---

## 7. Server Action Pattern (for form mutations)

Use Server Actions when the mutation comes directly from a form and you want zero client-side JS for the submit path.

```tsx
// src/app/[feature]/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { apiClient } from '@/api/client'
import { z } from 'zod'

const CreateItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export async function createItemAction(formData: FormData) {
  const result = CreateItemSchema.safeParse({ name: formData.get('name') })

  if (!result.success) {
    return { error: z.flattenError(result.error).fieldErrors }
  }

  const { error } = await apiClient.POST('/api/v1/items', {
    body: { name: result.data.name },
  })

  if (error) return { error: { _form: ['Failed to create item'] } }

  revalidatePath('/dashboard')
  return { success: true }
}
```

```tsx
// src/app/[feature]/create-form.tsx
'use client'

import { useActionState } from 'react'
import { createItemAction } from './actions'

export function CreateItemForm() {
  const [state, action, isPending] = useActionState(createItemAction, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="mt-1 w-full rounded border border-border px-3 py-2 text-sm"
          aria-describedby={state?.error?.name ? 'name-error' : undefined}
        />
        {state?.error?.name && (
          <p id="name-error" className="mt-1 text-sm text-destructive" role="alert">
            {state.error.name[0]}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? 'Creating…' : 'Create item'}
      </button>
    </form>
  )
}
```

---

## 8. PageLoader Component (`src/components/shared/page-loader.tsx`)

```tsx
import { Loader2 } from 'lucide-react'

interface PageLoaderProps {
  label?: string
}

export function PageLoader({ label = 'Loading…' }: PageLoaderProps) {
  return (
    <div
      className="flex min-h-[200px] items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
```

---

## 9. Root Layout (`src/app/layout.tsx`)

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/providers'
import { Header } from '@/components/layout/header'
import './globals.css'

// Replace Inter with the project's chosen font (see references/brand-config.md)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'My App',
    template: '%s — My App',
  },
  description: 'My application description',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-background text-foreground antialiased">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

---

## 10. Providers (`src/providers.tsx`)

```tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

## Translation Keys Reference

Use this structure when adding user-facing strings. All user-visible text must be externalised if i18n is enabled.

```ts
// Feature key structure
const keys = {
  '[feature]': {
    title: 'Dashboard',
    subtitle: 'Overview of your items',
    loading: 'Loading…',
    error: 'Something went wrong.',
    empty: 'No items yet. Create your first one to get started.',
    actions: {
      create: 'Create item',
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      save: 'Save changes',
    },
    messages: {
      created: 'Item created successfully',
      updated: 'Item updated successfully',
      deleted: 'Item deleted successfully',
      createError: 'Failed to create item',
      updateError: 'Failed to update item',
      deleteError: 'Failed to delete item',
    },
  },
}
```
