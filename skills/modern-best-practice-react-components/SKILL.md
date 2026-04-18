---
name: modern-best-practice-react-components
description: Build clean, modern React components that apply common best practices and avoid common pitfalls like unnecessary state management or useEffect usage
---

# Writing React Components

We're using modern React (19+) and we're following common best practices focused on
clarity, correctness, and maintainability.

## Component Structure & Style

- **PREFER** small, focused components with a single responsibility
- **PREFER** named `function` components over arrow functions
  - Exception: anonymous callbacks, inline render props, and closures
- **PREFER** explicit return types and props typing (TypeScript) where applicable
- Keep components flat and readable; avoid deeply nested JSX
- Group related logic together (event handlers, derived values, helpers)

## State Management

- **AVOID** `useEffect()`
  - See the ["You Might Not Need An Effect" guide](references/you-dont-need-useeffect.md) for detailed guidance
  - **PREFER** deriving values during render instead of synchronizing state
  - Fetch data via TanStack Query (`@tanstack/react-query`)
- **AVOID** unnecessary `useState()` or `useReducer()` usage
  - Derive state from props or other state when possible
  - Localize state to the lowest possible component
- **DO NOT** mirror props in state unless absolutely necessary
- Prefer controlled components over syncing uncontrolled state

## Rendering & Derivation

- **PREFER** computing derived values inline or via helper functions
- Use `useMemo()` sparingly and only for proven performance issues
- **AVOID** premature optimization
- Keep render logic deterministic and free of side effects

## Event Handling

- **AVOID** in-line event handlers in JSX
  - **PREFER**:

    ```tsx
    function handleClick() {
      // ...
    }

    <button onClick={handleClick} />;
    ```

  - Over:
    ```tsx
    <button
      onClick={() => {
        /* ... */
      }}
    />
    ```

- Name handlers clearly (`handleSubmit`, `handleChange`, `handleClose`)
- Keep handlers small; extract complex logic into helpers

## Effects, Data, and Side Effects

- **AVOID** effects for:
  - Derived state
  - Data transformations
  - Event-based logic that can live in handlers
- If side effects are unavoidable, keep them minimal, isolated, and well-documented
- Prefer framework-level or external abstractions (routers, data libraries) over raw effects

## Props & Composition

- **PREFER** composition over configuration
- **AVOID** excessive boolean props; prefer expressive APIs
- Use `children` intentionally and document expected structure
- Keep prop names semantic and predictable
- **ALWAYS** wrap component props with `Readonly<>` in the function signature to enforce immutability:
  ```tsx
  export function Badge({ className, variant, ...props }: Readonly<BadgeProps>) { ... }
  ```
- **NEVER** use array index as a React key — use stable IDs:
  ```tsx
  // ✅
  items.map((item) => <Card key={item.id} ... />)
  // ❌
  items.map((item, i) => <Card key={i} ... />)
  ```
- **NEVER** define components inside another component's render — extract to module level or pass data as props:
  ```tsx
  // ✅ — defined outside
  const MarkdownP = ({ children }: { children?: ReactNode }) => <p className='mb-2'>{children}</p>;
  export function ChatBubble(...) { return <Markdown components={{ p: MarkdownP }} />; }
  // ❌ — defined inside render
  export function ChatBubble(...) { return <Markdown components={{ p: ({ children }) => <p>{children}</p> }} />; }
  ```
- **AVOID** nested ternary expressions — extract to a named helper function:
  ```tsx
  // ✅
  function getStepClass(current: number, id: number) {
    if (current === id) return 'bg-primary text-white';
    if (current > id) return 'bg-primary/20';
    return 'bg-muted';
  }
  // ❌
  className={current === id ? 'bg-primary' : current > id ? 'bg-primary/20' : 'bg-muted'}
  ```
- **USE** `<dialog open>` instead of `<div role="dialog">` for overlays — use `<output>` instead of `<div role="status">` for live regions:
  ```tsx
  // ✅
  <dialog open aria-label="...">...</dialog>
  <output aria-label="Loading">...</output>
  // ❌
  <div role="dialog" aria-modal="true">...</div>
  <div role="status">...</div>
  ```
- **ALWAYS** render `children` explicitly in heading wrapper components (SonarQube a11y rule):
  ```tsx
  // ✅
  export function CardTitle({ className, children, ...props }: ComponentPropsWithRef<'h3'>) {
    return <h3 className={cn('...', className)} {...props}>{children}</h3>;
  }
  ```
- **NEVER** use the `void` operator to discard a Promise in JSX handlers — use a direct function reference:
  ```tsx
  // ✅
  <Button onClick={handleSubmit} />
  // ❌
  <Button onClick={() => void handleSubmit()} />
  ```

## Performance & Stability

- **PREFER** stable references only when required (not by default)
- **AVOID** unnecessary memoization (`memo`, `useCallback`) unless absolutely required
- Keep keys stable and meaningful when rendering lists

## General Principles

- Write code for humans first, compilers second
- Prefer explicitness over cleverness
- Optimize for readability and long-term maintenance
- If a pattern feels complex, reconsider the component boundary
