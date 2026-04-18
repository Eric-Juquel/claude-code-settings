# Design System Configuration Template

Copy this template into `src/app/globals.css` and fill in the values for your project's design system.

---

## CSS Variables Template

```css
@import "tailwindcss";

/* ── Project Design Tokens ───────────────────────────── */
:root {
  /* Primary palette — replace with your brand colors */
  --color-primary: #YOUR_PRIMARY;         /* main CTA, links, active states */
  --color-primary-dark: #YOUR_DARK;       /* hover/pressed states */
  --color-primary-light: #YOUR_LIGHT;     /* highlights, accents */
  --color-white: #FFFFFF;

  /* ── shadcn/ui token mapping ─────────────────────── */
  --background: var(--color-white);
  --foreground: var(--color-primary-dark);

  --card: var(--color-white);
  --card-foreground: var(--color-primary-dark);

  --popover: var(--color-white);
  --popover-foreground: var(--color-primary-dark);

  --primary: var(--color-primary);
  --primary-foreground: var(--color-white);

  --secondary: #F1F5F9;             /* slate-100 */
  --secondary-foreground: var(--color-primary-dark);

  --muted: #F1F5F9;
  --muted-foreground: #64748B;      /* slate-500 */

  --accent: var(--color-primary-light);
  --accent-foreground: var(--color-primary-dark);

  --destructive: #DC2626;           /* red-600 */
  --destructive-foreground: var(--color-white);

  --border: #E2E8F0;                /* slate-200 */
  --input: #E2E8F0;
  --ring: var(--color-primary);

  --radius: 0.375rem;

  /* Font — replace with your chosen font variable */
  --font-sans: var(--font-inter), system-ui, sans-serif;
}
```

---

## Font Setup

Replace the font import with your project's chosen Google Font.

```tsx
// src/app/layout.tsx
import { Inter } from 'next/font/google'
// Alternatively: Ubuntu, Roboto, Poppins, Nunito, etc.

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  // For non-variable fonts, add: weight: ['400', '500', '700']
})
```

```css
/* globals.css */
@theme {
  --font-sans: var(--font-sans), system-ui, sans-serif;
}
```

---

## shadcn/ui Token Mapping

| shadcn token | Purpose |
|:-------------|:--------|
| `--primary` | Main CTA buttons, links, focus rings |
| `--primary-foreground` | Text on primary background (usually white) |
| `--foreground` | Default body text color |
| `--background` | Page background |
| `--accent` | Highlights, badges, secondary interactive elements |
| `--accent-foreground` | Text on accent background — verify WCAG AA contrast |
| `--destructive` | Error states, delete actions |
| `--muted` | Disabled states, subtle backgrounds |
| `--muted-foreground` | Subdued text, placeholders |
| `--border` | Card borders, dividers, inputs |

---

## Optional: Brand Gradient

If your design system includes a branded gradient (e.g. for loaders, separators):

```css
.brand-gradient {
  background: linear-gradient(
    90deg,
    var(--color-primary-dark) 0%,
    var(--color-primary) 50%,
    var(--color-primary-light) 100%
  );
}
```

Usage rules:
- For separators, loading bars, and active state indicators only
- Never use as a text background
- Direction: left-to-right or bottom-to-top only

---

## Tailwind Usage Patterns

Always reference tokens via Tailwind classes — never raw hex values in JSX.

```tsx
// ✅ Correct
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Submit
</button>
<p className="text-muted-foreground">Secondary info</p>
<div className="border border-border rounded-lg p-4">Card</div>

// ❌ Wrong — hardcoded hex
<button className="bg-[#0058AB] text-white">Submit</button>
```

---

## WCAG AA Contrast Checklist

Before finalising the palette, verify contrast ratios:
- Body text on background: ≥ 4.5:1
- Large text (≥ 18px bold or ≥ 24px) on background: ≥ 3:1
- Interactive elements (buttons, links) on background: ≥ 3:1

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or Figma plugins to validate.
