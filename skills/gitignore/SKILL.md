---
name: gitignore
description: >
  Generate a production-ready .gitignore for Node.js projects. Supports three
  presets via the args parameter: "react-vite" for a React + Vite SPA,
  "nestjs" for a NestJS backend, and "pnpm-monorepo" for a pnpm workspace root
  (single file, replaces per-package files). Use this skill from other skills
  whenever a .gitignore needs to be created — do not inline the template.
compatibility:
  tools:
    - Write
    - Edit
    - Bash
---

# Gitignore Skill

You are generating a `.gitignore` file. Read the args to determine which preset to use, then write the file and apply the rules below.

## Presets

### `react-vite` — React 19 SPA with Vite

Write to `$FRONTEND_DIR/.gitignore` (or `./gitignore` if standalone):

```gitignore
# ─── Dependencies ────────────────────────────────────────────────────────────
node_modules/

# ─── Build output ────────────────────────────────────────────────────────────
dist/
build/

# ─── TypeScript ──────────────────────────────────────────────────────────────
*.tsbuildinfo

# ─── Test coverage ───────────────────────────────────────────────────────────
coverage/
.nyc_output/

# ─── Environment variables ───────────────────────────────────────────────────
# .env.example is committed — it is a template, not a secret
.env
.env.local
.env.*.local
.env.test
.env.production

# ─── Local override files (Vite) ─────────────────────────────────────────────
*.local

# ─── Logs ────────────────────────────────────────────────────────────────────
*.log
npm-debug.log*
pnpm-debug.log*

# ─── OS / Editor ─────────────────────────────────────────────────────────────
.DS_Store
Thumbs.db
.idea/
```

---

### `nestjs` — NestJS backend

Write to `$BACKEND_DIR/.gitignore` (or `./gitignore` if standalone):

```gitignore
# ─── Dependencies ────────────────────────────────────────────────────────────
node_modules/

# ─── Build output ────────────────────────────────────────────────────────────
dist/
build/

# ─── TypeScript ──────────────────────────────────────────────────────────────
*.tsbuildinfo

# ─── Test coverage ───────────────────────────────────────────────────────────
coverage/
.nyc_output/

# ─── Environment variables ───────────────────────────────────────────────────
# .env.example is committed — it is a template, not a secret
.env
.env.local
.env.*.local
.env.test
.env.production

# ─── Logs ────────────────────────────────────────────────────────────────────
*.log
npm-debug.log*
pnpm-debug.log*

# ─── OS / Editor ─────────────────────────────────────────────────────────────
.DS_Store
Thumbs.db
.idea/
```

---

### `pnpm-monorepo` — pnpm workspace root (single file for all packages)

Write to the **root** `.gitignore`. Then **delete** any per-package `.gitignore` files — git patterns apply recursively, so root patterns already match `$FRONTEND_DIR/dist/`, `$BACKEND_DIR/coverage/`, etc.

```gitignore
# ─── Dependencies ────────────────────────────────────────────────────────────
node_modules/

# ─── Build outputs ───────────────────────────────────────────────────────────
dist/
build/

# ─── TypeScript ──────────────────────────────────────────────────────────────
*.tsbuildinfo

# ─── Test coverage ───────────────────────────────────────────────────────────
coverage/
.nyc_output/

# ─── Environment variables ───────────────────────────────────────────────────
# .env.example files are committed — they are templates, not secrets
.env
.env.local
.env.*.local
.env.test
.env.production

# ─── Local override files (Vite) ─────────────────────────────────────────────
*.local

# ─── Logs ────────────────────────────────────────────────────────────────────
*.log
npm-debug.log*
pnpm-debug.log*

# ─── OS / Editor ─────────────────────────────────────────────────────────────
.DS_Store
Thumbs.db
.idea/

# ─── Playwright MCP output ───────────────────────────────────────────────────
.playwright-mcp/
```

---

## Rules that apply to ALL presets

### NEVER gitignore these files

| File | Reason |
|------|--------|
| `pnpm-lock.yaml` | Freezes the entire dependency graph — removing it breaks reproducible installs |
| `.env.example` | Template file — safe to commit, required for onboarding |
| `prisma/migrations/` | Migration history must be tracked |
| `openapi.yaml` | Generated spec committed so frontend can run Orval without the backend |

### .env.test already tracked?

If `.env.test` was committed before this gitignore was added, it stays tracked — `.gitignore` only affects untracked files. Untrack it manually:

```bash
git rm --cached $BACKEND_DIR/.env.test
# Create a template so other devs know the format:
cp $BACKEND_DIR/.env.test $BACKEND_DIR/.env.test.example
# Replace values with placeholders in .env.test.example, then commit it
```

### After writing the file

Run this to confirm the key paths resolve correctly:

```bash
git check-ignore -v dist/ coverage/ .env
# Each line should show: .gitignore:<line>:<pattern>   <path>
```
